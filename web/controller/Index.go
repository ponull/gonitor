package controller

import (
	"gonitor/core"
	"gonitor/model"
	"gonitor/web/context"
	"gonitor/web/response"
)

func Index(context *context.Context) *response.Response {
	//panic("something error")
	return response.Resp().String(context.Context.FullPath())
}

func GetTaskList(context *context.Context) *response.Response {
	var taskList []model.Task
	_ = core.Db.Find(&taskList)

	//dbrt.Scan(&taskList)
	return response.Resp().Json(taskList)
}

func AddTask(context *context.Context) *response.Response {
	return response.Resp().String("6666")
}
