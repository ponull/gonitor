package handler

import (
	"gonitor/model"
	task2 "gonitor/task"
)

type ExecHandler interface {
	Run(task *model.Task, taskLog *model.TaskLog) (string, error)
}

func CreateHandler(taskModel *model.Task) ExecHandler {
	var handler ExecHandler = nil
	if taskModel.ExecType == task2.CmdTask {
		handler = new(CliTaskHandler)
	} else if taskModel.ExecType == task2.FileTask {
		handler = new(FileTaskHandler)
	} else if taskModel.ExecType == task2.HttpTask {
		handler = new(HttpTaskHandler)
	}
	return handler
}
