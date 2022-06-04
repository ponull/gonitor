package task

import (
	"github.com/robfig/cron/v3"
	"gonitor/web/ws/subscription"
)

var pushCron = cron.New()

func startPushService() {
	pushCron.AddFunc("@every 1s", func() {
		for _, taskIns := range Manager.TaskList {
			taskIns.pushNewestTaskInfo()
		}
		subscription.SendCpuDynamicInfo()
		subscription.SendMemoryDynamicInfo()
		subscription.SendDiskDynamicInfo()
	})
	pushCron.Start()
}
