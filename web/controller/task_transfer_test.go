package controller

import (
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"gonitor/model"
	"testing"
)

func TestImportTaskItemsRemapsDependencies(t *testing.T) {
	db, err := gorm.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("failed to open sqlite db: %v", err)
	}
	defer db.Close()
	db.AutoMigrate(&model.Task{})

	imported, err := importTaskItems(db, []taskTransferItem{
		{
			ID:         100,
			Name:       "task-a",
			Command:    "echo a",
			Schedule:   "* * * * *",
			ExecType:   "cmd",
			Priority:   1,
			Timeout:    10,
			IsDisable:  false,
			RetryTimes: 0,
		},
		{
			ID:              200,
			Name:            "task-b",
			Command:         "echo b",
			Schedule:        "* * * * *",
			ExecType:        "cmd",
			Priority:        1,
			DependsOnTaskID: 100,
			Timeout:         20,
			IsDisable:       false,
			RetryTimes:      0,
		},
	})
	if err != nil {
		t.Fatalf("importTaskItems returned error: %v", err)
	}
	if len(imported) != 2 {
		t.Fatalf("expected 2 imported tasks, got %d", len(imported))
	}
	if !imported[0].IsDisable || !imported[1].IsDisable {
		t.Fatal("expected imported tasks to be disabled by default")
	}
	if imported[1].DependsOnTaskID != imported[0].ID {
		t.Fatalf("expected dependency remapped to %d, got %d", imported[0].ID, imported[1].DependsOnTaskID)
	}
}
