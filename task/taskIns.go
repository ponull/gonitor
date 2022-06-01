package task

import "github.com/robfig/cron/v3"

type taskInstance struct {
	TaskID           int64
	RunningInstances map[int64]*RunningInstance
	RunningCount     int
	EntryId          cron.EntryID
}

func (ti *taskInstance) Start() {

}

func (ti *taskInstance) Stop() {

}
