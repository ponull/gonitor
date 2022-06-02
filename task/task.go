package task

import (
	"errors"
	"fmt"
	"github.com/jinzhu/gorm"
	"github.com/robfig/cron/v3"
	"gonitor/core"
	"gonitor/model"
)

const (
	CmdTask  = "cmd"
	HttpTask = "http"
	FileTask = "file"
)

const (
	ParallelIfStillRunning = 0
	SkipIfStillRunning     = 1
	DelayIfStillRunning    = 2
)

var Manager = manager{
	cron:     cron.New(),
	TaskList: map[int64]*taskInstance{},
}

type manager struct {
	cron     *cron.Cron
	TaskList map[int64]*taskInstance
}

// AddTask 添加任务 并启动
func (tm *manager) AddTask(taskId int64) error {
	//先看 如果已经有了 就不需要添加了
	if _, ok := Manager.TaskList[taskId]; ok {
		return errors.New("this task has in cron task")
	}
	task := &model.Task{}
	dbRt := core.Db.Where("id = ?", taskId).First(task)
	if dbRt.Error != nil {
		fmt.Println("query task info fail")
		return dbRt.Error
	}
	//检查任务是否可以执行
	if task.IsDisable {
		return nil
	}
	taskIns := &taskInstance{
		TaskID:           taskId,
		TaskInfo:         task,
		RunningInstances: map[int64]*RunningInstance{},
		RunningCount:     0,
		EntryId:          0,
	}
	return taskIns.start()
}

// StartOnceTask 单独执行的这一次  不加入到cron任务列表中
func (tm *manager) StartOnceTask(taskId int64) (string, error) {
	task := &model.Task{}
	dbRt := core.Db.Where("id = ?", taskId).First(task)
	if dbRt.Error != nil {
		fmt.Println("query task info fail")
		return "", dbRt.Error
	}
	jobWrapper := NewExecJobWrapper(task)
	jobWrapper.Run()
	return jobWrapper.taskLog.Output, nil
}

// UpdateTask 更新cron的任务，并启动
func (tm *manager) UpdateTask(taskId int64) error {
	tm.DeleteTask(taskId)
	err := tm.AddTask(taskId)
	if err != nil {
		return err
	}
	return nil
}

// DeleteTask 从cron删除任务
func (tm *manager) DeleteTask(taskId int64) {
	if taskIns, ok := tm.TaskList[taskId]; ok {
		taskIns.stop()
		delete(tm.TaskList, taskId)
	}
}

func (tm *manager) Start() error {
	var taskList []model.Task
	result := core.Db.Where("is_disable = ?", false).Find(&taskList)
	if result.Error != nil && !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		panic(result.Error)
	}
	for _, taskItem := range taskList {
		err := tm.AddTask(taskItem.ID)
		if err != nil {
			continue
		}
	}
	tm.cron.Start()
	//计算任务 并实时推送
	//todo 单独创建一个cron 用于定时记录任务信息 这里不写数据库  只是记录  websocket订阅推送都直接查询内存里面的，不去数据库查， 解决并发等一系列的问题
	return nil
}

func (tm *manager) Stop() error {
	//首先删除所以EntryID  然后将运行实例都杀死
	for _, taskIns := range tm.TaskList {
		taskIns.stop()
	}
	return nil
}

func (tm *manager) recordTaskInfo() {
	for _, taskIns := range tm.TaskList {
		fmt.Println(taskIns)
	}
}
