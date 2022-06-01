package handler

import (
	"bytes"
	"gonitor/model"
	task2 "gonitor/task"
	"os"
	"os/exec"
)

type CliTaskHandler struct{}

func (h *CliTaskHandler) Run(task *model.Task, taskLog *model.TaskLog) (string, error) {
	cmd := exec.Command("cmd", "/C", task.Command)
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return out.String(), err
		//fmt.Println("执行任务: ", taskModel.Name, " 失败")
		//fmt.Println(err.Error())
		//taskLog.Output = err.Error()
		//taskLog.Status = false
		//taskLog.RunningTime = time.Now().Unix() - taskLog.ExecutionTime
		//result = dbRt.Save(taskLog)
		//return
	}
	taskLog.ProcessId = cmd.Process.Pid
	task2.Manager.RunningProcessMap.Store(taskLog.ID, cmd.Process.Pid)
	//taskLog.ProcessId = cmd.Process.Pid
	cmd.Wait()
	return out.String(), nil

}
