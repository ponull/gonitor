package model

import (
	"gonitor/utils"
	"time"
)

type UserToken struct {
	Base
	UserID    int64     `gorm:"column:user_id" json:"user_id"`
	Token     string    `gorm:"column:token" json:"token"`
	ExpiredAt time.Time `gorm:"column:expired_at" json:"expired_at"`
}

func (UserToken) TableName() string {
	return "user_token"
}

func (u *UserToken) GenerateToken(userId int64) (string, error) {
	result := GetConn().Where("user_id = ?", userId).Delete(u)
	if result.Error != nil {
		return "", result.Error
	}
	token := utils.CreateRandomString(32)
	result = GetConn().Create(&UserToken{
		UserID: userId,
		Token:  token,
	})
	if result.Error != nil {
		return "", result.Error
	}
	return token, nil
}
