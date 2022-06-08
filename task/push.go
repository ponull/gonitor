package task

import (
	"github.com/robfig/cron/v3"
	"gonitor/core"
	"gonitor/model"
	"gonitor/web/ws/subscription"
)

var pushCron = cron.New()

func startPushService() {
	pushCron.AddFunc("@every 1s", func() {
		for _, taskIns := range Manager.TaskList {
			taskIns.pushNewestTaskInfo()
		}
		sendTaskOverviewDynamicInfo()
		subscription.SendCpuDynamicInfo()
		subscription.SendMemoryDynamicInfo()
		subscription.SendDiskDynamicInfo()
	})
	pushCron.Start()
}

func sendTaskOverviewDynamicInfo() {
	processCount := 0
	enableCount := 0
	for _, taskIns := range Manager.TaskList {
		processCount += len(taskIns.RunningInstances)
		enableCount += 1
	}
	var taskCount int
	core.Db.Model(&model.Task{}).Count(&taskCount)
	subscription.SendTaskOverviewDynamicInfo(taskCount, enableCount, processCount)
}
