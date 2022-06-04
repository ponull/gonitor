package monitor

import "github.com/shirou/gopsutil/net"

type NetStat struct {
	Name      string `json:"name"`
	BytesSent uint64 `json:"bytesSent"`
	BytesRecv uint64 `json:"bytesRecv"`
}

func GetNetInfo() []NetStat {
	ioCountersStat, _ := net.IOCounters(true)
	var NetList = make([]NetStat, 0)
	for _, ioItem := range ioCountersStat {
		NetList = append(NetList, NetStat{
			Name:      ioItem.Name,
			BytesSent: ioItem.BytesSent,
			BytesRecv: ioItem.BytesRecv,
		})
	}
	return NetList
}
