package controller

import (
	"fmt"
	"gonitor/core"
	"gonitor/web/context"
	"gonitor/web/response"
)

func Index(context *context.Context) *response.Response {
	//panic("something error")
	return response.Resp().String(context.Context.FullPath())
}

func GetSystemInfo(context *context.Context) *response.Response {
	//panic("something error")
	return response.Resp().Json(map[string]interface{}{
		"cpuUsage": core.GetCPUPercent(),
		"memUsage": core.GetMemPercent(),
	})
}

func GetSystemOverview(context *context.Context) *response.Response {
	systemInfo := core.GetSystemInfo()
	fmt.Println(systemInfo)
	return response.Resp().Json(systemInfo)
}

func GetSystemUserList(context *context.Context) *response.Response {
	userList := core.GetSystemUserList()
	return response.Resp().Success("success", userList)
}
