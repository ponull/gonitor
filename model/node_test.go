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

func TestNodeSystemInfoFields(t *testing.T) {
	node := Node{
		IP:           "192.168.1.100",
		OS:           "Linux",
		Arch:         "x86_64",
		CPUCores:     4,
		MemoryTotal:  8589934592,
		GoVersion:    "go1.17",
		AgentVersion: "1.0.0",
	}
	if node.IP != "192.168.1.100" {
		t.Errorf("Expected IP '192.168.1.100', got '%s'", node.IP)
	}
	if node.OS != "Linux" {
		t.Errorf("Expected OS 'Linux', got '%s'", node.OS)
	}
	if node.Arch != "x86_64" {
		t.Errorf("Expected Arch 'x86_64', got '%s'", node.Arch)
	}
	if node.CPUCores != 4 {
		t.Errorf("Expected CPUCores 4, got %d", node.CPUCores)
	}
	if node.MemoryTotal != 8589934592 {
		t.Errorf("Expected MemoryTotal 8589934592, got %d", node.MemoryTotal)
	}
	if node.GoVersion != "go1.17" {
		t.Errorf("Expected GoVersion 'go1.17', got '%s'", node.GoVersion)
	}
	if node.AgentVersion != "1.0.0" {
		t.Errorf("Expected AgentVersion '1.0.0', got '%s'", node.AgentVersion)
	}
}

func TestNodeInfoTplSystemFields(t *testing.T) {
	tpl := NodeInfoTpl{
		IP:       "10.0.0.1",
		OS:       "Linux",
		Arch:     "aarch64",
		CPUCores: 8,
	}
	if tpl.IP != "10.0.0.1" {
		t.Errorf("Expected IP '10.0.0.1', got '%s'", tpl.IP)
	}
	if tpl.CPUCores != 8 {
		t.Errorf("Expected CPUCores 8, got %d", tpl.CPUCores)
	}
}

func TestNodeLastPingAtNilByDefault(t *testing.T) {
	node := Node{}
	if node.LastPingAt != nil {
		t.Errorf("Expected LastPingAt to be nil by default")
	}
}
