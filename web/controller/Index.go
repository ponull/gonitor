package controller

import (
	"gonitor/model"
	"gonitor/web/context"
	"gonitor/web/response"
	"gonitor/web/response/errorCode"
	"strconv"
)

func Index(context *context.Context) *response.Response {
	//panic("something error")
	return response.Resp().String(context.Context.FullPath())
}

func getCurrentUserId(context *context.Context) int64 {
	currentUserIdStr := context.Param("current_user_id")
	currentUserId, _ := strconv.ParseInt(currentUserIdStr, 10, 64)
	return currentUserId
}

func GetOperationLogList(context *context.Context) *response.Response {
	opModel := &model.OperationLog{}
	pagination := model.InitPagination(context)
	err := opModel.List(pagination, map[string]interface{}{})
	if err != nil {
		return response.Resp().Error(errorCode.DB_ERROR, err.Error(), nil)
	}
	return response.Resp().Success("success", pagination)
}
