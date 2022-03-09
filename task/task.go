package task

import (
	"fmt"
	"github.com/robfig/cron/v3"
	"gonitor/core"
	"gonitor/model"
	"sync"
	"time"
)

const (
	CmdTask  = "cmd"
	HttpTask = "http"
	FileTask = "file"
)

var Manager manager = manager{
	cron: cron.New(),
}

type manager struct {
	cron              *cron.Cron
	TaskList          []*instance
	RunningProcessMap sync.Map //key是logid  value是进程id
}

type instance struct {
	RunningInstances []*runningInstance
	RunningCount     int
	EntryId          cron.EntryID
}

type runningInstance struct {
	ProcessId int
}

func (tm *manager) AddTask(taskId int) error {
	return nil
}

func (tm *manager) DeleteTask(taskId int) error {
	return nil
}

func (ti *instance) Start() {

}

func (ti *instance) Stop() {

}

func (tri *runningInstance) Start(taskModel model.Task) (string, error) {
	taskLogId, err := beforeRun(taskModel)
	if err != nil {
		return "", err
	}
	handler := CreateHandler(taskModel)
	var execTimes int8 = 1
	if taskModel.RetryTimes > 0 {
		execTimes += taskModel.RetryTimes
	}
	var i int8 = 0
	var output string
	for i < execTimes {
		output, err = handler.Run(taskModel, taskLogId)
		if err == nil {
			return output, err
		}
		i++
		if i < execTimes {
			fmt.Println("任务执行失败")
		}
		if taskModel.RetryInterval > 0 {
			time.Sleep(time.Duration(taskModel.RetryInterval) * time.Second)
		} else {
			time.Sleep(time.Duration(i) * time.Minute)
		}
	}
	return output, nil
}

func (tri *runningInstance) Stop() {

}

//beforeRun 运行之前 插入log
func beforeRun(taskModel model.Task) (int64, error) {
	taskLogModel := model.TaskLog{
		TaskId:        taskModel.ID,
		Command:       taskModel.Command,
		Status:        true,
		ExecType:      taskModel.ExecType,
		ExecutionTime: time.Now().Unix(),
	}
	dbRt := core.Db.Create(&taskLogModel)
	if dbRt.Error != nil {
		fmt.Println(dbRt.Error.Error())
		return 0, dbRt.Error
	}
	return taskLogModel.ID, nil
}

//endRun 运行之后  更新输出信息
func endRun(taskLogId int64, output string) error {
	taskLogModel := model.TaskLog{}
	dbRt := core.Db.Where("id = ?", taskLogId).First(&taskLogModel)
	if dbRt.Error != nil {
		return dbRt.Error
	}
	taskLogModel.Output = output
	dbRt = core.Db.Save(&taskLogModel)
	if dbRt.Error != nil {
		return dbRt.Error
	}
	return nil
}
