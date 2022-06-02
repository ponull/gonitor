package model

type Task struct {
	Base
	Name          string `gorm:"column:name" json:"name"`                     //任务名称
	Command       string `gorm:"column:command" json:"command"`               //执行命令
	Schedule      string `gorm:"column:schedule" json:"schedule"`             //定时规则
	ExecType      string `gorm:"column:exec_type" json:"exec_type"`           //执行类型
	IsDisable     bool   `gorm:"column:is_disable" json:"is_disable"`         //是否禁用
	ExecStrategy  int8   `gorm:"column:exec_strategy" json:"exec_strategy"`   //执行策略  单例模式不需要了  由这里来控制
	RetryTimes    int8   `gorm:"column:retry_times" json:"retry_times"`       //重试次数
	RetryInterval int    `gorm:"column:retry_interval" json:"retry_interval"` //重试间隔
}

func (Task) TableName() string {
	return "task"
}
