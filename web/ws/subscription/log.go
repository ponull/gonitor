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
	ExecutionTime int64  `json:"execution_time"` //定时规则
	Status        bool   `json:"status"`
}

func SendTaskLogInfoFormOrm(taskLogModel *model.TaskLog) {
	ws.WebsocketManager.SendSubscribed(ws.SubscribeTypeTaskLog, taskLogModel.ID, TaskLogInfo{
		ID:            taskLogModel.ID,
		TaskID:        taskLogModel.TaskId,
		Command:       taskLogModel.Command,
		ProcessID:     taskLogModel.ProcessId,
		ExecutionTime: taskLogModel.ExecutionTime,
		Status:        taskLogModel.Status,
	})
}

func SendNewTaskLogFormOrm(taskLogModel *model.TaskLog) {
	ws.WebsocketManager.SendSubscribed(ws.SubscribeTypeTaskLogAdd, taskLogModel.TaskId, TaskLogInfo{
		ID:            taskLogModel.ID,
		TaskID:        taskLogModel.TaskId,
		Command:       taskLogModel.Command,
		ProcessID:     taskLogModel.ProcessId,
		ExecutionTime: taskLogModel.ExecutionTime,
		Status:        taskLogModel.Status,
	})
}
