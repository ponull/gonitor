package model

import (
	"testing"
)

func TestTaskTimeoutField(t *testing.T) {
	// Test that Task model has Timeout field with default 0
	task := Task{
		Name:    "test-task",
		Command: "echo hello",
	}
	if task.Timeout != 0 {
		t.Errorf("Task.Timeout default should be 0, got %d", task.Timeout)
	}

	// Test setting a timeout value
	task.Timeout = 300
	if task.Timeout != 300 {
		t.Errorf("Task.Timeout should be 300, got %d", task.Timeout)
	}
}

func TestTaskTableName(t *testing.T) {
	task := Task{}
	if task.TableName() != "task" {
		t.Errorf("Task.TableName() = %q, want %q", task.TableName(), "task")
	}
}
