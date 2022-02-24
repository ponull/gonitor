package core

import (
	"fmt"
	"github.com/robfig/cron/v3"
	"time"
)

var cronIns = cron.New()

//数据库自增任务id作为key  这样方便在web页面操作
var taskList = make(map[int]*cronTask)

type cronTask struct {
	TaskID  int
	Status  int
	EntryID cron.EntryID
	Type    string //http cmd
}

func (c *cronTask) Stop() {
	cronIns.Remove(c.EntryID)
}

type dbTask struct {
	ID         int
	Name       string
	Schedule   string
	Status     int //当前状态
	Command    string
	PID        int
	IsDisabled bool
	Type       string
}

var tempTaskList = []*dbTask{
	&dbTask{
		ID:         1,
		Name:       "通知脚本",
		Schedule:   "@every 1s",
		Status:     0,
		Command:    "echo 111",
		IsDisabled: false,
		Type:       "cmd",
	},
	&dbTask{
		ID:         2,
		Name:       "结算脚本",
		Schedule:   "@every 5s",
		Status:     0,
		Command:    "echo 222",
		IsDisabled: false,
		Type:       "cmd",
	},
}

func InitTask() {
	for _, taskItem := range tempTaskList {
		taskIns := *taskItem
		entryID, err := cronIns.AddFunc(taskIns.Schedule, func() {
			fmt.Println(taskIns.Name)
			fmt.Println(taskIns.Command, time.Now().UnixMicro())
		})
		fmt.Println(entryID, err)
		if err != nil {
			fmt.Println(taskIns.Name+" error:", err)
			return
		}
		taskList[taskIns.ID] = &cronTask{
			TaskID:  taskIns.ID,
			Status:  0,
			EntryID: entryID,
			Type:    "cmd",
		}
	}
	cronIns.Start()
}
