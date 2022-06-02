package controller

import (
	"gonitor/web/context"
	"gonitor/web/response"
)

func Index(context *context.Context) *response.Response {
	//panic("something error")
	return response.Resp().String(context.Context.FullPath())
}
