package task

import (
	"errors"
	"fmt"
	"github.com/jinzhu/gorm"
	"github.com/robfig/cron/v3"
	"gonitor/core"
	"gonitor/model"
	"gonitor/web/ws/subscription"
	"sync"
	"time"
)

const (
	CmdTask  = "cmd"
	HttpTask = "http"
	FileTask = "file"
)

const (
	SkipIfStillRunning     = "skip"
	DelayIfStillRunning    = "delay"
	ParallelIfStillRunning = "parallel"
)

var Manager manager = manager{
	cron: cron.New(),
}

type manager struct {
	cron              *cron.Cron
	TaskList          map[int64]*taskInstance
	RunningProcessMap sync.Map //key是logid  value是进程id
}

func (tm *manager) AddTask(taskId int64) error {
	//先看 如果已经有了 就不需要添加了
	if _, ok := Manager.TaskList[taskId]; ok {
		return errors.New("this task has in cron task")
	}
	taskIns := &taskInstance{
		TaskID:           taskId,
		RunningInstances: nil,
		RunningCount:     0,
		EntryId:          0,
	}
	task := &model.Task{}
	dbRt := core.Db.Where("id = ?", taskId).First(task)
	if dbRt.Error != nil {
		fmt.Println("获取任务信息失败")
		return dbRt.Error
	}
	taskChain, err := wrapTask(ParallelIfStillRunning)
	jobWrapper := NewExecJobWrapper(task)
	entryID, err := Manager.cron.AddJob(task.Schedule, taskChain.Then(jobWrapper))
	if err != nil {
		fmt.Println("cron add fun fail", err)
		return err
	}
	taskIns.EntryId = entryID
	Manager.TaskList[taskId] = taskIns
	return nil
}

//checkTask 检查任务是否可以执行
func checkTask(taskId int64) error {
	taskIns := model.Task{}
	result := core.Db.Where("id = ?", taskId).First(&taskIns)
	if result.Error != nil {
		return errors.New("任务不存在或已被删除")
	}
	if taskIns.IsDisable {
		return errors.New("任务被禁用")
	}
	if taskIns.IsSingleton {
		taskLogIns := model.TaskLog{}
		result = core.Db.Where("task_id = ? AND status = ?", taskId, true).First(&taskLogIns)
		if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return errors.New("单例模式, 上次运行还未结束")
		}
	}
	return nil
}

func (tm *manager) DeleteTask(taskId int) error {
	return nil
}

//beforeRun 运行之前 插入log
func beforeRun(taskModel *model.Task) (*model.TaskLog, error) {
	taskLogModel := &model.TaskLog{
		TaskId:        taskModel.ID,
		Command:       taskModel.Command,
		Status:        true,
		ExecType:      taskModel.ExecType,
		ExecutionTime: time.Now().Unix(),
	}
	dbRt := core.Db.Create(taskLogModel)
	if dbRt.Error != nil {
		fmt.Println(dbRt.Error.Error())
		return taskLogModel, dbRt.Error
	}
	subscription.SendNewTaskLogFormOrm(taskLogModel)
	return taskLogModel, nil
}

//endRun 运行之后  更新输出信息
func endRun(taskLog *model.TaskLog, output string) error {
	taskLogModel := model.TaskLog{}
	taskLog.Output = output
	dbRt := core.Db.Save(&taskLogModel)
	if dbRt.Error != nil {
		return dbRt.Error
	}
	return nil
}

func wrapTask(queueType string) (cron.Chain, error) {
	switch queueType {
	case DelayIfStillRunning:
		return cron.NewChain(cron.DelayIfStillRunning(cron.DefaultLogger)), nil
	case SkipIfStillRunning:
		return cron.NewChain(cron.SkipIfStillRunning(cron.DefaultLogger)), nil
	default:
		return cron.NewChain(cron.Recover(cron.DefaultLogger)), nil
	}
}
