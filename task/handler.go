package task

import (
	"gonitor/core"
	"gonitor/model"
	"gonitor/web/ws/subscription"
	"log"
	"path"
	"time"
)

type ExecJobWrapper struct {
	taskInfo *model.Task
	//output   string //临时放这里  外面需要 但是Run这个接口又不允许
}

func (e *ExecJobWrapper) Run() {
	taskRunIns := NewTaskRunningInstance(e.taskInfo)
	err := taskRunIns.beforeRun()
	if err != nil {
		return
	}

	//fmt.Printf("任务开始\n")
	subscription.SendNewTaskLogFormOrm(taskRunIns.TaskLogInfo)
	defer func() {
		//e.output = taskRunIns.output
		taskRunIns.afterRun()
		//todo 这里可能有之前的没有执行完，停止了 所以task列表没有了 这里删除就会报空指针错误
		if _, ok := Manager.TaskList[taskRunIns.taskInfo.ID].RunningInstances[taskRunIns.TaskLogInfo.ID]; ok {
			delete(Manager.TaskList[taskRunIns.taskInfo.ID].RunningInstances, taskRunIns.TaskLogInfo.ID)
		}
	}()
	var execTimes int8 = 1
	if e.taskInfo.RetryTimes > 0 {
		execTimes += e.taskInfo.RetryTimes
	}
	var i int8 = 0
	for i < execTimes {
		err := taskRunIns.run()
		if err == nil {
			return
		}
		i++
		if i < execTimes {
			log.Printf("任务执行失败%d次\n", i+1)
		}
		if e.taskInfo.RetryInterval > 0 {
			time.Sleep(time.Duration(e.taskInfo.RetryInterval) * time.Second)
		} else {
			time.Sleep(time.Duration(i) * time.Minute)
		}
	}
}

func NewExecJobWrapper(taskInfo *model.Task) *ExecJobWrapper {
	return &ExecJobWrapper{
		taskInfo: taskInfo,
	}
}

func parseTask(command string, taskType string) string {
	switch taskType {
	case CmdTask:
		return command
	case HttpTask:
		return "curl -L " + command
	case FileTask:
		return parseFileTask(command)
	}
	return "echo '不支持的任务类型'"
}

func parseFileTask(fileName string) string {
	fileSuffix := path.Ext(fileName)
	if !path.IsAbs(fileName) { //不是绝对路径就从自己下面找  因为考虑到可能会执行其他项目下面的文件做考虑
		scriptRoot := core.Config.Script.Folder
		fileName = scriptRoot + "/" + fileName
	}
	if fileSuffix == ".js" {
		return "node " + fileName
	} else if fileSuffix == ".py" {
		return "python " + fileName
	} else if fileSuffix == ".php" {
		return "php " + fileName
	}
	return "echo '不支持的文件类型'"
}
