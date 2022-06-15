package controller

import (
	"errors"
	"fmt"
	"github.com/jinzhu/gorm"
	"gonitor/core"
	"gonitor/model"
	"gonitor/utils"
	"gonitor/web/context"
	"gonitor/web/response"
	"gonitor/web/response/errorCode"
	"strconv"
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

func GetSelfInfo(context *context.Context) *response.Response {
	userIdStr := context.Param("current_user_id")
	userId, _ := strconv.ParseInt(userIdStr, 10, 64)
	fmt.Println(userId)
	userModel := &model.User{}
	info, err := userModel.Info(userId)
	if err != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "Invalid User Id", nil)
	}
	return response.Resp().Success("success", info)
}

func GetUserInfo(context *context.Context) *response.Response {
	userIdStr := context.Param("user_id")
	userId, _ := strconv.ParseInt(userIdStr, 10, 64)
	fmt.Println(userId)
	userModel := &model.User{}
	info, err := userModel.Info(userId)
	if err != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "Invalid User Id", nil)
	}
	return response.Resp().Success("success", info)
}

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
	model.OperationLog{}.AddOperationLog(user.ID, user.ID, "Login", context.ClientIP())
	return response.Resp().Success("登录成功", token)
}

func AddUser(context *context.Context) *response.Response {
	type userFormTpl struct {
		LoginAccount    string `json:"login_account"`
		UserName        string `json:"username"`
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
	model.OperationLog{}.AddOperationLog(
		getCurrentUserId(context),
		newUser.ID,
		"AddUser",
		fmt.Sprintf("User:%s\nClient Ip:%s", newUser.Username, context.ClientIP()))
	return response.Resp().Success("success", nil)
}

func EditUser(context *context.Context) *response.Response {
	type userFormTpl struct {
		UserName        string `json:"username"`
		Password        string `json:"password"`
		ConfirmPassword string `json:"confirm_password"`
		Avatar          string `json:"avatar"`
	}
	userFormData := userFormTpl{}
	err := context.ShouldBindJSON(&userFormData)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "parse fail:"+err.Error(), nil)
	}
	userId := context.Param("user_id")
	userModel := &model.User{}
	dbRt := core.Db.Where("id = ?", userId).First(userModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "invalid user id", nil)
	}
	if len(userFormData.Password) < 6 {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "密码小于6位数", nil)
	}
	if userFormData.Password != userFormData.ConfirmPassword {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "Incorrect password twice", nil)
	}
	userModel.Username = userFormData.UserName
	userModel.Password = utils.Md5(userFormData.Password)
	userModel.Avatar = userFormData.Avatar
	dbRt = core.Db.Save(userModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.DB_ERROR, "edit user fail: "+err.Error(), nil)
	}
	model.OperationLog{}.AddOperationLog(
		getCurrentUserId(context),
		userModel.ID,
		"EditUser",
		fmt.Sprintf("User:%s\nClient Ip:%s", userModel.Username, context.ClientIP()))
	return response.Resp().Success("success", nil)
}

func DeleteUser(context *context.Context) *response.Response {
	userId := context.Param("user_id")
	userModel := &model.User{}
	dbRt := core.Db.Where("id = ?", userId).Delete(userModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.DB_ERROR, "delete user fail!", nil)
	}
	model.OperationLog{}.AddOperationLog(
		getCurrentUserId(context),
		userModel.ID,
		"DeleteUser",
		fmt.Sprintf("User:%s\nClient Ip:%s", userModel.Username, context.ClientIP()))
	return response.Resp().Success("success", nil)
}
