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

type RunningInstance struct {
	LogId       int64
	taskInfo    model.Task
	TaskLogInfo *model.TaskLog
	Process     *process.Process
	output      string
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

func NewTaskInstance(taskInfo model.Task) *RunningInstance {
	return &RunningInstance{
		taskInfo: taskInfo,
	}
}

func (ri *RunningInstance) run() (string, error) {
	systemCommand := parseTask(ri.taskInfo.Command, ri.taskInfo.ExecType)
	cmd := exec.Command("cmd", "/C", systemCommand)
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return out.String(), err
	}
	ri.TaskLogInfo.Status = true
	subscription.SendTaskLogInfoFormOrm(ri.TaskLogInfo, "启动命令成功")
	ri.TaskLogInfo.ProcessId = cmd.Process.Pid
	pn, err := process.NewProcess(int32(cmd.Process.Pid))
	if err != nil {
		fmt.Println("获取任务执行实例失败:" + err.Error())
		return "", err
	}
	//记录进程实例，后面kill可能会用到
	ri.Process = pn
	//pn.Kill()
	taskIns, ok := Manager.TaskList[ri.taskInfo.ID]
	if !ok {
		return "", err
	}
	taskIns.RunningInstances[ri.TaskLogInfo.ID] = ri
	subscription.SendTaskLogInfoFormOrm(ri.TaskLogInfo, "开始等待")
	err = cmd.Wait()
	subscription.SendTaskLogInfoFormOrm(ri.TaskLogInfo, "等待结束")
	if err != nil {
		return "", err
	}
	return out.String(), nil

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
	subscription.SendTaskLogInfoFormOrm(ri.TaskLogInfo, "任务结束")
	ri.writeLogOutput()
	delete(Manager.TaskList[ri.taskInfo.ID].RunningInstances, ri.TaskLogInfo.ID)
}

func (ri *RunningInstance) writeLogOutput() {
	filePath := path.Join(core.Config.Script.LogFolder, ri.TaskLogInfo.OutputFile)
	err := os.MkdirAll(path.Dir(filePath), 0666)
	err = ioutil.WriteFile(filePath, []byte(ri.output), 0666)
	if err != nil {
	}
}
