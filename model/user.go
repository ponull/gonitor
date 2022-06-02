package model

import (
	"errors"
	"github.com/jinzhu/gorm"
	"gonitor/web/yogo"
)

type User struct {
	Base
	Username     string `gorm:"column:username" json:"username"`
	LoginAccount string `gorm:"column:login_account" json:"login_account"`
	Password     string `gorm:"column:password" json:"password"`
	Avatar       string `gorm:"column:avatar" json:"avatar"`
}

func (User) TableName() string {
	return "user"
}

func (u *User) RegisterNewUser() error {
	result := GetConn().Where("login_account = ?", u.LoginAccount).First(u)
	if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return errors.New("已存在的用户名")
	}
	result = yogo.Db.Create(u)
	if result.Error != nil { //找到了
		return errors.New("注册失败, 新建用户失败")
	}
	return nil
}
