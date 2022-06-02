package subscription

import (
	"gonitor/model"
	"gonitor/web/ws"
)

type TaskInfo struct {
	ID              int64  `json:"id"`
	Name            string `json:"name"`
	ExecType        string `json:"exec_type"`        //执行类型
	Command         string `json:"command"`          //执行命令
	Schedule        string `json:"schedule"`         //定时规则
	IsDisable       bool   `json:"is_disable"`       //是否禁用
	ExecuteStrategy int8   `json:"execute_strategy"` //执行策略
	LastRunTime     string `json:"last_run_time"`
	NextRunTime     string `json:"next_run_time"`
	RunningCount    int64  `json:"running_count"`
}

func SendTaskInfoFormOrm(taskModel *model.Task, runningCount int64, lastRunTime, nextRunTime string) {
	ws.WebsocketManager.SendSubscribed(ws.SubscribeTypeTask, taskModel.ID, TaskInfo{
		ID:              taskModel.ID,
		Name:            taskModel.Name,
		ExecType:        taskModel.ExecType,
		Schedule:        taskModel.Schedule,
		ExecuteStrategy: taskModel.ExecuteStrategy,
		IsDisable:       taskModel.IsDisable,
		RunningCount:    runningCount,
		LastRunTime:     lastRunTime,
		NextRunTime:     nextRunTime,
	})
}
