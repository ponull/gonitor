package core

import (
	"testing"
)

func TestVersionDefaults(t *testing.T) {
	if Version != "dev" {
		t.Errorf("Expected default Version 'dev', got '%s'", Version)
	}
	if BuildTime != "unknown" {
		t.Errorf("Expected default BuildTime 'unknown', got '%s'", BuildTime)
	}
	if GitCommit != "unknown" {
		t.Errorf("Expected default GitCommit 'unknown', got '%s'", GitCommit)
	}
	if Component != "master" {
		t.Errorf("Expected default Component 'master', got '%s'", Component)
	}
}
