package model

import (
	"testing"
)

func TestTaskLogTableName(t *testing.T) {
	taskLog := TaskLog{}
	if taskLog.TableName() != "task_log" {
		t.Errorf("TaskLog.TableName() = %q, want %q", taskLog.TableName(), "task_log")
	}
}

func TestTaskLogOutputFileField(t *testing.T) {
	// Test that TaskLog has OutputFile field for storing log file path
	taskLog := TaskLog{
		TaskId:     1,
		OutputFile: "1/2024_01_01/12_00_00_abcdefgh.txt",
	}
	if taskLog.OutputFile == "" {
		t.Error("TaskLog.OutputFile should not be empty when set")
	}
}
