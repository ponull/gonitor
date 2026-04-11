package controller

import (
	"fmt"
	"gonitor/core"
	"gonitor/model"
	"gonitor/task"
	"gonitor/utils"
	"gonitor/web/context"
	"gonitor/web/response"
	"gonitor/web/response/errorCode"
	"io/ioutil"
	"os"
	"path"
	"strings"
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

	// 接收边缘节点上报的系统信息
	type heartbeatInfo struct {
		IP           string `json:"ip"`
		OS           string `json:"os"`
		Arch         string `json:"arch"`
		CPUCores     int    `json:"cpu_cores"`
		MemoryTotal  uint64 `json:"memory_total"`
		GoVersion    string `json:"go_version"`
		AgentVersion string `json:"agent_version"`
	}
	info := heartbeatInfo{}
	_ = context.ShouldBindJSON(&info)

	nodeModel.Status = 1
	now := time.Now()
	nodeModel.LastPingAt = &now
	if info.IP != "" {
		nodeModel.IP = info.IP
	}
	if info.OS != "" {
		nodeModel.OS = info.OS
	}
	if info.Arch != "" {
		nodeModel.Arch = info.Arch
	}
	if info.CPUCores > 0 {
		nodeModel.CPUCores = info.CPUCores
	}
	if info.MemoryTotal > 0 {
		nodeModel.MemoryTotal = info.MemoryTotal
	}
	if info.GoVersion != "" {
		nodeModel.GoVersion = info.GoVersion
	}
	if info.AgentVersion != "" {
		nodeModel.AgentVersion = info.AgentVersion
	}
	core.Db.Save(nodeModel)
	return response.Resp().Success("heartbeat ok", map[string]interface{}{
		"node_id":   nodeModel.ID,
		"node_name": nodeModel.Name,
		"time":      now.Format("2006-01-02 15:04:05"),
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

	// 生成输出文件路径，与本地任务日志格式保持一致
	outputFile := fmt.Sprintf("%d/%s_%s.txt", resultInfo.TaskID, time.Now().Format("2006_01_02/15_04_05"), utils.CreateRandomString(8))

	// 写入任务日志
	taskLog := &model.TaskLog{
		TaskId:      resultInfo.TaskID,
		Command:     taskModel.Command,
		ExecType:    taskModel.ExecType,
		ExecTime:    time.Now(),
		RunningTime: resultInfo.RunningTime,
		ExecResult:  resultInfo.ExecResult,
		Status:      false,
		OutputFile:  outputFile,
	}
	core.Db.Create(taskLog)

	// 将执行输出写入日志文件，与本地任务统一日志存储
	if resultInfo.ExecOutput != "" {
		logContent := fmt.Sprintf("******************目标任务: %s (远程节点: %s)******************\n", taskModel.Name, nodeModel.Name)
		logContent += fmt.Sprintf("执行结果: %v\n", resultInfo.ExecResult)
		logContent += fmt.Sprintf("运行时间: %d秒\n", resultInfo.RunningTime)
		logContent += fmt.Sprintf("输出:\n%s\n", resultInfo.ExecOutput)

		filePath := path.Join(core.Config.Script.LogFolder, outputFile)
		err = os.MkdirAll(path.Dir(filePath), 0755)
		if err == nil {
			_ = ioutil.WriteFile(filePath, []byte(logContent), 0644)
		}
	}

	return response.Resp().Success("report success", nil)
}

// AgentCheckUpdate 边缘节点检查更新
func AgentCheckUpdate(context *context.Context) *response.Response {
	secretKey := context.GetHeader("X-Node-Secret")
	if secretKey == "" {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "missing secret key", nil)
	}
	nodeModel := &model.Node{}
	dbRt := core.Db.Where("secret_key = ?", secretKey).First(nodeModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "invalid secret key", nil)
	}

	currentVersion := context.Query("version")
	latestVersion := core.Version

	// Normalize versions by stripping "v" prefix for comparison
	normalizedCurrent := strings.TrimPrefix(currentVersion, "v")
	normalizedLatest := strings.TrimPrefix(latestVersion, "v")

	needUpdate := normalizedCurrent != "" && normalizedCurrent != normalizedLatest && latestVersion != "dev"

	return response.Resp().Success("success", map[string]interface{}{
		"latest_version":  latestVersion,
		"current_version": currentVersion,
		"need_update":     needUpdate,
	})
}

// AgentReportEvents 边缘节点上报离线缓存的事件（启动后同步）
func AgentReportEvents(context *context.Context) *response.Response {
	secretKey := context.GetHeader("X-Node-Secret")
	if secretKey == "" {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "missing secret key", nil)
	}
	nodeModel := &model.Node{}
	dbRt := core.Db.Where("secret_key = ?", secretKey).First(nodeModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "invalid secret key", nil)
	}

	type eventItem struct {
		EventType string `json:"event_type"`
		Message   string `json:"message"`
		EventTime string `json:"event_time"`
	}
	var events []eventItem
	err := context.ShouldBindJSON(&events)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "parse fail:"+err.Error(), nil)
	}

	synced := 0
	for _, evt := range events {
		eventTime, parseErr := time.Parse("2006-01-02 15:04:05", evt.EventTime)
		if parseErr != nil {
			eventTime = time.Now()
		}
		nodeEvent := &model.NodeEvent{
			NodeID:    nodeModel.ID,
			EventType: evt.EventType,
			Message:   evt.Message,
			EventTime: eventTime,
			Synced:    true,
		}
		core.Db.Create(nodeEvent)
		synced++
	}

	return response.Resp().Success("events synced", map[string]interface{}{
		"synced_count": synced,
	})
}

// GetVersionInfo 获取系统版本信息（公开接口）
func GetVersionInfo(context *context.Context) *response.Response {
	return response.Resp().Success("success", map[string]interface{}{
		"version":    core.Version,
		"build_time": core.BuildTime,
		"git_commit": core.GitCommit,
		"component":  core.Component,
	})
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
