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
	TASK_INFO       = 4
	NET_INFO        = 5
)

type TaskOverviewTpl struct {
	TaskCount                int `json:"task_count"`
	TaskEnableCount          int `json:"task_enable_count"`
	TaskOccupiedProcessCount int `json:"task_occupied_process_count"`
}

type CpuDynamicTpl struct {
	TotalPercent float64 `json:"total_percent"`
}

type MemoryDynamicTpl struct {
	Used            uint64  `json:"used"`
	Free            uint64  `json:"free"`
	UsedPercent     float64 `json:"used_percent"`
	SwapUsed        uint64  `json:"swap_used"`
	SwapFree        uint64  `json:"swap_free"`
	SwapUsedPercent float64 `json:"swap_used_percent"`
}

type DiskDynamicTpl struct {
	Used    uint64 `json:"used"`
	Free    uint64 `json:"free"`
	LogUsed int64  `json:"log_used"`
}

func SendTaskOverviewDynamicInfo(taskCount, enableCount, processCount int) {
	ws.WebsocketManager.SendSubscribed(ws.SubScribeTypeSystemMonitor, TASK_INFO, TaskOverviewTpl{
		TaskCount:                taskCount,
		TaskEnableCount:          enableCount,
		TaskOccupiedProcessCount: processCount,
	})
}

func SendCpuDynamicInfo() {
	ws.WebsocketManager.SendSubscribed(ws.SubScribeTypeSystemMonitor, CPU_INFO, CpuDynamicTpl{
		TotalPercent: monitor.GetCpuTotalPercent(),
	})
}

func SendMemoryDynamicInfo() {
	memoryInfo := monitor.GetMemoryInfo()
	ws.WebsocketManager.SendSubscribed(ws.SubScribeTypeSystemMonitor, MEMORY_INFO, MemoryDynamicTpl{
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
	ws.WebsocketManager.SendSubscribed(ws.SubScribeTypeSystemMonitor, DISK_INFO, DiskDynamicTpl{
		Used:    diskInfo.Used,
		Free:    diskInfo.Free,
		LogUsed: diskInfo.LogUsed,
	})
}
