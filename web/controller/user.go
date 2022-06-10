package controller

import (
	"errors"
	"github.com/jinzhu/gorm"
	"gonitor/core"
	"gonitor/model"
	"gonitor/utils"
	"gonitor/web/context"
	"gonitor/web/response"
	"gonitor/web/response/errorCode"
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

func GetUserList(context *context.Context) *response.Response {
	userModel := &model.User{}
	pagination := model.InitPagination(context)
	err := userModel.List(pagination, map[string]interface{}{})
	if err != nil {
		return response.Resp().Error(errorCode.DB_ERROR, err.Error(), nil)
	}
	return response.Resp().Success("success", pagination)
}

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

func AddUser(context *context.Context) *response.Response {
	type userFormTpl struct {
		LoginAccount    string `json:"login_account"`
		UserName        string `json:"user_name"`
		Password        string `json:"password"`
		ConfirmPassword string `json:"confirm_password"`
		Avatar          string `json:"avatar"`
	}
	userFormData := userFormTpl{}
	err := context.ShouldBindJSON(&userFormData)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "parse fail:"+err.Error(), nil)
	}
	if userFormData.Password != userFormData.ConfirmPassword {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "Incorrect password twice", nil)
	}
	if len(userFormData.Password) < 6 {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "密码小于6位数", nil)
	}
	newUser := &model.User{
		Username:     userFormData.UserName,
		LoginAccount: userFormData.LoginAccount,
		Password:     utils.Md5(userFormData.Password),
		Avatar:       userFormData.Avatar,
	}
	err = newUser.RegisterNewUser()
	if err != nil {
		return response.Resp().Error(errorCode.DB_ERROR, "Add user fail: "+err.Error(), nil)
	}
	return response.Resp().Success("success", nil)
}
