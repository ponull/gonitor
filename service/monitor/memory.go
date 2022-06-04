package monitor

import "github.com/shirou/gopsutil/mem"

type MemoryStat struct {
	Total           uint64  `json:"total"`
	Used            uint64  `json:"used"`
	Free            uint64  `json:"free"`
	UsedPercent     float64 `json:"used_percent"`
	SwapTotal       uint64  `json:"swap_total"`
	SwapUsed        uint64  `json:"swap_used"`
	SwapFree        uint64  `json:"swap_free"`
	SwapUsedPercent float64 `json:"swap_used_percent"`
}

func GetMemoryInfo() MemoryStat {
	virtualMemory, _ := mem.VirtualMemory()
	swapMemory, _ := mem.SwapMemory()
	return MemoryStat{
		Total:           virtualMemory.Total,
		Free:            virtualMemory.Available,
		Used:            virtualMemory.Used,
		UsedPercent:     virtualMemory.UsedPercent,
		SwapTotal:       swapMemory.Total,
		SwapUsed:        swapMemory.Used,
		SwapFree:        swapMemory.Free,
		SwapUsedPercent: swapMemory.UsedPercent,
	}
}
