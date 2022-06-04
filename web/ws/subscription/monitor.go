package subscription

import (
	"gonitor/service/monitor"
	"gonitor/web/ws"
)

const (
	SYSTEM_OVERVIEW = 0
	CPU_INFO        = 1
	MEMORY_INFO     = 2
	DISK_INFO       = 3
	NET_INFO        = 4
)

type OverviewInfo struct {
}

type CpuDynamicInfo struct {
	TotalPercent float64 `json:"total_percent"`
}

type MemoryDynamicInfo struct {
	Used            uint64  `json:"used"`
	Free            uint64  `json:"free"`
	UsedPercent     float64 `json:"used_percent"`
	SwapUsed        uint64  `json:"swap_used"`
	SwapFree        uint64  `json:"swap_free"`
	SwapUsedPercent float64 `json:"swap_used_percent"`
}

type DiskDynamicInfo struct {
	Used    uint64 `json:"used"`
	Free    uint64 `json:"free"`
	LogUsed int64  `json:"log_used"`
}

func SendCpuDynamicInfo() {
	ws.WebsocketManager.SendSubscribed(ws.SubScribeTypeSystemMonitor, CPU_INFO, CpuDynamicInfo{
		TotalPercent: monitor.GetCpuTotalPercent(),
	})
}

func SendMemoryDynamicInfo() {
	memoryInfo := monitor.GetMemoryInfo()
	ws.WebsocketManager.SendSubscribed(ws.SubScribeTypeSystemMonitor, MEMORY_INFO, MemoryDynamicInfo{
		Used:            memoryInfo.Used,
		Free:            memoryInfo.Free,
		UsedPercent:     memoryInfo.UsedPercent,
		SwapUsed:        memoryInfo.SwapUsed,
		SwapFree:        memoryInfo.SwapFree,
		SwapUsedPercent: memoryInfo.SwapUsedPercent,
	})
}

func SendDiskDynamicInfo() {
	diskInfo := monitor.GetDiskInfo()
	ws.WebsocketManager.SendSubscribed(ws.SubScribeTypeSystemMonitor, DISK_INFO, DiskDynamicInfo{
		Used:    diskInfo.Used,
		Free:    diskInfo.Free,
		LogUsed: diskInfo.LogUsed,
	})
}
