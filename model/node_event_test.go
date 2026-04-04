package model

import (
	"testing"
	"time"
)

func TestNodeEventTableName(t *testing.T) {
	event := NodeEvent{}
	if event.TableName() != "node_event" {
		t.Errorf("Expected table name 'node_event', got '%s'", event.TableName())
	}
}

func TestNodeEventDefaults(t *testing.T) {
	event := NodeEvent{}
	if event.Synced != false {
		t.Errorf("Expected default Synced false, got %v", event.Synced)
	}
	if event.NodeID != 0 {
		t.Errorf("Expected default NodeID 0, got %d", event.NodeID)
	}
}

func TestNodeEventFields(t *testing.T) {
	now := time.Now()
	event := NodeEvent{
		NodeID:    1,
		EventType: "shutdown",
		Message:   "received SIGTERM",
		EventTime: now,
		Synced:    true,
	}
	if event.NodeID != 1 {
		t.Errorf("Expected NodeID 1, got %d", event.NodeID)
	}
	if event.EventType != "shutdown" {
		t.Errorf("Expected EventType 'shutdown', got '%s'", event.EventType)
	}
	if event.Message != "received SIGTERM" {
		t.Errorf("Expected Message 'received SIGTERM', got '%s'", event.Message)
	}
	if !event.Synced {
		t.Errorf("Expected Synced true, got false")
	}
}
