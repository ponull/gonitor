package middleware

import (
	"errors"
	"github.com/jinzhu/gorm"
	"gonitor/core"
	"gonitor/model"
	"gonitor/web/context"
	"gonitor/web/response/errorCode"
	"net/http"
	"strconv"
)

func Cors(context *context.Context) {
	method := context.Request.Method
	context.Header("Access-Control-Allow-Origin", "*")
	context.Header("Access-Control-Allow-Headers", "Content-Type,AccessToken,X-CSRF-Token, Authorization, Token")
	context.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")
	context.Header("Access-Control-Expose-Headers", "Content-Length, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Content-Type")
	context.Header("Access-Control-Allow-Credentials", "true")
	if method == "OPTIONS" {
		context.AbortWithStatus(http.StatusNoContent)
	}
	context.Next()
}

func CheckToken(c *context.Context) {
	token := c.Request.Header["Token"]
	userToken := model.UserToken{}
	dbResult := core.Db.Where("token = ?", token).Find(&userToken)
	//没有找到  就返回错误就好了
	if dbResult.Error != nil && errors.Is(dbResult.Error, gorm.ErrRecordNotFound) {
		result := map[string]interface{}{
			"code":    errorCode.TOKEN_EXPIRED,
			"message": "登录状态失效, 请重新登录",
			"data":    nil,
		}
		c.AbortWithStatusJSON(200, result)
	}
	c.Request.Header.Add("user_id", strconv.FormatInt(userToken.UserID, 10))
}
