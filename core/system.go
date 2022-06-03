package core

import (
	"github.com/shirou/gopsutil/cpu"
	"github.com/shirou/gopsutil/host"
	"github.com/shirou/gopsutil/mem"
	"log"
	"time"
)

type CpuInfo struct {
	CpuInfo      []cpu.InfoStat
	PhysicalCnt  int
	LogicalCnt   int
	TotalPercent []float64
	PerPercents  []float64
}

func GetSystemInfo() map[string]interface{} {
	bootTime, _ := host.BootTime()
	t := time.Unix(int64(bootTime), 0)
	platform, _, _, _ := host.PlatformInformation()
	mainInfo, _ := host.Info()
	return map[string]interface{}{
		"bootTime": t.Local().Format("2006-01-02 15:04:05"),
		"platform": platform,
		"mainInfo": mainInfo,
	}
}

func GetSystemUserList() []host.UserStat {
	users, _ := host.Users()
	if len(users) == 0 {
		return make([]host.UserStat, 0)
	}
	return users
}

// GetCPUPercent 获取CPU使用率
func GetCPUPercent() CpuInfo {

	infos, _ := cpu.Info()
	physicalCnt, _ := cpu.Counts(false) // cpu物理核数
	logicalCnt, _ := cpu.Counts(true)   // cpu逻辑核数
	// 获取 3s 内的总 CPU 使用率和每个 CPU 各自的使用率
	totalPercent, _ := cpu.Percent(time.Second, false) // 总 CPU 使用率
	perPercents, _ := cpu.Percent(time.Second, true)   // 每个 CPU 各自的使用率
	return CpuInfo{
		CpuInfo:      infos,
		PhysicalCnt:  physicalCnt,
		LogicalCnt:   logicalCnt,
		TotalPercent: totalPercent,
		PerPercents:  perPercents,
	}
}

// GetMemPercent 获取内存使用率
func GetMemPercent() float64 {
	memInfo, err := mem.VirtualMemory()
	if err != nil {
		log.Fatalln(err.Error())
		return -1
	}
	return memInfo.UsedPercent
}
