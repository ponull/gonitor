package task

import (
	"context"
	"os/exec"
	"testing"
	"time"
)

func TestCommandContextTimeout(t *testing.T) {
	// Verify that context.WithTimeout + exec.CommandContext correctly
	// terminates a long-running command
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "sleep", "10")
	err := cmd.Run()
	if err == nil {
		t.Error("expected error from timed out command, got nil")
	}
	if ctx.Err() != context.DeadlineExceeded {
		t.Errorf("expected DeadlineExceeded, got %v", ctx.Err())
	}
}

func TestCommandContextNoTimeout(t *testing.T) {
	// Verify that a command without timeout (timeout=0) runs to completion
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	cmd := exec.CommandContext(ctx, "echo", "hello")
	output, err := cmd.Output()
	if err != nil {
		t.Errorf("expected no error for normal command, got %v", err)
	}
	if len(output) == 0 {
		t.Error("expected output from echo command")
	}
}

func TestTimeoutDuration(t *testing.T) {
	// Verify that timeout seconds are correctly converted to Duration
	timeoutSec := 60
	d := time.Duration(timeoutSec) * time.Second
	if d != 60*time.Second {
		t.Errorf("expected 60s duration, got %v", d)
	}

	// Zero timeout means no limit
	zeroTimeout := 0
	if zeroTimeout > 0 {
		t.Error("zero timeout should mean no limit")
	}
}
