package task

import (
	"fmt"
	"github.com/robfig/cron/v3"
	"gonitor/model"
	"gonitor/web/ws/subscription"
	"time"
)

type taskInstance struct {
	TaskID           int64
	TaskInfo         *model.Task
	RunningInstances map[int64]*RunningInstance
	TaskRecord       [30]taskRunInfo
	RunningCount     int
	EntryId          cron.EntryID
}

type taskRunInfo struct {
	Timeline    time.Time
	Count       int64
	RunningList []taskRunningInfo
}

type taskRunningInfo struct {
}

func (ti *taskInstance) start() error {
	taskChain := ti.getTaskChain()
	jobWrapper := NewExecJobWrapper(ti.TaskInfo)
	entryID, err := Manager.cron.AddJob(ti.TaskInfo.Schedule, taskChain.Then(jobWrapper))
	if err != nil {
		fmt.Println("cron add fun fail", err)
		return err
	}
	ti.EntryId = entryID
	Manager.TaskList[ti.TaskInfo.ID] = ti
	return nil
}

func (ti *taskInstance) stop() {
	Manager.cron.Remove(ti.EntryId)
	//更新数据库 disable字段为true
	for _, runningIns := range ti.RunningInstances {
		runningIns.stop()
	}
	delete(Manager.TaskList, ti.TaskInfo.ID)
	//todo看要不要加参数来区分是否停止正在运行的实例  按理说是需要的
}

func (ti *taskInstance) pushNewestTaskInfo() {
	for _, entry := range Manager.cron.Entries() {
		if entry.ID == ti.EntryId {
			subscription.SendTaskInfoFormOrm(
				ti.TaskInfo,
				int64(len(ti.RunningInstances)),
				entry.Prev.Format("2006-01-02 15:04:05"),
				entry.Next.Format("2006-01-02 15:04:05"))
		}
	}
}

func (ti *taskInstance) getTaskChain() cron.Chain {
	switch ti.TaskInfo.ExecStrategy {
	case DelayIfStillRunning:
		return cron.NewChain(cron.DelayIfStillRunning(cron.DefaultLogger))
	case SkipIfStillRunning:
		return cron.NewChain(cron.SkipIfStillRunning(cron.DefaultLogger))
	default:
		return cron.NewChain(cron.Recover(cron.DefaultLogger))
	}
}
