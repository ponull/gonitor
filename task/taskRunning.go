package task

import (
	"bytes"
	"errors"
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

type RunningInstance struct {
	LogId       int64
	taskInfo    *model.Task
	TaskLogInfo *model.TaskLog
	Process     *process.Process
	output      string
	execLog     string
}

func (ri *RunningInstance) stop() {
	ri.Process.Kill()
	//ri.TaskLogInfo.Output = "主动停止"
	ri.TaskLogInfo.Status = false
	ri.TaskLogInfo.RunningTime = time.Now().Unix() - ri.TaskLogInfo.ExecTime.Unix()
	core.Db.Save(ri.TaskLogInfo)

	filePath := path.Join(core.Config.Script.LogFolder, ri.TaskLogInfo.OutputFile)
	ioutil.WriteFile(filePath, []byte("主动停止"), 0666)
}

func NewTaskRunningInstance(taskInfo *model.Task) *RunningInstance {
	return &RunningInstance{
		taskInfo: taskInfo,
	}
}

func (ri *RunningInstance) run() error {
	systemCommand := parseTask(ri.taskInfo.Command, ri.taskInfo.ExecType)
	cmd := exec.Command("cmd", "/C", systemCommand)
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = os.Stderr
	ri.execLog += fmt.Sprintf("任务开始\n命令:\n%s\n", systemCommand)
	if err := cmd.Start(); err != nil {
		ri.execLog += fmt.Sprintf("执行失败\n错误:\n%s\n", err.Error())
		return err
	}
	ri.execLog += fmt.Sprintf("执行成功\n")
	ri.TaskLogInfo.Status = true
	subscription.SendTaskLogInfoFormOrm(ri.TaskLogInfo, ri.execLog)
	ri.TaskLogInfo.ProcessId = cmd.Process.Pid
	pn, err := process.NewProcess(int32(cmd.Process.Pid))
	if err != nil {
		ri.execLog += fmt.Sprintf("获取任务执行实例失败\n错误:\n%s\n", err.Error())
		return err
	}
	ri.execLog += fmt.Sprintf("获取任务进程实例成功\n")
	//记录进程实例，后面kill可能会用到
	ri.Process = pn
	//这个推送看怎么改一下
	Manager.addTaskRunningIns(ri.taskInfo.ID, ri)
	subscription.SendTaskLogInfoFormOrm(ri.TaskLogInfo, ri.execLog)
	err = cmd.Wait()
	//subscription.SendTaskLogInfoFormOrm(ri.TaskLogInfo, "等待结束")
	if err != nil {
		ri.execLog += fmt.Sprintf("等待失败\n错误:\n%s\n", err.Error())
		return err
	}

	ri.output = out.String()
	ri.execLog += fmt.Sprintf("执行结束\n")
	ri.execLog += fmt.Sprintf("输出为:\n%s\n", out.String())
	//使用断言
	if len(ri.taskInfo.Assert) > 0 {
		assertRt := GetTaskAssertResult(out.String(), ri.taskInfo.Assert)
		if !assertRt {
			ri.execLog += fmt.Sprintf("断言失败\n")
			return errors.New("断言认为返回结果失败")
		}
	}
	ri.execLog += fmt.Sprintf("断言成功\n")
	ri.execLog += fmt.Sprintf("任务结束\n")
	return nil
}

func (ri *RunningInstance) beforeRun() error {
	taskLogModel := &model.TaskLog{
		TaskId:     ri.taskInfo.ID,
		Command:    ri.taskInfo.Command,
		Status:     true,
		ExecType:   ri.taskInfo.ExecType,
		ExecTime:   time.Now(),
		OutputFile: fmt.Sprintf("%d/%s_%s.out", ri.taskInfo.ID, time.Now().Format("2006_01_02/15_04_05"), utils.CreateRandomString(8)),
	}
	dbRt := core.Db.Create(taskLogModel)
	if dbRt.Error != nil {
		//fmt.Println(dbRt.Error.Error())
		return dbRt.Error
	}
	ri.TaskLogInfo = taskLogModel
	return nil
}

func (ri *RunningInstance) afterRun() {
	ri.TaskLogInfo.Status = false
	ri.TaskLogInfo.RunningTime = time.Now().Unix() - ri.TaskLogInfo.ExecTime.Unix()
	dbRt := core.Db.Save(ri.TaskLogInfo)
	if dbRt.Error != nil {
		fmt.Println("保存任务日志失败", dbRt.Error.Error())
	}
	fmt.Printf("任务结束\n")
	subscription.SendTaskLogInfoFormOrm(ri.TaskLogInfo, ri.execLog)
	ri.writeLogOutput()
}

func (ri *RunningInstance) writeLogOutput() {
	filePath := path.Join(core.Config.Script.LogFolder, ri.TaskLogInfo.OutputFile)
	err := os.MkdirAll(path.Dir(filePath), 0666)
	err = ioutil.WriteFile(filePath, []byte(ri.execLog), 0666)
	if err != nil {
	}
}
