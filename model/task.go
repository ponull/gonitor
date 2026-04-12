package model

type Task struct {
	Base
	Name          string `gorm:"column:name" json:"name"`                     //任务名称
	Description   string `gorm:"column:description" json:"description"`       //任务描述
	Command       string `gorm:"column:command" json:"command"`               //执行命令
	Schedule      string `gorm:"column:schedule" json:"schedule"`             //定时规则
	ExecType      string `gorm:"column:exec_type" json:"exec_type"`           //执行类型
	IsDisable     bool   `gorm:"column:is_disable" json:"is_disable"`         //是否禁用
	Priority      int8   `gorm:"column:priority;default:1" json:"priority"`   //优先级 0=low, 1=medium, 2=high, 3=critical
	Tags          string `gorm:"column:tags" json:"tags"`                     //标签，逗号分隔
	ExecStrategy  int8   `gorm:"column:exec_strategy" json:"exec_strategy"`   //执行策略  单例模式不需要了  由这里来控制
	RetryTimes    int8   `gorm:"column:retry_times" json:"retry_times"`       //重试次数
	RetryInterval int    `gorm:"column:retry_interval" json:"retry_interval"` //重试间隔
	Timeout       int    `gorm:"column:timeout;default:0" json:"timeout"`     //超时时间（秒），0表示不限制
	Assert        string `gorm:"column:assert" json:"assert"`                 //断言
	ResultHandler string `gorm:"column:result_handler" json:"result_handler"` //结果处理
	NodeID        int64  `gorm:"column:node_id;default:0" json:"node_id"`     //执行节点ID 0=主节点
}

func (Task) TableName() string {
	return "task"
}
