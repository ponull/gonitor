package controller

import (
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
