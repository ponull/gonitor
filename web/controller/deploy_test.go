package controller

import (
	"testing"
)

func TestValidateSSHHost(t *testing.T) {
	tests := []struct {
		name    string
		host    string
		wantErr bool
	}{
		{"empty host", "", true},
		{"localhost", "127.0.0.1", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateSSHHost(tt.host)
			if (err != nil) != tt.wantErr {
				t.Errorf("validateSSHHost(%q) error = %v, wantErr %v", tt.host, err, tt.wantErr)
			}
		})
	}
}
