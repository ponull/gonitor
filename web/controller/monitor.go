package controller

import (
	"gonitor/service/monitor"
	"gonitor/web/context"
	"gonitor/web/response"
)

func GetSystemOverview(context *context.Context) *response.Response {
	systemInfo := monitor.GetSystemInfo()
	return response.Resp().Success("", systemInfo)
}

func GetCpuInfo(context *context.Context) *response.Response {
	cpuInfo := monitor.GetCpuInfo()
	return response.Resp().Success("", cpuInfo)
}

func GetMemoryInfo(context *context.Context) *response.Response {
	cpuInfo := monitor.GetMemoryInfo()
	return response.Resp().Success("", cpuInfo)
}

func GetDiskInfo(context *context.Context) *response.Response {
	cpuInfo := monitor.GetDiskInfo()
	return response.Resp().Success("", cpuInfo)
}

func GetNetInfo(context *context.Context) *response.Response {
	cpuInfo := monitor.GetNetInfo()
	return response.Resp().Success("", cpuInfo)
}
