package task

import (
	"github.com/shirou/gopsutil/process"
)

type RunningInstance struct {
	LogId   int64
	Process *process.Process
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
