package task

import (
	"bytes"
	"fmt"
	"github.com/shirou/gopsutil/process"
	"gonitor/core"
	"gonitor/model"
	"gonitor/utils"
	"gonitor/web/ws/subscription"
	"io/ioutil"
	"os"
	"os/exec"
	"path"
	"time"
)

type ExecJobWrapper struct {
	taskInfo *model.Task
	taskLog  *model.TaskLog
	output   string
}

func (e *ExecJobWrapper) Run() {
	err := e.beforeRun()
	if err != nil {
		return
	}
	subscription.SendNewTaskLogFormOrm(e.taskLog)
	defer func() {
		e.afterRun()
	}()
	var execTimes int8 = 1
	if e.taskInfo.RetryTimes > 0 {
		execTimes += e.taskInfo.RetryTimes
	}
	var i int8 = 0
	for i < execTimes {
		e.output += fmt.Sprintf("第%d次执行\n", i+1)
		//subscription.SendTaskLogInfoFormOrm(e.taskLog, e.output)
		output, err := e.execSystemCommand()
		e.output += fmt.Sprintf("%s\n", output)
		//subscription.SendTaskLogInfoFormOrm(e.taskLog, e.output)
		if err == nil {
			return
		}
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
	e.output += fmt.Sprintf("所有执行次数都失败\n")
}

func (e *ExecJobWrapper) execSystemCommand() (string, error) {
	systemCommand := parseTask(e.taskInfo.Command, e.taskInfo.ExecType)
	cmd := exec.Command("cmd", "/C", systemCommand)
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return out.String(), err
	}
	e.taskLog.Status = true
	subscription.SendTaskLogInfoFormOrm(e.taskLog, e.output)
	e.taskLog.ProcessId = cmd.Process.Pid
	pn, err := process.NewProcess(int32(cmd.Process.Pid))
	if err != nil {
		fmt.Println("获取任务执行实例失败:" + err.Error())
		return "", err
	}
	//pn.Kill()
	taskIns, ok := Manager.TaskList[e.taskInfo.ID]
	if !ok {
		return "", err
	}
	taskIns.RunningInstances[e.taskLog.ID] = &RunningInstance{
		LogId:       e.taskLog.ID,
		TaskLogInfo: e.taskLog,
		Process:     pn,
	}
	err = cmd.Wait()
	if err != nil {
		return "", err
	}
	return out.String(), nil
}

//beforeRun 运行之前 插入log
func (e *ExecJobWrapper) beforeRun() error {
	taskLogModel := &model.TaskLog{
		TaskId:     e.taskInfo.ID,
		Command:    e.taskInfo.Command,
		Status:     true,
		ExecType:   e.taskInfo.ExecType,
		ExecTime:   time.Now(),
		OutputFile: fmt.Sprintf("%d/%s_%s.out", e.taskInfo.ID, time.Now().Format("2006_01_02/15_04_05"), utils.CreateRandomString(8)),
	}
	dbRt := core.Db.Create(taskLogModel)
	if dbRt.Error != nil {
		//fmt.Println(dbRt.Error.Error())
		return dbRt.Error
	}
	e.taskLog = taskLogModel
	return nil
}

func (e *ExecJobWrapper) afterRun() {
	e.taskLog.Status = false
	e.taskLog.RunningTime = time.Now().Unix() - e.taskLog.ExecTime.Unix()
	dbRt := core.Db.Save(e.taskLog)
	if dbRt.Error != nil {
		fmt.Println("保存任务日志失败", dbRt.Error.Error())
	}
	subscription.SendTaskLogInfoFormOrm(e.taskLog, e.output)
	e.writeLogOutput()
	delete(Manager.TaskList[e.taskInfo.ID].RunningInstances, e.taskLog.ID)
}

func (e *ExecJobWrapper) writeLogOutput() {
	filePath := path.Join(core.Config.Script.LogFolder, e.taskLog.OutputFile)
	err := os.MkdirAll(path.Dir(filePath), 0666)
	err = ioutil.WriteFile(filePath, []byte(e.output), 0666)
	if err != nil {
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
