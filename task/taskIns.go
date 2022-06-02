package task

import (
	"fmt"
	"github.com/robfig/cron/v3"
	"gonitor/model"
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
	for _, runningIns := range ti.RunningInstances {
		runningIns.stop()
	}
	delete(Manager.TaskList, ti.TaskInfo.ID)
	//todo看要不要加参数来区分是否停止正在运行的实例  按理说是需要的
}

func (ti *taskInstance) getTaskChain() cron.Chain {
	//TODO 应该从自己数据库读取 暂时写死
	queueType := 0
	switch queueType {
	case DelayIfStillRunning:
		return cron.NewChain(cron.DelayIfStillRunning(cron.DefaultLogger))
	case SkipIfStillRunning:
		return cron.NewChain(cron.SkipIfStillRunning(cron.DefaultLogger))
	default:
		return cron.NewChain(cron.Recover(cron.DefaultLogger))
	}
}
