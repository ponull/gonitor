package model

import (
	"github.com/jinzhu/gorm"
	"time"
	"yogo/yogo"
)

type Base struct {
	ID        int64       `gorm:"column:id;primary_key;AUTO_INCREMENT" json:"id"`
	CreatedAt time.Time  `gorm:"column:create_time" json:"create_time"`
	UpdatedAt time.Time  `gorm:"column:update_time" json:"update_time"`
	DeletedAt *time.Time `gorm:"column:delete_time" sql:"index" json:"delete_time"`
}

func GetConn() *gorm.DB {
	return yogo.Db
}