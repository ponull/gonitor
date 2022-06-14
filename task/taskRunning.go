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
	"log"
	"os"
	"os/exec"
	"path"
	"time"
)

type RunningInstance struct {
	LogId          int64
	taskInfo       *model.Task
	TaskLogInfo    *model.TaskLog
	Process        *process.Process
	execResultList []*taskExecStat
}

type taskExecStat struct {
	Command              string `json:"command"`                //需要执行的命令
	CommandStartStatus   bool   `json:"command_start_status"`   //启动命令状态 已经启动或者未启动
	CommandStartError    error  `json:"command_start_error"`    //启动错误
	CommandExecStatus    bool   `json:"command_exec_status"`    //执行命令结果 已经启动或者未启动
	CommandExecError     error  `json:"command_exec_error"`     //执行错误
	CommandOutputContent string `json:"command_output_content"` //命令输出内容
	AssertResult         bool   `json:"assert_result"`          //断言结果
	TaskResult           bool   `json:"task_result"`            //任务结果 前面三个都成功才成功
}

func newTaskExecStat() *taskExecStat {
	return &taskExecStat{
		Command:              "",
		CommandStartStatus:   false,
		CommandStartError:    nil,
		CommandExecStatus:    false,
		CommandExecError:     nil,
		CommandOutputContent: "",
		AssertResult:         false,
		TaskResult:           false,
	}
}

func (ri *RunningInstance) stop() {
	ri.Process.Kill()
	//ri.TaskLogInfo.Output = "主动停止"
	//ri.TaskLogInfo.Status = false
	//ri.TaskLogInfo.RunningTime = time.Now().Unix() - ri.TaskLogInfo.ExecTime.Unix()
	//core.Db.Save(ri.TaskLogInfo)
	//
	//filePath := path.Join(core.Config.Script.LogFolder, ri.TaskLogInfo.OutputFile)
	//ioutil.WriteFile(filePath, []byte("主动停止"), 0666)
}

func NewTaskRunningInstance(taskInfo *model.Task) *RunningInstance {
	return &RunningInstance{
		taskInfo: taskInfo,
	}
}

func (ri *RunningInstance) run() error {
	execStat := newTaskExecStat()
	ri.execResultList = append(ri.execResultList, execStat)
	command, args := parseTask(ri.taskInfo.Command, ri.taskInfo.ExecType)
	cmd := exec.Command(command, args...)
	execStat.Command = cmd.String()
	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = os.Stderr
	err := cmd.Start()
	execStat.CommandStartStatus = true
	if err != nil {
		execStat.CommandStartError = err
		return err
	}
	//ri.execLog += fmt.Sprintf("执行成功\n")
	ri.TaskLogInfo.Status = true
	ri.TaskLogInfo.ProcessId = cmd.Process.Pid
	subscription.SendTaskLogInfoFormOrm(ri.TaskLogInfo, ri.GenerateExecLog())
	pn, _ := process.NewProcess(int32(cmd.Process.Pid))
	//ri.execLog += fmt.Sprintf("获取任务进程实例成功\n")
	//记录进程实例，后面kill可能会用到
	ri.Process = pn
	//这个推送看怎么改一下
	Manager.addTaskRunningIns(ri.taskInfo.ID, ri)
	subscription.SendTaskLogInfoFormOrm(ri.TaskLogInfo, ri.GenerateExecLog())
	err = cmd.Wait()
	execStat.CommandExecStatus = true
	if err != nil {
		execStat.CommandExecError = err
		return err
	}
	execStat.CommandOutputContent = out.String()
	//这个只是记录来备用的 现在外面有两个地方需要输出结果 其实没啥用
	//使用断言
	if len(ri.taskInfo.Assert) > 0 {
		assertRt := GetTaskAssertResult(execStat.CommandOutputContent, ri.taskInfo.Assert)
		if !assertRt {
			return errors.New("断言认为返回结果失败")
		}
	}
	execStat.AssertResult = true
	execStat.TaskResult = true
	return nil
}

