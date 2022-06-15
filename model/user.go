package model

import (
	"errors"
	"github.com/jinzhu/gorm"
	"gonitor/core"
	"time"
)

type User struct {
	Base
	Username     string `gorm:"column:username" json:"username"`
	LoginAccount string `gorm:"column:login_account" json:"login_account"`
	Password     string `gorm:"column:password" json:"password"`
	Avatar       string `gorm:"column:avatar" json:"avatar"`
}

type UserInfoTpl struct {
	ID           string    `json:"id"`
	Username     string    `json:"username"`
	LoginAccount string    `json:"login_account"`
	Avatar       string    `json:"avatar"`
	CreateTime   time.Time `json:"create_time"`
	UpdateTime   time.Time `json:"update_time"`
}

func (User) TableName() string {
	return "user"
}

func (u *User) RegisterNewUser() error {
	if len(u.LoginAccount) < 6 {
		return errors.New("登录账号需要大于6个字符")
	}
	result := GetConn().Where("login_account = ?", u.LoginAccount).First(u)
	if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return errors.New("已存在的用户名")
	}
	result = core.Db.Create(u)
	if result.Error != nil { //找到了
		return errors.New("注册失败, 新建用户失败")
	}
	return nil
}

func (u *User) List(pagination *Pagination, where OrmWhereMap) error {
	var userList []*UserInfoTpl
	GetConn().Model(u).Scopes(Paginate(u, pagination, where)).Where(where).Scan(&userList)
	pagination.Rows = userList
	return nil
}

func (u *User) Info(userId int64) (UserInfoTpl, error) {
	userInfo := UserInfoTpl{}
	//var userInfo *UserInfoTpl
	dbRt := GetConn().Model(u).Where("id = ?", userId).Scan(&userInfo)
	if dbRt.Error != nil {
		return UserInfoTpl{}, dbRt.Error
	}
	return userInfo, nil
}
