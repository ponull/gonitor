package core

import (
	"bytes"
	"errors"
	"fmt"
	"github.com/jinzhu/gorm"
	"github.com/robfig/cron/v3"
	"github.com/shirou/gopsutil/process"
	"gonitor/model"
	"gonitor/web/ws"
	"gonitor/web/ws/subscription"
	"log"
	"os"
	"os/exec"
	"path"
	"time"
)

var cronIns = cron.New()

const (
	CmdTask  = "cmd"
	HttpTask = "http"
	FileTask = "file"
)

//数据库自增任务id作为key  这样方便在web页面操作
var crontabList = make(map[int64]*cronTask)

type cronTask struct {
	TaskID  int64
	Status  int
	EntryID cron.EntryID
	Type    string //http cmd
}

func (c *cronTask) Stop() {
	cronIns.Remove(c.EntryID)
}

type TaskInfo struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	Type         string `json:"type"`
	Schedule     string `json:"schedule"`
	IsSingleton  bool   `json:"isSingleton"`
	IsDisabled   bool   `json:"isDisabled"`
	RunningCount int64  `json:"runningCount"`
}

type TaskLogInfo struct {
	ID          int64  `json:"id"`
	TaskId      int64  `json:"task_id"`
	Command     string `json:"command"`
	ProcessId   int64  `json:"process_id"`
	ExecuteTime string `json:"execute_time"`
}

func InitTask() {
	var taskList []model.Task
	result := Db.Where("is_disable = ?", false).Find(&taskList)
	if result.Error != nil && !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		panic(result.Error)
	}
	for _, taskItem := range taskList {
		FireTask(taskItem.ID)
	}
	//检测脚本
	cronIns.AddFunc("@every 10s", func() {
		result = Db.Where("is_disable = ?", false).Find(&taskList)
	})
	cronIns.Start()
}

