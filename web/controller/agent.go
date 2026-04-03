package controller

import (
	"gonitor/core"
	"gonitor/model"
	"gonitor/task"
	"gonitor/web/context"
	"gonitor/web/response"
	"gonitor/web/response/errorCode"
	"strconv"
	"time"
)

// AgentHeartbeat 边缘节点心跳上报
func AgentHeartbeat(context *context.Context) *response.Response {
	secretKey := context.GetHeader("X-Node-Secret")
	if secretKey == "" {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "missing secret key", nil)
	}
	nodeModel := &model.Node{}
	dbRt := core.Db.Where("secret_key = ?", secretKey).First(nodeModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "invalid secret key", nil)
	}
	nodeModel.Status = 1
	core.Db.Save(nodeModel)
	return response.Resp().Success("heartbeat ok", map[string]interface{}{
		"node_id":   nodeModel.ID,
		"node_name": nodeModel.Name,
		"time":      time.Now().Format("2006-01-02 15:04:05"),
	})
}

// AgentGetTasks 边缘节点拉取分配给自己的任务列表
func AgentGetTasks(context *context.Context) *response.Response {
	secretKey := context.GetHeader("X-Node-Secret")
	if secretKey == "" {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "missing secret key", nil)
	}
	nodeModel := &model.Node{}
	dbRt := core.Db.Where("secret_key = ?", secretKey).First(nodeModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "invalid secret key", nil)
	}

	// 支持增量同步：通过 since 参数获取指定时间后更新的任务
	sinceStr := context.Query("since")
	var taskList []model.Task
	query := core.Db.Where("node_id = ?", nodeModel.ID)
	if sinceStr != "" {
		sinceTime, err := time.Parse("2006-01-02 15:04:05", sinceStr)
		if err == nil {
			query = query.Where("update_time > ?", sinceTime)
		}
	}
	query.Find(&taskList)

	return response.Resp().Success("success", taskList)
}

// AgentReportTaskResult 边缘节点上报任务执行结果
func AgentReportTaskResult(context *context.Context) *response.Response {
	secretKey := context.GetHeader("X-Node-Secret")
	if secretKey == "" {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "missing secret key", nil)
	}
	nodeModel := &model.Node{}
	dbRt := core.Db.Where("secret_key = ?", secretKey).First(nodeModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "invalid secret key", nil)
	}

	type taskResultTpl struct {
		TaskID      int64  `json:"task_id"`
		ExecResult  bool   `json:"exec_result"`
		ExecOutput  string `json:"exec_output"`
		RunningTime int64  `json:"running_time"`
	}
	resultInfo := taskResultTpl{}
	err := context.ShouldBindJSON(&resultInfo)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "parse fail:"+err.Error(), nil)
	}

	// 验证任务是否属于该节点
	taskModel := &model.Task{}
	dbRt = core.Db.Where("id = ? AND node_id = ?", resultInfo.TaskID, nodeModel.ID).First(taskModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "task not found or not assigned to this node", nil)
	}

	// 写入任务日志
	taskLog := &model.TaskLog{
		TaskId:      resultInfo.TaskID,
		Command:     taskModel.Command,
		ExecType:    taskModel.ExecType,
		ExecTime:    time.Now(),
		RunningTime: resultInfo.RunningTime,
		ExecResult:  resultInfo.ExecResult,
		Status:      false,
	}
	core.Db.Create(taskLog)

	return response.Resp().Success("report success", nil)
}

// AgentSyncTask 将任务同步到边缘节点（由主节点调用的内部逻辑）
func SyncTaskToNode(taskId int64) error {
	taskModel := &model.Task{}
	dbRt := core.Db.Where("id = ?", taskId).First(taskModel)
	if dbRt.Error != nil {
		return dbRt.Error
	}
	// 如果是主节点任务,直接在本地执行
	if taskModel.NodeID == 0 {
		return task.Manager.AddTask(taskId)
	}

	// 查找目标节点
	nodeModel := &model.Node{}
	dbRt = core.Db.Where("id = ?", taskModel.NodeID).First(nodeModel)
	if dbRt.Error != nil {
		return dbRt.Error
	}

	// 如果是主节点
	if nodeModel.IsMaster {
		return task.Manager.AddTask(taskId)
	}

	// 远程节点的任务不在本地cron中执行
	// 边缘节点通过 AgentGetTasks 拉取自己的任务
	return nil
}

// IsLocalTask 判断任务是否在本地执行
func IsLocalTask(taskModel *model.Task) bool {
	if taskModel.NodeID == 0 {
		return true
	}
	nodeModel := &model.Node{}
	dbRt := core.Db.Where("id = ?", taskModel.NodeID).First(nodeModel)
	if dbRt.Error != nil {
		return true // 找不到节点默认本地执行
	}
	return nodeModel.IsMaster
}

// GetTaskNodeName 获取任务所在节点名称
func GetTaskNodeName(nodeId int64) string {
	if nodeId == 0 {
		return "主节点"
	}
	nodeModel := &model.Node{}
	dbRt := core.Db.Where("id = ?", nodeId).First(nodeModel)
	if dbRt.Error != nil {
		return "未知节点"
	}
	return nodeModel.Name
}

// GetMasterNodeID 获取主节点ID
func GetMasterNodeID() int64 {
	nodeModel := &model.Node{}
	dbRt := core.Db.Where("is_master = ?", true).First(nodeModel)
	if dbRt.Error != nil {
		return 0
	}
	return nodeModel.ID
}

// MigrateExistingTasks 将已有任务迁移到主节点
func MigrateExistingTasks() {
	masterNodeId := GetMasterNodeID()
	if masterNodeId == 0 {
		return
	}
	core.Db.Model(&model.Task{}).Where("node_id = 0").Update("node_id", masterNodeId)
}

// nodeIdStr to int64 helper used in routes
func parseNodeId(nodeIdStr string) (int64, error) {
	return strconv.ParseInt(nodeIdStr, 10, 64)
}
