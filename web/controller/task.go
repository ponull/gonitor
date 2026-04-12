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
	"io/ioutil"
	"path"
	"strconv"
)

type taskInfo struct {
	subscription.TaskInfo
	Description     string `json:"description"`        //任务描述
	ExecType        string `json:"exec_type"`          //执行类型
	Command         string `json:"command"`            //执行命令
	Schedule        string `json:"schedule"`           //定时规则
	ExecStrategy    int8   `json:"exec_strategy"`      //执行策略
	RetryTimes      int8   `json:"retry_times"`        //重试次数
	RetryInterval   int    `json:"retry_interval"`     //重试间隔
	Timeout         int    `json:"timeout"`            //超时时间
	DependsOnTaskID int64  `json:"depends_on_task_id"` //依赖任务ID
	Priority        int8   `json:"priority"`           //优先级
	Tags            string `json:"tags"`               //标签
	UpdateTime      string `json:"update_time"`        //更新时间
	Assert          string `json:"assert"`
	ResultHandler   string `json:"result_handler"`
	NodeID          int64  `json:"node_id"`   //执行节点ID
	NodeName        string `json:"node_name"` //执行节点名称
}

type taskMutationPayload struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	ExecType        string `json:"exec_type"`
	Command         string `json:"command"`
	Schedule        string `json:"schedule"`
	IsDisable       bool   `json:"is_disable"`
	Priority        int8   `json:"priority"`
	Tags            string `json:"tags"`
	ExecStrategy    int8   `json:"exec_strategy"`
	RetryTimes      int8   `json:"retry_times"`
	RetryInterval   int    `json:"retry_interval"`
	Timeout         int    `json:"timeout"`
	DependsOnTaskID int64  `json:"depends_on_task_id"`
	Assert          string `json:"assert"`
	ResultHandler   string `json:"result_handler"`
	NodeID          int64  `json:"node_id"`
}

func validateTaskMutationPayload(taskID int64, payload *taskMutationPayload) error {
	if len(payload.Name) == 0 {
		return fmt.Errorf("task name is required")
	}
	if len(payload.Name) > 255 {
		return fmt.Errorf("task name must be less than 255 characters")
	}
	if len(payload.Command) == 0 {
		return fmt.Errorf("command is required")
	}
	if payload.ExecType != "cmd" && payload.ExecType != "http" && payload.ExecType != "file" {
		return fmt.Errorf("exec_type must be cmd, http, or file")
	}
	if payload.Priority < 0 || payload.Priority > 3 {
		return fmt.Errorf("priority must be between 0 and 3")
	}
	if payload.RetryTimes < 0 {
		return fmt.Errorf("retry_times must be non-negative")
	}
	if payload.RetryInterval < 0 {
		return fmt.Errorf("retry_interval must be non-negative")
	}
	if payload.Timeout < 0 {
		return fmt.Errorf("timeout must be non-negative")
	}
	if payload.DependsOnTaskID < 0 {
		return fmt.Errorf("depends_on_task_id must be non-negative")
	}
	if payload.DependsOnTaskID > 0 {
		if taskID > 0 && payload.DependsOnTaskID == taskID {
			return fmt.Errorf("task dependency cannot reference itself")
		}
		depTask := &model.Task{}
		dbRt := core.Db.Where("id = ?", payload.DependsOnTaskID).First(depTask)
		if dbRt.Error != nil {
			return fmt.Errorf("depends_on_task_id is invalid")
		}
	}
	if err := task.CheckTaskSchedule(payload.Schedule); err != nil {
		return fmt.Errorf("schedule format error")
	}
	if len(payload.Assert) > 0 {
		if err := task.CheckTaskAssertJavascriptCode(payload.Assert); err != nil {
			return fmt.Errorf("JS断言代码有错误")
		}
	}
	if len(payload.ResultHandler) > 0 {
		if err := task.CheckTaskAssertJavascriptCode(payload.ResultHandler); err != nil {
			return fmt.Errorf("结果handler JS代码有错误")
		}
	}
	return nil
}

