package model

import (
	"github.com/jinzhu/gorm"
	"gonitor/core"
	"time"
)

type Base struct {
	ID        int64      `gorm:"column:id;primary_key;AUTO_INCREMENT" json:"id"`
	CreatedAt time.Time  `gorm:"column:create_time" json:"create_time"`
	UpdatedAt time.Time  `gorm:"column:update_time" json:"update_time"`
	DeletedAt *time.Time `gorm:"column:delete_time" sql:"index" json:"delete_time"`
}

func GetConn() *gorm.DB {
	return core.Db
}

type Page struct {
	CurrentPage int64       `json:"currentPage"`
	PageSize    int64       `json:"pageSize"`
	Total       int64       `json:"total"` // 总记录数
	Pages       int64       `json:"pages"` // 总页数
	Data        interface{} `json:"data"`  // 实际的list数据
} // 分页response返回给前端

//func Paginate(db *gorm.DB) *gorm.DB {
//	return db.Offset()
//}
