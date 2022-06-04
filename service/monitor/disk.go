package monitor

import (
	"github.com/shirou/gopsutil/disk"
)

type DiskStat struct {
	Total      uint64 `json:"total"`
	FileSystem string `json:"file_system"`
	Used       uint64 `json:"used"`
	Free       uint64 `json:"free"`
	LogUsed    int64  `json:"log_used"`
}

func GetDiskInfo() DiskStat {
	usage, _ := disk.Usage("/")
	//logAbsPath, _ := filepath.Abs(core.Config.Script.LogFolder)
	//logPathstat, _ := os.Stat(logAbsPath)
	return DiskStat{
		Total:      usage.Total,
		FileSystem: usage.Fstype,
		Used:       usage.Used,
		Free:       usage.Free,
		LogUsed:    0,
	}
}