func (ri *RunningInstance) beforeRun() error {
	taskLogModel := &model.TaskLog{
		TaskId:     ri.taskInfo.ID,
		Command:    ri.taskInfo.Command,
		Status:     true,
		ExecType:   ri.taskInfo.ExecType,
		ExecTime:   time.Now(),
		OutputFile: fmt.Sprintf("%d/%s_%s.txt", ri.taskInfo.ID, time.Now().Format("2006_01_02/15_04_05"), utils.CreateRandomString(8)),
		RetryTimes: 0,
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
		log.Println("保存任务日志失败", dbRt.Error.Error())
	}
	log.Printf("任务结束\n")
	subscription.SendTaskLogInfoFormOrm(ri.TaskLogInfo, ri.GenerateExecLog())
	ri.writeLogOutput()
	//执行结果判断推送等
	if len(ri.taskInfo.ResultHandler) > 0 {
		//组装结果信息  不交到外面获取了 外面太乱了
		ExecResultHandler(ri.taskInfo.ResultHandler, ri.TaskLogInfo.ExecResult, ri.GetResultHandlerData())
	}
}

func (ri *RunningInstance) writeLogOutput() {
	filePath := path.Join(core.Config.Script.LogFolder, ri.TaskLogInfo.OutputFile)
	err := os.MkdirAll(path.Dir(filePath), 0666)
	err = ioutil.WriteFile(filePath, []byte(ri.GenerateExecLog()), 0666)
	if err != nil {
		log.Println("写执行日志失败")
	}
}

func (ri *RunningInstance) getLastExecOutput() string {
	resultLen := len(ri.execResultList)
	if resultLen > 0 {
		lastResult := ri.execResultList[resultLen-1]
		return lastResult.CommandOutputContent
	}
	return ""
}

//生成执行日志
func (ri *RunningInstance) GenerateExecLog() string {
	execLog := fmt.Sprintf("******************目标任务: %s******************\n", ri.taskInfo.Name)
	for i, resultItem := range ri.execResultList {
		execLog += fmt.Sprintf("第%d次执行\n", i+1)
		execLog += fmt.Sprintf("准备执行\n命令:\n%s\n", resultItem.Command)
		if !resultItem.CommandStartStatus {
			continue
		}
		if resultItem.CommandStartError != nil {
			execLog += fmt.Sprintf("启动失败\n错误:\n%s\n", resultItem.CommandStartError)
			continue
		}
		execLog += fmt.Sprintf("启动成功, 等待任务执行完毕\n")
		if !resultItem.CommandExecStatus {
			continue
		}
		if resultItem.CommandExecError != nil {
			execLog += fmt.Sprintf("任务执行失败, 错误:\n%s\n", resultItem.CommandStartError)
			continue
		}
		execLog += fmt.Sprintf("任务执行成功\n")
		execLog += fmt.Sprintf("输出为:\n%s\n", resultItem.CommandOutputContent)
		execLog += fmt.Sprintf("开始断言\n")
		if !resultItem.AssertResult {
			execLog += fmt.Sprintf("断言未通过\n")
			continue
		}
		execLog += fmt.Sprintf("断言通过\n")
		execLog += fmt.Sprintf("任务成功结束\n")
		execLog += "\n\n\n"
	}
	return execLog
}

func (ri *RunningInstance) GetResultHandlerData() map[string]interface{} {
	resultList := make([]map[string]interface{}, 0)
	for _, resultItem := range ri.execResultList {
		result := map[string]interface{}{
			"command":              resultItem.Command,
			"command_start_status": resultItem.CommandStartStatus,
			"command_start_error":  resultItem.CommandStartError,
			"command_exec_status":  resultItem.CommandExecStatus,
			"command_exec_error":   resultItem.CommandExecError,
			"assert_result":        resultItem.AssertResult,
			"task_result":          resultItem.TaskResult,
		}
		resultList = append(resultList, result)
	}
	fmt.Println(resultList)
	//resultList, err := json.Marshal(ri.execResultList)
	//fmt.Println(err)
	//var resultListMap map[string]interface{}
	//json.Unmarshal(resultList, &resultListMap)
	//fmt.Println(resultListMap)
	//传入的数据
	return map[string]interface{}{
		"id":           ri.TaskLogInfo.ID,
		"exec_time":    ri.TaskLogInfo.ExecTime.Format("2006-01-02 15:04:05"),
		"running_time": ri.TaskLogInfo.RunningTime,
		"retry_times":  ri.TaskLogInfo.RetryTimes,
		"result_list":  resultList,
		"task_info": map[string]interface{}{
			"id":            ri.taskInfo.ID,
			"name":          ri.taskInfo.Name,
			"exec_type":     ri.taskInfo.ExecType,
			"command":       ri.taskInfo.Command,
			"exec_strategy": ri.taskInfo.ExecStrategy,
		},
	}
}
