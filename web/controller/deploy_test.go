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

func TestValidateInstallPath(t *testing.T) {
	tests := []struct {
		name    string
		path    string
		wantErr bool
	}{
		{"empty path", "", true},
		{"valid path", "/opt/gonitor", false},
		{"valid nested path", "/home/user/gonitor-agent", false},
		{"path with dots", "/opt/gonitor/v1.0", false},
		{"path traversal", "/opt/../etc/passwd", true},
		{"shell injection semicolon", "/opt/gonitor; rm -rf /", true},
		{"shell injection backtick", "/opt/`whoami`", true},
		{"shell injection dollar", "/opt/$(whoami)", true},
		{"shell injection pipe", "/opt/gonitor | cat", true},
		{"shell injection ampersand", "/opt/gonitor && echo", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateInstallPath(tt.path)
			if (err != nil) != tt.wantErr {
				t.Errorf("validateInstallPath(%q) error = %v, wantErr %v", tt.path, err, tt.wantErr)
			}
		})
	}
}

func TestMapToGoArch(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"x86_64", "amd64"},
		{"amd64", "amd64"},
		{"aarch64", "arm64"},
		{"arm64", "arm64"},
		{"armv7l", "arm"},
		{"armv6l", "arm"},
		{"i386", "386"},
		{"i686", "386"},
		{"unknown", "unknown"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := mapToGoArch(tt.input)
			if result != tt.expected {
				t.Errorf("mapToGoArch(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestMapToGoOS(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"Linux", "linux"},
		{"Darwin", "darwin"},
		{"FreeBSD", "freebsd"},
		{"Unknown", "unknown"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := mapToGoOS(tt.input)
			if result != tt.expected {
				t.Errorf("mapToGoOS(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}
