package controller

import (
	"errors"
	"github.com/jinzhu/gorm"
	"gonitor/core"
	"gonitor/model"
	"gonitor/utils"
	"gonitor/web/context"
	"gonitor/web/response"
)

//func UserRegister(context *context.Context) *response.Response {
//	loginAccount := context.Request.PostFormValue("login_account")
//	password := context.Request.PostFormValue("password")
//	username := context.Request.PostFormValue("username")
//	newUser := &model.User{
//		LoginAccount: loginAccount,
//		Password:     utils.Md5(password),
//		Username:     username,
//	}
//	err := newUser.RegisterNewUser()
//	if err != nil {
//		return response.Resp().Error(2001, err.Error(), make(map[string]interface{}))
//	}
//	userToken := &model.UserToken{}
//	token, err := userToken.GenerateToken(newUser.ID)
//	if err != nil {
//		return response.Resp().Error(2001, err.Error(), make(map[string]interface{}))
//	}
//	return response.Resp().Success("注册成功", map[string]interface{}{
//		"token": token,
//	})
//}

func UserLogin(context *context.Context) *response.Response {
	loginAccount := context.Request.PostFormValue("login_account")
	password := context.Request.PostFormValue("password")
	password = utils.Md5(password)
	ormWhere := model.OrmWhereMap{
		"login_account": loginAccount,
		"password":      password,
	}
	user := model.User{}
	result := core.Db.Where(ormWhere).First(&user)
	if result.Error != nil && errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return response.Resp().Error(2002, "错误的用户名或密码", make(map[string]interface{}))
	}
	userToken := &model.UserToken{}
	token, err := userToken.GenerateToken(user.ID)
	if err != nil {
		return response.Resp().Error(2001, err.Error(), make(map[string]interface{}))
	}
	return response.Resp().Success("登录成功", token)
}
