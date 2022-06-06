package task

import (
	"fmt"
	"gonitor/core"
	"gonitor/model"
	"gonitor/web/ws/subscription"
	"path"
	"time"
)

type ExecJobWrapper struct {
	taskInfo *model.Task
	output   string //临时放这里  外面需要 但是Run这个接口又不允许
}

func (e *ExecJobWrapper) Run() {
	taskRunIns := NewTaskRunningInstance(e.taskInfo)
	err := taskRunIns.beforeRun()
	if err != nil {
		return
	}

	fmt.Printf("任务开始\n")
	subscription.SendNewTaskLogFormOrm(taskRunIns.TaskLogInfo)
	defer func() {
		e.output = taskRunIns.output
		taskRunIns.afterRun()
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
		taskRunIns.execLog += fmt.Sprintf("第%d次执行\n", i+1)
		//subscription.SendTaskLogInfoFormOrm(taskRunIns.TaskLogInfo, fmt.Sprintf("第%d次执行\n", i+1))
		err := taskRunIns.run()
		taskRunIns.writeLogOutput()
		//taskRunIns.output += fmt.Sprintf("%s\n", output)
		//subscription.SendTaskLogInfoFormOrm(taskRunIns.TaskLogInfo, fmt.Sprintf("执行结果： %s\n", output))
		if err == nil {
			return
		}
		taskRunIns.execLog = "\n\n\n"
		i++
		if i < execTimes {
			fmt.Println("任务执行失败")
		}
		if e.taskInfo.RetryInterval > 0 {
			time.Sleep(time.Duration(e.taskInfo.RetryInterval) * time.Second)
		} else {
			time.Sleep(time.Duration(i) * time.Minute)
		}
	}
	//return taskRunIns.output, nil
	//e.output += fmt.Sprintf("所有执行次数都失败\n")
}

//func (e *ExecJobWrapper) execSystemCommand() (string, error) {
//	systemCommand := parseTask(e.taskInfo.Command, e.taskInfo.ExecType)
//	cmd := exec.Command("cmd", "/C", systemCommand)
//	var out bytes.Buffer
//	cmd.Stdout = &out
//	cmd.Stderr = os.Stderr
//	if err := cmd.Start(); err != nil {
//		return out.String(), err
//	}
//	e.taskLog.Status = true
//	subscription.SendTaskLogInfoFormOrm(e.taskLog, "启动命令成功")
//	e.taskLog.ProcessId = cmd.Process.Pid
//	pn, err := process.NewProcess(int32(cmd.Process.Pid))
//	if err != nil {
//		fmt.Println("获取任务执行实例失败:" + err.Error())
//		return "", err
//	}
//	//pn.Kill()
//	taskIns, ok := Manager.TaskList[e.taskInfo.ID]
//	if !ok {
//		return "", err
//	}
//	taskIns.RunningInstances[e.taskLog.ID] = &RunningInstance{
//		LogId:       e.taskLog.ID,
//		TaskLogInfo: e.taskLog,
//		Process:     pn,
//	}
//	subscription.SendTaskLogInfoFormOrm(e.taskLog, "开始等待")
//	err = cmd.Wait()
//	subscription.SendTaskLogInfoFormOrm(e.taskLog, "等待结束")
//	if err != nil {
//		return "", err
//	}
//	return out.String(), nil
//}

//func (e *ExecJobWrapper) writeLogOutput() {
//	filePath := path.Join(core.Config.Script.LogFolder, e.taskLog.OutputFile)
//	err := os.MkdirAll(path.Dir(filePath), 0666)
//	err = ioutil.WriteFile(filePath, []byte(e.output), 0666)
//	if err != nil {
//	}
//}

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
		return "curl -L '" + command + "'"
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
