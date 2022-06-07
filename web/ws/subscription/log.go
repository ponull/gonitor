package subscription

import (
	"gonitor/model"
	"gonitor/web/ws"
)

type TaskLogInfo struct {
	ID            int64  `json:"id"`
	TaskID        int64  `json:"task_id"`
	Command       string `json:"command"` //执行命令
	ProcessID     int    `json:"process_id"`
	ExecutionTime string `json:"execution_time"` //定时规则
	Status        bool   `json:"status"`
	ExecOutput    string `json:"exec_output"` //执行数据
}

func SendTaskLogInfoFormOrm(taskLogModel *model.TaskLog, output string) {
	taskLogInfo := GetTaskLogInfoStatByLogModel(taskLogModel)
	taskLogInfo.ExecOutput = output
	ws.WebsocketManager.SendSubscribed(ws.SubscribeTypeTaskLog, taskLogModel.ID, taskLogInfo)
}

func SendNewTaskLogFormOrm(taskLogModel *model.TaskLog) {
	//自动帮用户订阅  这里需要查询所有订阅了这个task id 新加log事件的用户
	for _, client := range ws.WebsocketManager.ClientList {
		if client.IsSubscribed(ws.SubscribeTypeTaskLogAdd, taskLogModel.TaskId) {
			client.Subscribe(ws.SubscribeTypeTaskLog, taskLogModel.ID)
		}
	}
	taskLogInfo := GetTaskLogInfoStatByLogModel(taskLogModel)
	taskLogInfo.ExecOutput = ""
	ws.WebsocketManager.SendSubscribed(ws.SubscribeTypeTaskLogAdd, taskLogModel.TaskId, taskLogInfo)
}

func GetTaskLogInfoStatByLogModel(taskLogModel *model.TaskLog) TaskLogInfo {
	return TaskLogInfo{
		ID:            taskLogModel.ID,
		TaskID:        taskLogModel.TaskId,
		Command:       taskLogModel.Command,
		ProcessID:     taskLogModel.ProcessId,
		ExecutionTime: taskLogModel.ExecTime.Format("2006-01-02 15:04:05"),
		Status:        taskLogModel.Status,
		ExecOutput:    "",
	}
}
