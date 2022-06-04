package monitor

import (
	"github.com/shirou/gopsutil/host"
	"github.com/shirou/gopsutil/load"
	"time"
)

type SystemStat struct {
	BootTime      string        `json:"boot_time"`
	Os            string        `json:"os"`
	Platform      string        `json:"platform"`
	KernelVersion string        `json:"kernel_version"`
	KernelArch    string        `json:"kernel_arch"`
	AvgStat       *load.AvgStat `json:"avg_stat"`
}

func GetSystemInfo() SystemStat {
	hostInfo, _ := host.Info()
	bootTimestamp := hostInfo.BootTime //时间戳好像是
	bootTimes := time.Unix(int64(bootTimestamp), 0)
	//内核占用
	avg, _ := load.Avg()
	return SystemStat{
		BootTime:      bootTimes.Local().Format("2006-01-02 15:04:05"),
		Os:            hostInfo.OS,
		Platform:      hostInfo.Platform,
		KernelVersion: hostInfo.KernelVersion,
		KernelArch:    hostInfo.KernelArch,
		AvgStat:       avg,
	}
}