func GetTaskList(context *context.Context) *response.Response {
	var taskList []taskInfo
	keyword := context.Query("keyword")
	priority := context.Query("priority")
	status := context.Query("status")

	query := core.Db.Table("task").Where("delete_time IS NULL")

	// Search by keyword (name, description, command, tags)
	if keyword != "" {
		likePattern := "%" + keyword + "%"
		query = query.Where("name LIKE ? OR description LIKE ? OR command LIKE ? OR tags LIKE ?",
			likePattern, likePattern, likePattern, likePattern)
	}

	// Filter by priority
	if priority != "" {
		query = query.Where("priority = ?", priority)
	}

	// Filter by status (enabled/disabled)
	if status == "enabled" {
		query = query.Where("is_disable = ?", false)
	} else if status == "disabled" {
		query = query.Where("is_disable = ?", true)
	}

	query.Order("priority DESC, id ASC").Scan(&taskList)

	//查询最后一条日志记录 作为last_run_time
	for i, taskItem := range taskList {
		var taskLog model.TaskLog
		core.Db.Where("task_id = ?", taskItem.ID).Order("id DESC").First(&taskLog)
		taskList[i].LastRunTime = taskLog.ExecTime.Format("2006-01-02 15:04:05")
		taskList[i].NodeName = GetTaskNodeName(taskItem.NodeID)
	}
	return response.Resp().Success("success", taskList)
}

func GetTaskLogList(context *context.Context) *response.Response {
	taskId := context.Param("task_id")
	var ormWhereMap = make(model.OrmWhereMap)
	ormWhereMap["task_id"] = taskId
	ormWhereMap["status"] = 0
	pagination := model.InitPagination(context)

	taskModel := &model.TaskLog{}
	err := taskModel.List(pagination, ormWhereMap)
	if err != nil {
		return response.Resp().Error(errorCode.DB_ERROR, err.Error(), nil)
	}
	return response.Resp().Success("success", pagination)
}

func GetTaskRunningList(context *context.Context) *response.Response {
	taskIdStr := context.Param("task_id")
	taskId, _ := strconv.ParseInt(taskIdStr, 10, 64)
	taskIns, ok := task.Manager.TaskList[taskId]
	var runningLogList = make([]subscription.TaskLogInfo, 0)
	if !ok {
		return response.Resp().Success("success", runningLogList)
	}
	taskRunInsList := taskIns.RunningInstances
	for _, taskRunIns := range taskRunInsList {
		TaskLogInfo := subscription.GetTaskLogInfoStatByLogModel(taskRunIns.TaskLogInfo)
		TaskLogInfo.ExecOutput = taskRunIns.GenerateExecLog()
		runningLogList = append(runningLogList, TaskLogInfo)
	}
	return response.Resp().Success("success", runningLogList)
}

// 已经开始的任务不关闭
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
	model.OperationLog{}.AddOperationLog(
		getCurrentUserId(context),
		taskModel.ID,
		"StopTask",
		fmt.Sprintf("Task:%s\nClient Ip:%s", taskModel.Name, context.ClientIP()))
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
	taskModel.IsDisable = false
	dbRt = core.Db.Save(taskModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "change task state fail", nil)
	}
	err := task.Manager.AddTask(taskId)
	if err != nil {
		return response.Resp().Error(10002, "add task fail", nil)
	}
	subscription.SendTaskInfoFormOrm(taskModel, 0, "", "")
	model.OperationLog{}.AddOperationLog(
		getCurrentUserId(context),
		taskModel.ID,
		"StartTask",
		fmt.Sprintf("Task:%s\nClient Ip:%s", taskModel.Name, context.ClientIP()))
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
		return response.Resp().Error(215456, "exec fail "+err.Error()+"\n"+output, nil)
	}
	model.OperationLog{}.AddOperationLog(
		getCurrentUserId(context),
		taskModel.ID,
		"TestTask",
		fmt.Sprintf("Task:%s\nClient Ip:%s", taskModel.Name, context.ClientIP()))
	return response.Resp().Success("success", map[string]string{
		"output": output,
	})
}

// 修改状态并且杀死所有正在运行的实例
func killTask(context *context.Context) *response.Response {
	return response.Resp().String("pending")
}

// 杀死指定实例
func killTaskRunningInstance(context *context.Context) *response.Response {
	return response.Resp().String("pending")
}

func GetTaskInfo(context *context.Context) *response.Response {
	taskId := context.Param("task_id")
	taskModel := model.Task{}
	taskInfo := taskInfo{}
	dbRt := core.Db.Where("id = ?", taskId).First(&taskModel).Scan(&taskInfo)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "Invalid task id", nil)
	}
	taskInfo.NodeName = GetTaskNodeName(taskModel.NodeID)
	return response.Resp().Success("success", taskInfo)
}

