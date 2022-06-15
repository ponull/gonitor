package model

import "time"

type OperationLog struct {
	Base
	Username string `gorm:"column:username" json:"username"`   //操作用户
	UserId   int64  `gorm:"column:user_id" json:"user_id"`     //操作用户
	TargetId int64  `gorm:"column:target_id" json:"target_id"` //操作对象id
	OpType   string `gorm:"column:op_type" json:"op_type"`     //操作类型
	Remark   string `gorm:"column:remark" json:"remark"`       //操作详细
}
type OperationLogInfoTpl struct {
	ID         string    `json:"id"`
	Username   string    `json:"username"`
	UserId     string    `json:"user_id"`
	TargetId   string    `json:"target_id"`
	OpType     string    `json:"op_type"`
	Remark     string    `json:"remark"`
	CreateTime time.Time `json:"create_time"`
}

func (OperationLog) TableName() string {
	return "operation_log"
}

func (ol OperationLog) List(pagination *Pagination, where OrmWhereMap) error {
	var opList []*OperationLogInfoTpl
	GetConn().Model(ol).Scopes(Paginate(ol, pagination, where)).Where(where).Scan(&opList)
	pagination.Rows = opList
	return nil
}

func (ol OperationLog) AddOperationLog(userId int64, targetId int64, opType string, remark string) error {
	//查询user 信息
	userModel := &User{}
	info, err := userModel.Info(userId)
	if err != nil {
		return err
	}
	opModel := &OperationLog{
		Username: info.Username,
		UserId:   userId,
		TargetId: targetId,
		OpType:   opType,
		Remark:   remark,
	}
	dbRt := GetConn().Create(opModel)
	return dbRt.Error
}
