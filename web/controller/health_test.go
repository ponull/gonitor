package controller

import (
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"gonitor/core"
	"testing"
)

func TestHealthCheckExists(t *testing.T) {
	// Verify the HealthCheck handler is defined and can be referenced
	fn := HealthCheck
	if fn == nil {
		t.Error("HealthCheck function should be defined")
	}
}

func TestReadyCheckExists(t *testing.T) {
	// Verify the ReadyCheck handler is defined and can be referenced
	fn := ReadyCheck
	if fn == nil {
		t.Error("ReadyCheck function should be defined")
	}
}

func TestBuildHealthStatusWithoutDatabase(t *testing.T) {
	originalDB := core.Db
	core.Db = nil
	defer func() {
		core.Db = originalDB
	}()

	data, ready := buildHealthStatus()
	if ready {
		t.Fatal("expected health status to be degraded when database is nil")
	}
	if data["status"] != "degraded" {
		t.Fatalf("expected degraded status, got %v", data["status"])
	}
}

func TestBuildHealthStatusWithDatabase(t *testing.T) {
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

	data, ready := buildHealthStatus()
	if !ready {
		t.Fatal("expected health status to be ready with in-memory database")
	}
	if data["db"] != true {
		t.Fatalf("expected db=true, got %v", data["db"])
	}
}
