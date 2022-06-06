package controller

import (
	"fmt"
	"gonitor/core"
	"gonitor/model"
	"gonitor/task"
	"gonitor/web/context"
	"gonitor/web/response"
	"gonitor/web/response/errorCode"
	"gonitor/web/ws/subscription"
	"strconv"
)

type taskInfo struct {
	subscription.TaskInfo
	ExecType      string `json:"exec_type"`      //执行类型
	Command       string `json:"command"`        //执行命令
	Schedule      string `json:"schedule"`       //定时规则
	IsDisable     bool   `json:"is_disable"`     //是否禁用
	ExecStrategy  int8   `json:"exec_strategy"`  //执行策略
	RetryTimes    int8   `json:"retry_times"`    //重试次数
	RetryInterval int    `json:"retry_interval"` //重试间隔
	UpdateTime    string `json:"update_time"`    //更新时间
	Assert        string `json:"assert"`
}

func GetTaskList(context *context.Context) *response.Response {
	var taskList []taskInfo
	core.Db.Raw(`
SELECT * FROM task WHERE delete_time IS NULL
`).Scan(&taskList)
	//查询最后一条日志记录 作为last_run_time
	for i, taskItem := range taskList {
		var taskLog model.TaskLog
		core.Db.Where("task_id = ?", taskItem.ID).First(&taskLog)
		taskList[i].LastRunTime = taskLog.ExecTime.Format("2006-01-02 15:04:05")

	}
	return response.Resp().Success("success", taskList)
}

func GetTaskLogList(context *context.Context) *response.Response {
	taskId := context.Query("task_id")
	var taskLogList []subscription.TaskLogInfo
	core.Db.Raw(`
SELECT * FROM task_log WHERE task_id = ? and status = 1
`, taskId).Scan(&taskLogList)
	return response.Resp().Success("success", taskLogList)
}

//已经开始的任务不关闭
func StopTask(context *context.Context) *response.Response {
	taskIdStr := context.Param("task_id")
	taskId, _ := strconv.ParseInt(taskIdStr, 10, 64)
	taskModel := &model.Task{}
	dbRt := core.Db.Where("id = ?", taskId).First(taskModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "not found task", nil)
	}
	task.Manager.DeleteTask(taskId)
	taskModel.IsDisable = true
	dbRt = core.Db.Save(taskModel)
	if dbRt.Error != nil {
		fmt.Println("停止任务的时候更新数据库失败")
	}
	subscription.SendTaskInfoFormOrm(taskModel, 0, "", "")
	return response.Resp().Success("success", nil)
}

func StartTask(context *context.Context) *response.Response {
	taskIdStr := context.Param("task_id")
	taskId, _ := strconv.ParseInt(taskIdStr, 10, 64)
	taskModel := &model.Task{}
	dbRt := core.Db.Where("id = ?", taskId).First(taskModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "not found task", nil)
	}
	err := task.Manager.AddTask(taskId)
	if err != nil {
		return response.Resp().Error(10002, "add task fail", nil)
	}
	return response.Resp().Success("start success", nil)
}

func StartOnceTask(context *context.Context) *response.Response {
	taskIdStr := context.Param("task_id")
	taskId, _ := strconv.ParseInt(taskIdStr, 10, 64)
	taskModel := &model.Task{}
	dbRt := core.Db.Where("id = ?", taskId).First(taskModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "not found task", nil)
	}
	output, err := task.Manager.StartOnceTask(taskId)
	if err != nil {
		return response.Resp().Error(215456, "exec fail "+err.Error(), nil)
	}
	return response.Resp().Success("success", map[string]string{
		"output": output,
	})
}

//修改状态并且杀死所有正在运行的实例
func killTask(context *context.Context) *response.Response {
	return response.Resp().String("pending")
}

//杀死指定实例
func killTaskRunningInstance(context *context.Context) *response.Response {
	return response.Resp().String("pending")
}

func GetTaskInfo(context *context.Context) *response.Response {
	taskId := context.Query("task_id")
	taskModel := model.Task{}
	taskInfo := taskInfo{}
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
		ExecStrategy  int8   `json:"exec_strategy"`
		RetryTimes    int8   `json:"retry_times"`
		RetryInterval int    `json:"retry_interval"`
		Assert        string `json:"assert"`
	}
	taskInfo := taskInfoStruct{}
	err := context.ShouldBindJSON(&taskInfo)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "parse fail:"+err.Error(), nil)
	}
	//todo 解析schedule 是否正确
	err = task.CheckTaskSchedule(taskInfo.Schedule)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "schedule format error", nil)
	}

	//解析 assert脚本是否正确
	if len(taskInfo.Assert) > 0 {
		err := task.CheckTaskAssertJavascriptCode(taskInfo.Assert)
		if err != nil {
			return response.Resp().Error(2154646, "JS断言代码有错误", nil)
		}
	}
	taskModel := &model.Task{
		Name:          taskInfo.Name,
		Command:       taskInfo.Command,
		Schedule:      taskInfo.Schedule,
		ExecType:      taskInfo.ExecType,
		IsDisable:     taskInfo.IsDisable,
		ExecStrategy:  taskInfo.ExecStrategy,
		RetryTimes:    taskInfo.RetryTimes,
		RetryInterval: taskInfo.RetryInterval,
		Assert:        taskInfo.Assert,
	}
	dbRt := core.Db.Create(taskModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.DB_ERROR, "insert fail", nil)
	}
	return response.Resp().Success("add success", taskInfo)
}

func EditTask(context *context.Context) *response.Response {
	type taskInfoStruct struct {
		ID            int64  `json:"task_id"`
		Name          string `json:"name"`
		ExecType      string `json:"exec_type"`
		Command       string `json:"command"`
		Schedule      string `json:"schedule"`
		IsDisable     bool   `json:"is_disable"`
		ExecStrategy  int8   `json:"exec_strategy"`
		RetryTimes    int8   `json:"retry_times"`
		RetryInterval int    `json:"retry_interval"`
		Assert        string `json:"assert"`
	}
	taskInfo := taskInfoStruct{}
	err := context.ShouldBindJSON(&taskInfo)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "parse fail:"+err.Error(), nil)
	}
	taskModel := &model.Task{}
	dbRt := core.Db.Where("id = ?", taskInfo.ID).First(taskModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "invalid task id", nil)
	}

	err = task.CheckTaskSchedule(taskInfo.Schedule)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "schedule format error", nil)
	}

	//解析 assert脚本是否正确
	if len(taskInfo.Assert) > 0 {
		err := task.CheckTaskAssertJavascriptCode(taskInfo.Assert)
		if err != nil {
			return response.Resp().Error(2154646, "JS断言代码有错误", nil)
		}
	}
	taskModel.Name = taskInfo.Name
	taskModel.Command = taskInfo.Command
	taskModel.Schedule = taskInfo.Schedule
	taskModel.ExecType = taskInfo.ExecType
	taskModel.IsDisable = taskInfo.IsDisable
	taskModel.ExecStrategy = taskInfo.ExecStrategy
	taskModel.RetryTimes = taskInfo.RetryTimes
	taskModel.RetryInterval = taskInfo.RetryInterval
	taskModel.Assert = taskInfo.Assert
	dbRt = core.Db.Save(taskModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.DB_ERROR, "update fail", nil)
	}
	err = task.Manager.UpdateTask(taskInfo.ID)
	if err != nil {
		return response.Resp().Success("update success, but task update fail", taskInfo)
	}
	return response.Resp().Success("update success", taskInfo)
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
