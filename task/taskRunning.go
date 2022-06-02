package task

import (
	"github.com/shirou/gopsutil/process"
	"gonitor/core"
	"gonitor/model"
	"time"
)

type RunningInstance struct {
	LogId       int64
	TaskLogInfo *model.TaskLog
	Process     *process.Process
}

func (ri *RunningInstance) stop() {
	ri.Process.Kill()
	ri.TaskLogInfo.Output = "主动停止"
	ri.TaskLogInfo.Status = false
	ri.TaskLogInfo.RunningTime = time.Now().Unix() - ri.TaskLogInfo.ExecutionTime
	core.Db.Save(ri.TaskLogInfo)
}

//
//func (tri *RunningInstance) Start(task *model.Task) (string, error) {
//	taskLog, err := beforeRun(task)
//	if err != nil {
//		return "", err
//	}
//	handler := handler2.CreateHandler(task)
//	var execTimes int8 = 1
//	if task.RetryTimes > 0 {
//		execTimes += task.RetryTimes
//	}
//	var i int8 = 0
//	var output string
//	for i < execTimes {
//		output, err = handler.Run(task, taskLog)
//		if err == nil {
//			return output, err
//		}
//		i++
//		if i < execTimes {
//			fmt.Println("任务执行失败")
//		}
//		if task.RetryInterval > 0 {
//			time.Sleep(time.Duration(task.RetryInterval) * time.Second)
//		} else {
//			time.Sleep(time.Duration(i) * time.Minute)
//		}
//	}
//	return output, nil
//}
//
//func (tri *runningInstance) Stop() {
//	err := tri.Process.Kill()
//	if err != nil {
//		fmt.Println("kill task fail ", err)
//	}
//}
