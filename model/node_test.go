package model

import (
	"testing"
)

func TestNodeTableName(t *testing.T) {
	node := Node{}
	if node.TableName() != "node" {
		t.Errorf("Expected table name 'node', got '%s'", node.TableName())
	}
}

func TestNodeDefaults(t *testing.T) {
	node := Node{}
	if node.Status != 0 {
		t.Errorf("Expected default status 0, got %d", node.Status)
	}
	if node.IsMaster != false {
		t.Errorf("Expected default IsMaster false, got %v", node.IsMaster)
	}
}

func TestTaskNodeID(t *testing.T) {
	task := Task{}
	if task.NodeID != 0 {
		t.Errorf("Expected default NodeID 0, got %d", task.NodeID)
	}
}