func AddTask(context *context.Context) *response.Response {
	addInfo := taskMutationPayload{}
	err := context.ShouldBindJSON(&addInfo)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "parse fail:"+err.Error(), nil)
	}
	if err = validateTaskMutationPayload(0, &addInfo); err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, err.Error(), nil)
	}
	taskModel := &model.Task{
		Name:            addInfo.Name,
		Description:     addInfo.Description,
		Command:         addInfo.Command,
		Schedule:        addInfo.Schedule,
		ExecType:        addInfo.ExecType,
		IsDisable:       addInfo.IsDisable,
		Priority:        addInfo.Priority,
		Tags:            addInfo.Tags,
		ExecStrategy:    addInfo.ExecStrategy,
		RetryTimes:      addInfo.RetryTimes,
		RetryInterval:   addInfo.RetryInterval,
		Timeout:         addInfo.Timeout,
		DependsOnTaskID: addInfo.DependsOnTaskID,
		Assert:          addInfo.Assert,
		ResultHandler:   addInfo.ResultHandler,
		NodeID:          addInfo.NodeID,
	}
	dbRt := core.Db.Create(taskModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.DB_ERROR, "insert fail", nil)
	}
	err = SyncTaskToNode(taskModel.ID)
	if err != nil {
		return response.Resp().Success("add to databases success, but task start fail", addInfo)
	}
	model.OperationLog{}.AddOperationLog(
		getCurrentUserId(context),
		taskModel.ID,
		"AddTask",
		fmt.Sprintf("Task:%s\nClient Ip:%s", taskModel.Name, context.ClientIP()))
	return response.Resp().Success("add success", addInfo)
}

func EditTask(context *context.Context) *response.Response {
	editInfo := taskMutationPayload{}
	err := context.ShouldBindJSON(&editInfo)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "parse fail:"+err.Error(), nil)
	}
	taskId := context.Param("task_id")
	taskModel := &model.Task{}
	dbRt := core.Db.Where("id = ?", taskId).First(taskModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "invalid task id", nil)
	}

	if err = validateTaskMutationPayload(taskModel.ID, &editInfo); err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, err.Error(), nil)
	}

	taskModel.Name = editInfo.Name
	taskModel.Description = editInfo.Description
	taskModel.Command = editInfo.Command
	taskModel.Schedule = editInfo.Schedule
	taskModel.ExecType = editInfo.ExecType
	taskModel.IsDisable = editInfo.IsDisable
	taskModel.Priority = editInfo.Priority
	taskModel.Tags = editInfo.Tags
	taskModel.ExecStrategy = editInfo.ExecStrategy
	taskModel.RetryTimes = editInfo.RetryTimes
	taskModel.RetryInterval = editInfo.RetryInterval
	taskModel.Timeout = editInfo.Timeout
	taskModel.DependsOnTaskID = editInfo.DependsOnTaskID
	taskModel.Assert = editInfo.Assert
	taskModel.ResultHandler = editInfo.ResultHandler
	taskModel.NodeID = editInfo.NodeID
	dbRt = core.Db.Save(taskModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.DB_ERROR, "update fail", nil)
	}
	// 更新任务调度：先删除旧的，判断是否为本地任务再决定是否重新加入cron
	task.Manager.DeleteTask(taskModel.ID)
	if IsLocalTask(taskModel) && !taskModel.IsDisable {
		err = task.Manager.AddTask(taskModel.ID)
		if err != nil {
			return response.Resp().Success("update success, but task update fail", editInfo)
		}
	}

	model.OperationLog{}.AddOperationLog(
		getCurrentUserId(context),
		taskModel.ID,
		"EditTask",
		fmt.Sprintf("Task:%s\nClient Ip:%s", taskModel.Name, context.ClientIP()))
	return response.Resp().Success("update success", editInfo)
}

func DeleteTask(context *context.Context) *response.Response {
	//type taskInfoStruct struct {
	//	ID int64 `json:"task_id"`
	//}
	//taskInfo := taskInfoStruct{}
	//err := context.ShouldBindJSON(&taskInfo)
	//if err != nil {
	//	return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "parse fail", nil)
	//}
	taskId := context.Param("task_id")
	taskModel := model.Task{}
	dbRt := core.Db.Where("id = ?", taskId).First(&taskModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "invalid task id", nil)
	}
	if dbRt = core.Db.Delete(&taskModel); dbRt.Error != nil {
		return response.Resp().Error(errorCode.DB_ERROR, "delete task fail", nil)
	}
	model.OperationLog{}.AddOperationLog(
		getCurrentUserId(context),
		taskModel.ID,
		"DeleteTask",
		fmt.Sprintf("Task:%s\nClient Ip:%s", taskModel.Name, context.ClientIP()))
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

func GetTaskLogExecOutput(context *context.Context) *response.Response {
	logId := context.Param("log_id")
	logInfo := &model.TaskLog{}
	dbRt := core.Db.Where("id = ?", logId).First(logInfo)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "not found log", nil)
	}
	filePath := path.Join(core.Config.Script.LogFolder, logInfo.OutputFile)
	output, err := ioutil.ReadFile(filePath)
	if err != nil {
		return response.Resp().Success("success", "can not read output file")
	}
	return response.Resp().Success("success", string(output))
}
