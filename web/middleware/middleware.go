package middleware

import (
	"errors"
	"github.com/jinzhu/gorm"
	"strconv"
	"yogo/context"
	"yogo/model"
	"yogo/yogo"
)

func M1(c *context.Context) {
	//fmt.Println("1")
}
func M2(c *context.Context) {
	//fmt.Println("2")
}
func M3(c *context.Context) {
	//fmt.Println("3")
}

func CheckToken(c *context.Context) {
	token := c.Request.Header["Token"]
	userToken := model.UserToken{}
	dbResult := yogo.Db.Where("token = ?", token).Find(&userToken)
	//没有找到  就返回错误就好了
	if dbResult.Error != nil && errors.Is(dbResult.Error, gorm.ErrRecordNotFound) {
		result := map[string]interface{}{
			"code":    10001,
			"message": "登录状态失效, 请重新登录",
			"data":    nil,
		}
		c.AbortWithStatusJSON(200, result)
	}
	c.Request.Header.Add("user_id", strconv.FormatInt(userToken.UserID, 10))
}
