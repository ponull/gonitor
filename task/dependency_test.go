package task

import (
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"gonitor/core"
	"gonitor/model"
	"testing"
)

func TestValidateTaskDependency(t *testing.T) {
	originalDB := core.Db
	db, err := gorm.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("failed to open sqlite db: %v", err)
	}
	core.Db = db
	defer func() {
		core.Db = originalDB
		db.Close()
	}()
	db.AutoMigrate(&model.Task{}, &model.TaskLog{})

	dependencyTask := &model.Task{
		Name:     "dependency",
		Command:  "echo dependency",
		Schedule: "* * * * *",
		ExecType: "cmd",
	}
	if err := db.Create(dependencyTask).Error; err != nil {
		t.Fatalf("failed to create dependency task: %v", err)
	}
	taskModel := &model.Task{
		Name:            "dependent",
		Command:         "echo dependent",
		Schedule:        "* * * * *",
		ExecType:        "cmd",
		DependsOnTaskID: dependencyTask.ID,
	}
	if err := db.Create(taskModel).Error; err != nil {
		t.Fatalf("failed to create task: %v", err)
	}

	if err := validateTaskDependency(taskModel); err == nil {
		t.Fatal("expected dependency check to fail without successful dependency log")
	}

	if err := db.Create(&model.TaskLog{
		TaskId:     dependencyTask.ID,
		Status:     false,
		ExecResult: true,
	}).Error; err != nil {
		t.Fatalf("failed to create dependency log: %v", err)
	}

	if err := validateTaskDependency(taskModel); err != nil {
		t.Fatalf("expected dependency check to pass, got %v", err)
	}
}
