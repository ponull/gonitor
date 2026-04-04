package model

import "time"

// NodeEvent 节点事件记录，用于离线事件缓存和后续同步
type NodeEvent struct {
	Base
	NodeID    int64     `gorm:"column:node_id;index" json:"node_id"`       // 节点ID
	EventType string    `gorm:"column:event_type" json:"event_type"`       // 事件类型: shutdown, restart, crash, start, update
	Message   string    `gorm:"column:message;size:1024" json:"message"`   // 事件消息
	EventTime time.Time `gorm:"column:event_time" json:"event_time"`       // 事件发生时间
	Synced    bool      `gorm:"column:synced;default:false" json:"synced"` // 是否已同步到主控端
}

func (NodeEvent) TableName() string {
	return "node_event"
}
