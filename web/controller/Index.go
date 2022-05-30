package controller

import (
	"gonitor/core"
	"gonitor/web/context"
	"gonitor/web/response"
	"gonitor/web/ws"
	"gonitor/web/ws/subscription"
)

func Index(context *context.Context) *response.Response {
	//panic("something error")
	return response.Resp().String(context.Context.FullPath())
}

func GetTaskList(context *context.Context) *response.Response {
	var taskList []subscription.TaskInfo
	core.Db.Raw(`
SELECT * FROM task
`).Scan(&taskList)
	return response.Resp().Json(taskList)
}

func GetTaskLogList(context *context.Context) *response.Response {
	taskId := context.Param("task_id")
	var taskLogList []subscription.TaskLogInfo
	core.Db.Raw(`
SELECT * FROM task_log where task_id = ? and status = 1
`, taskId).Scan(&taskLogList)
	return response.Resp().Json(taskLogList)
}

func UpdateTaskInfo(context *context.Context) *response.Response {
	taskInfo := subscription.TaskInfo{
		ID:           1,
		Name:         "测试名字",
		ExecType:     "CMD",
		Command:      "curl -H www.baidu.com",
		Schedule:     "@every 1s",
		IsDisable:    false,
		IsSingleton:  false,
		LastRunTime:  "2020-1-6",
		NextRunTime:  "2022-6-8",
		RunningCount: 12,
	}
	ws.WebsocketManager.SendSubscribed(ws.SubscribeTypeTask, 1, taskInfo)
	return response.Resp().Json(taskInfo)
}

func AddTask(context *context.Context) *response.Response {
	return response.Resp().String("6666")
}
