package monitor

import (
	"github.com/shirou/gopsutil/cpu"
	"time"
)

type CpuStat struct {
	PhysicalCoresCount int     `json:"physical_cores_count"`
	LogicalCoresCount  int     `json:"logical_cores_count"`
	TotalPercent       float64 `json:"total_percent"`
}

func GetCpuInfo() CpuStat {
	physicalCnt, _ := cpu.Counts(false) // cpu物理核数
	logicalCnt, _ := cpu.Counts(true)   // cpu逻辑核数
	return CpuStat{
		PhysicalCoresCount: physicalCnt,
		LogicalCoresCount:  logicalCnt,
		TotalPercent:       GetCpuTotalPercent(),
	}
}

func GetCpuTotalPercent() float64 {
	cpuPercent, _ := cpu.Percent(time.Second, false)
	return cpuPercent[0]
}

func GetCpuPerPercents() []float64 {
	cpuPercent, _ := cpu.Percent(time.Second, true)
	return cpuPercent
}
