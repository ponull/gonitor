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

func TestTaskDependencyField(t *testing.T) {
	task := Task{
		Name:    "dependent-task",
		Command: "echo hello",
	}
	if task.DependsOnTaskID != 0 {
		t.Errorf("Task.DependsOnTaskID default should be 0, got %d", task.DependsOnTaskID)
	}

	task.DependsOnTaskID = 42
	if task.DependsOnTaskID != 42 {
		t.Errorf("Task.DependsOnTaskID should be 42, got %d", task.DependsOnTaskID)
	}
}

func TestTaskTableName(t *testing.T) {
	task := Task{}
	if task.TableName() != "task" {
		t.Errorf("Task.TableName() = %q, want %q", task.TableName(), "task")
	}
}
