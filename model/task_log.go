package model

import (
	"time"
)

type TaskLog struct {
	Base
	TaskId      int64     `gorm:"column:task_id" json:"task_id"`           //任务名称
	Command     string    `gorm:"column:command" json:"command"`           //最终执行命令 例如http 和 file的执行  就不一样
	Status      bool      `gorm:"column:status" json:"status"`             //当前运行状态
	OutputFile  string    `gorm:"column:output" json:"output"`             //当前运行状态
	ExecType    string    `gorm:"column:exec_type" json:"exec_type"`       //执行类型
	ProcessId   int       `gorm:"column:process_id" json:"process_id"`     //执行类型
	ExecTime    time.Time `gorm:"column:exec_time" json:"exec_time"`       //执行时间
	RunningTime int64     `gorm:"column:running_time" json:"running_time"` //运行时间
	RetryTimes  int8      `gorm:"column:retry_times" json:"retry_times"`   //重试次数
	ExecResult  bool      `gorm:"column:exec_result" json:"exec_result"`   //执行结果 成功或失败
}

func (TaskLog) TableName() string {
	return "task_log"
}

func (tl *TaskLog) List(pagination *Pagination, where OrmWhereMap) (*Pagination, error) {
	var logList []*TaskLog
	GetConn().Scopes(Paginate(logList, pagination)).Where(where).Find(&logList)
	pagination.Rows = logList
	return pagination, nil
}
