package core

import (
	"fmt"
	"github.com/robfig/cron/v3"
	"time"
)

var cronIns = cron.New()
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
		entryID, err := cronIns.AddFunc(taskItem.Schedule, func() {
			fmt.Println(taskItem.Name)
			fmt.Println(taskItem.Command, time.Now().UnixMicro())
		})
		fmt.Println(entryID, err)
		if err != nil {
			fmt.Println(taskItem.Name+" error:", err)
			return
		}
		taskList[taskItem.ID] = &cronTask{
			TaskID:  taskItem.ID,
			Status:  0,
			EntryID: entryID,
			Type:    "cmd",
		}
	}

	//fmt.Println(taskList[1])
	//fmt.Println(taskList[2])
	cronIns.Start()
	fmt.Println(tempTaskList[0].ID)
	fmt.Println(tempTaskList[1].ID)
}
