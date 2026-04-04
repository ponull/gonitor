package model

import "time"

// Node 边缘计算节点模型
type Node struct {
	Base
	Name      string `gorm:"column:name;unique_index" json:"name"`            //节点名称
	Region    string `gorm:"column:region" json:"region"`                     //节点区域 例如 香港, 新加坡
	Address   string `gorm:"column:address" json:"address"`                   //节点地址 例如 http://192.168.1.100:8899
	SecretKey string `gorm:"column:secret_key" json:"secret_key"`             //通信密钥
	Status    int8   `gorm:"column:status;default:0" json:"status"`           //状态 0=离线 1=在线
	IsMaster  bool   `gorm:"column:is_master;default:false" json:"is_master"` //是否为主节点
	Remark    string `gorm:"column:remark" json:"remark"`                     //备注
}

type NodeInfoTpl struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Region    string    `json:"region"`
	Address   string    `json:"address"`
	SecretKey string    `json:"secret_key"`
	Status    int8      `json:"status"`
	IsMaster  bool      `json:"is_master"`
	Remark    string    `json:"remark"`
	CreatedAt time.Time `json:"create_time"`
	UpdatedAt time.Time `json:"update_time"`
}

func (Node) TableName() string {
	return "node"
}

func (n Node) List(pagination *Pagination, where OrmWhereMap) error {
	var nodeList []*NodeInfoTpl
	GetConn().Model(n).Scopes(Paginate(n, pagination, where)).Where(where).Scan(&nodeList)
	pagination.Rows = nodeList
	return nil
}
