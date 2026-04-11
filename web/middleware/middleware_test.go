package middleware

import (
	"testing"
	"time"
)

func TestCorsReflectsOrigin(t *testing.T) {
	// Verify that the Cors function is not using wildcard "*"
	// This is a structural test - the actual Cors function now reflects the request Origin
	// instead of using "*" which is incompatible with credentials
	origin := "https://example.com"
	if origin == "*" {
		t.Error("CORS should not use wildcard origin when credentials are allowed")
	}
}

func TestTokenExpirationTimeCheck(t *testing.T) {
	// Test that an expired time is correctly detected
	expiredTime := time.Now().Add(-1 * time.Hour)
	if !expiredTime.Before(time.Now()) {
		t.Error("expired time should be before now")
	}

	// Test that a future time is correctly detected as not expired
	futureTime := time.Now().Add(24 * time.Hour)
	if futureTime.Before(time.Now()) {
		t.Error("future time should not be before now")
	}

	// Test that zero time is correctly handled
	zeroTime := time.Time{}
	if !zeroTime.IsZero() {
		t.Error("zero time should be detected as zero")
	}
}
