package controller

import (
	"gonitor/service/wecom"
	"gonitor/web/context"
	"gonitor/web/response"
)

func TestPush(context *context.Context) *response.Response {
	wecom.TestSend("1111")
	return response.Resp().String("success")
}
