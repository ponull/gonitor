package task

import (
	"bytes"
	"gonitor/model"
	"os"
	"os/exec"
)

type ExecHandler interface {
	Run(taskModel model.Task, taskUniqId int64) (string, error)
}

type FileTaskHandler struct{}
type CliTaskHandler struct{}
type HttpTaskHandler struct{}

func (h *FileTaskHandler) Run(taskModel model.Task, taskUniqId int64) (string, error) {
	return "", nil
}

func (h *CliTaskHandler) Run(taskModel model.Task, taskUniqId int64) (string, error) {
	cmd := exec.Command("cmd", "/C", taskModel.Command)
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
	Manager.RunningProcessMap.Store(taskUniqId, cmd.Process.Pid)
	//taskLog.ProcessId = cmd.Process.Pid
	cmd.Wait()
	return out.String(), nil

}

func (h *HttpTaskHandler) Run(taskModel model.Task, taskUniqId int64) (string, error) {
	return "", nil
}

func CreateHandler(taskModel model.Task) ExecHandler {
	var handler ExecHandler = nil
	if taskModel.ExecType == CmdTask {
		handler = new(CliTaskHandler)
	} else if taskModel.ExecType == FileTask {
		handler = new(FileTaskHandler)
	} else if taskModel.ExecType == HttpTask {
		handler = new(HttpTaskHandler)
	}
	return handler
}
