package model

type Task struct {
	Base
	Name        string `gorm:"column:name" json:"name"`                 //任务名称
	Command     string `gorm:"column:command" json:"command"`           //执行命令
	Schedule    string `gorm:"column:schedule" json:"schedule"`         //定时规则
	ExecType    string `gorm:"column:exec_type" json:"exec_type"`       //执行类型
	IsDisable   bool   `gorm:"column:is_disable" json:"is_disable"`     //是否禁用
	IsSingleton bool   `gorm:"column:is_singleton" json:"is_singleton"` //是否单例执行
}

func (Task) TableName() string {
	return "task"
}

//func (t Task) GetTaskList() ([]Task, error) {
//	var taskList []Task
//	result := core.Db.Find(&taskList)
//	if result.Error != nil {
//		return nil, result.Error
//	}
//	return taskList, nil
//}
