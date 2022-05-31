package subscription

import (
	"gonitor/model"
	"gonitor/web/ws"
)

type TaskInfo struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	ExecType     string `json:"execType"`    //执行类型
	Command      string `json:"command"`     //执行命令
	Schedule     string `json:"schedule"`    //定时规则
	IsDisable    bool   `json:"isDisable"`   //是否禁用
	IsSingleton  bool   `json:"isSingleton"` //是否单例执行
	LastRunTime  string `json:"lastRunTime"`
	NextRunTime  string `json:"nextRunTime"`
	RunningCount int64  `json:"runningCount"`
}

func SendTaskInfoFormOrm(taskModel *model.Task, runningCount int64, lastRunTime, nextRunTime string) {
	ws.WebsocketManager.SendSubscribed(ws.SubscribeTypeTask, taskModel.ID, TaskInfo{
		ID:           taskModel.ID,
		Name:         taskModel.Name,
		ExecType:     taskModel.ExecType,
		Schedule:     taskModel.Schedule,
		IsSingleton:  taskModel.IsSingleton,
		IsDisable:    taskModel.IsDisable,
		RunningCount: runningCount,
		LastRunTime:  lastRunTime,
		NextRunTime:  nextRunTime,
	})
}
