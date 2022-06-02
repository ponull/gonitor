package task

import "github.com/robfig/cron/v3"

var pushCron = cron.New()

func startPushService() {
	pushCron.AddFunc("@every 1s", func() {
		for _, taskIns := range Manager.TaskList {
			taskIns.pushNestTaskInfo()
		}
	})
	pushCron.Start()
}
