package subscription

import (
	"gonitor/model"
	"gonitor/web/ws"
)

type TaskInfo struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	LastRunTime  string `json:"last_run_time"`
	NextRunTime  string `json:"next_run_time"`
	RunningCount int64  `json:"running_count"`
	IsDisable    bool   `json:"is_disable"`
}

func SendTaskInfoFormOrm(taskModel *model.Task, runningCount int64, lastRunTime, nextRunTime string) {
	ws.WebsocketManager.SendSubscribed(ws.SubscribeTypeTask, taskModel.ID, TaskInfo{
		ID:           taskModel.ID,
		Name:         taskModel.Name,
		RunningCount: runningCount,
		LastRunTime:  lastRunTime,
		NextRunTime:  nextRunTime,
		IsDisable:    taskModel.IsDisable,
	})
}
