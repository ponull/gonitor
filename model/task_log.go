package model

type TaskLog struct {
	Base
	TaskId        int64  `gorm:"column:task_id" json:"task_id"`               //任务名称
	Command       string `gorm:"column:command" json:"command"`               //最终执行命令 例如http 和 file的执行  就不一样
	Status        bool   `gorm:"column:status" json:"status"`                 //当前运行状态
	Output        string `gorm:"column:output" json:"output"`                 //当前运行状态
	ExecType      string `gorm:"column:exec_type" json:"exec_type"`           //执行类型
	ProcessId     int    `gorm:"column:process_id" json:"process_id"`         //执行类型
	ExecutionTime int64  `gorm:"column:execution_time" json:"execution_time"` //执行时间
	RunningTime   int64  `gorm:"column:running_time" json:"running_time"`     //运行时间
}

func (TaskLog) TableName() string {
	return "task_log"
}