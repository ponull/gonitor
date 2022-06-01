package controller

import (
	"github.com/robfig/cron/v3"
	"gonitor/core"
	"gonitor/model"
	"gonitor/web/context"
	"gonitor/web/response"
	"gonitor/web/response/errorCode"
	"gonitor/web/ws"
	"gonitor/web/ws/subscription"
	"strconv"
)

func Index(context *context.Context) *response.Response {
	//panic("something error")
	return response.Resp().String(context.Context.FullPath())
}

func GetTaskList(context *context.Context) *response.Response {
	var taskList []subscription.TaskInfo
	core.Db.Raw(`
SELECT * FROM task WHERE delete_time IS NULL
`).Scan(&taskList)
	return response.Resp().Success("success", taskList)
}

func GetTaskLogList(context *context.Context) *response.Response {
	taskId := context.Query("task_id")
	var taskLogList []subscription.TaskLogInfo
	core.Db.Raw(`
SELECT * FROM task_log WHERE task_id = ? and status = 1
`, taskId).Scan(&taskLogList)
	return response.Resp().Json(taskLogList)
}

//已经开始的任务不关闭
func stopTask(context *context.Context) *response.Response {
	return response.Resp().String("pending")
}

//修改状态并且杀死所有正在运行的实例
func killTask(context *context.Context) *response.Response {
	return response.Resp().String("pending")
}

//杀死指定实例
func killTaskRunningInstance(context *context.Context) *response.Response {
	return response.Resp().String("pending")
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

func GetTaskInfo(context *context.Context) *response.Response {
	taskId := context.Query("task_id")
	taskModel := model.Task{}
	taskInfo := subscription.TaskInfo{}
	dbRt := core.Db.Where("id = ?", taskId).First(&taskModel).Scan(&taskInfo)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "Invalid task id", nil)
	}
	return response.Resp().Success("success", taskInfo)
}

func AddTask(context *context.Context) *response.Response {
	type taskInfoStruct struct {
		Name          string `json:"name"`
		ExecType      string `json:"exec_type"`
		Command       string `json:"command"`
		Schedule      string `json:"schedule"`
		IsDisable     bool   `json:"is_disable"`
		IsSingleton   bool   `json:"is_singleton"`
		RetryTimes    int8   `json:"retry_times"`
		RetryInterval int    `json:"retry_interval"`
	}
	taskInfo := taskInfoStruct{}
	err := context.ShouldBindJSON(&taskInfo)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "parse fail", nil)
	}
	//todo 解析schedule 是否正确
	cronParser := cron.NewParser(
		cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow | cron.Descriptor,
	)
	_, err = cronParser.Parse(taskInfo.Schedule)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "schedule format error", nil)
	}
	taskModel := &model.Task{
		Name:          taskInfo.Name,
		Command:       taskInfo.Command,
		Schedule:      taskInfo.Schedule,
		ExecType:      taskInfo.ExecType,
		IsDisable:     taskInfo.IsDisable,
		IsSingleton:   taskInfo.IsSingleton,
		RetryTimes:    taskInfo.RetryTimes,
		RetryInterval: taskInfo.RetryInterval,
	}
	dbRt := core.Db.Create(taskModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.DB_ERROR, "insert fail", nil)
	}
	return response.Resp().Success("add success", taskInfo)
}

func EditTask(context *context.Context) *response.Response {
	taskId := context.PostForm("taskId")
	taskModel := &model.Task{}
	dbRt := core.Db.Where("id = ?", taskId).First(taskModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "invalid task id", nil)
	}
	taskName := context.PostForm("name")
	execType := context.PostForm("exec_type")
	command := context.PostForm("command")
	schedule := context.PostForm("schedule")
	retryTimesStr := context.PostForm("retry_times")
	retryTimes, _ := strconv.ParseInt(retryTimesStr, 10, 64)
	retryIntervalStr := context.PostForm("retry_interval")
	retryInterval, _ := strconv.ParseInt(retryIntervalStr, 10, 64)
	isSingletonStr := context.PostForm("is_singleton")
	isSingleton, _ := strconv.ParseBool(isSingletonStr)
	isDisableStr := context.PostForm("is_disable")
	isDisable, _ := strconv.ParseBool(isDisableStr)
	taskModel.Name = taskName
	taskModel.Command = command
	taskModel.Schedule = schedule
	taskModel.ExecType = execType
	taskModel.IsDisable = isDisable
	taskModel.IsSingleton = isSingleton
	taskModel.RetryTimes = int8(retryTimes)
	taskModel.RetryInterval = int(retryInterval)
	dbRt = core.Db.Save(taskModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.DB_ERROR, "update fail", nil)
	}
	return response.Resp().Success("edit success", taskModel)
}

func DeleteTask(context *context.Context) *response.Response {
	type taskInfoStruct struct {
		ID int64 `json:"task_id"`
	}
	taskInfo := taskInfoStruct{}
	err := context.ShouldBindJSON(&taskInfo)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "parse fail", nil)
	}
	taskModel := model.Task{}
	dbRt := core.Db.Where("id = ?", taskInfo.ID).First(&taskModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "invalid task id", nil)
	}
	if dbRt = core.Db.Delete(&taskModel); dbRt.Error != nil {
		return response.Resp().Error(errorCode.DB_ERROR, "delete task fail", nil)
	}
	return response.Resp().Success("delete success", taskModel)
}

func GetEndedTaskLogList(context *context.Context) *response.Response {
	taskId := context.Query("task_id")
	core.Db.Scopes()
	//下面只展示已经结束的
	var taskLogList []subscription.TaskLogInfo
	core.Db.Raw(`
SELECT * FROM task_log WHERE task_id = ? and status = 0
`, taskId).Scan(&taskLogList)
	return response.Resp().Json(taskLogList)
}