//FireTask 启动任务
func FireTask(taskId int64) {
	//已经加入到task  就忽略
	if _, ok := crontabList[taskId]; ok {
		fmt.Println("已经存在task", crontabList[taskId])
		fmt.Println("已经存在task", taskId)
		return
	}
	taskIns := model.Task{}
	result := Db.Where("id = ?", taskId).First(&taskIns)
	if result.Error != nil {
		log.Println(result.Error)
	}
	entryID, err := cronIns.AddFunc(taskIns.Schedule, func() {
		err := checkTask(taskId)
		if err != nil {
			fmt.Println(err.Error())
			return
		}
		execCommand := parseTask(taskIns.Command, taskIns.ExecType)
		taskLog := model.TaskLog{
			TaskId:        taskId,
			Command:       execCommand,
			Status:        true,
			ExecType:      CmdTask,
			ExecutionTime: time.Now().Unix(),
		}
		dbRt := Db.Create(&taskLog)
		if dbRt.Error != nil {
			fmt.Println(dbRt.Error.Error())
			return
		}
		cmd := exec.Command("cmd", "/C", execCommand)
		var out bytes.Buffer
		cmd.Stdout = &out
		cmd.Stderr = os.Stderr
		if err := cmd.Start(); err != nil {
			fmt.Println("执行任务: ", taskIns.Name, " 失败")
			fmt.Println(err.Error())
			taskLog.Output = err.Error()
			taskLog.Status = false
			taskLog.RunningTime = time.Now().Unix() - taskLog.ExecutionTime
			result = dbRt.Save(taskLog)
			return
		}
		//新加task log  推送到前端 task 运行++
		var EntryIns cron.Entry
		for _, entry := range cronIns.Entries() {
			if entry.ID == crontabList[taskId].EntryID {
				EntryIns = entry
			}
		}
		ws.WebsocketManager.SendSubscribed(ws.SubscribeTypeTask, taskId, subscription.TaskInfo{
			ID:           taskId,
			Name:         taskIns.Name,
			ExecType:     taskIns.ExecType,
			Schedule:     taskIns.Schedule,
			IsSingleton:  taskIns.IsSingleton,
			IsDisable:    taskIns.IsDisable,
			RunningCount: 1,
			LastRunTime:  EntryIns.Prev.Format("2006-01-02 15:04:05"),
			NextRunTime:  EntryIns.Next.Format("2006-01-02 15:04:05"),
		})
		taskLog.ProcessId = cmd.Process.Pid
		//pn, err := process.NewProcess(int32(cmd.Process.Pid))
		//if err != nil {
		//	fmt.Println("获取gonitor进程失败:" + err.Error())
		//}
		//cmdline, _ := pn.Cmdline()
		//fmt.Println("进程启动参数: ", cmdline)
		//cwd, _ := pn.Cwd()
		//fmt.Println("进程运行目录: ", cwd)
		//name, _ := pn.Name()
		//fmt.Println("进程名称: ", name)
		//err = pn.Kill()
		//if err != nil {
		//	log.Println("gonitor停止失败:" + err.Error())
		//	return
		//}
		cmd.Wait()

		ws.WebsocketManager.SendSubscribed(ws.SubscribeTypeTask, taskId, subscription.TaskInfo{
			ID:           taskId,
			Name:         taskIns.Name,
			ExecType:     taskIns.ExecType,
			Schedule:     taskIns.Schedule,
			IsSingleton:  taskIns.IsSingleton,
			IsDisable:    taskIns.IsDisable,
			RunningCount: 0,
			LastRunTime:  EntryIns.Prev.Format("2006-01-02 15:04:05"),
			NextRunTime:  EntryIns.Next.Format("2006-01-02 15:04:05"),
		})
		//删除task log  推送到前端 task 运行--
		taskLog.Output = out.String()
		taskLog.Status = false
		taskLog.RunningTime = time.Now().Unix() - taskLog.ExecutionTime
		result = dbRt.Save(taskLog)
		if dbRt.Error != nil {
			return
		}
		//fmt.Println("输出: ", out.String())

	})
	if err != nil {
		log.Println(taskIns.Name+" error:", err)
		return
	}
	crontabList[taskIns.ID] = &cronTask{
		TaskID:  taskIns.ID,
		Status:  0,
		EntryID: entryID,
		Type:    "cmd",
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
	if fileSuffix == ".js" {
		return "node " + Config.Script.Folder + "/" + fileName
	} else if fileSuffix == ".py" {
		return "python " + Config.Script.Folder + "/" + fileName
	} else if fileSuffix == ".php" {
		return "php " + Config.Script.Folder + "/" + fileName
	}
	return "echo '不支持的文件类型'"
}

//checkTask 检查任务是否可以执行
func checkTask(taskId int64) error {
	taskIns := model.Task{}
	result := Db.Where("id = ?", taskId).First(&taskIns)
	if result.Error != nil {
		return errors.New("任务不存在或已被删除")
	}
	if taskIns.IsDisable {
		return errors.New("任务被禁用")
	}
	if taskIns.IsSingleton {
		taskLogIns := model.TaskLog{}
		result = Db.Where("task_id = ? AND status = ?", taskId, true).First(&taskLogIns)
		if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return errors.New("单例模式, 上次运行还未结束")
		}
	}
	return nil
}

func killTask(taskId int64) error {
	taskIns := model.Task{}
	result := Db.Where("id = ?", taskId).First(&taskIns)
	if result.Error != nil {
		return errors.New("任务不存在或已被删除")
	}
	if taskItem, ok := crontabList[taskId]; ok {
		cronIns.Remove(taskItem.EntryID)
	}
	//查询所有的未结束的进程  杀死 并修改值
	var taskRunInsList []model.TaskLog
	result = Db.Where("task_id = ? AND status = ?", taskId, true).Find(&taskRunInsList)
	for _, taskRunIns := range taskRunInsList {
		pn, err := process.NewProcess(int32(taskRunIns.ProcessId))
		if err != nil {
			fmt.Println("获取任务执行实例失败:" + err.Error())
			continue
		}
		pn.Kill()
		taskRunIns.Output = "主动停止"
		taskRunIns.Status = false
		taskRunIns.RunningTime = time.Now().Unix() - taskRunIns.ExecutionTime
		result = Db.Save(taskRunIns)
	}
	return nil
}

//KillAllRunningTask 杀死所有任务
func KillAllRunningTask() {
	//删除所有定时任务
	for _, taskItem := range crontabList {
		cronIns.Remove(taskItem.EntryID)
		err := killTask(taskItem.TaskID)
		if err != nil {
			fmt.Println("杀死任务id成功", taskItem.TaskID)
		}
		fmt.Println("杀死任务id", taskItem.TaskID)
	}
}
