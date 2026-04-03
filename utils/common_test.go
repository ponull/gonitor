package utils

import (
	"testing"
)

func TestMd5(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"123456", "e10adc3949ba59abbe56e057f20f883e"},
		{"", "d41d8cd98f00b204e9800998ecf8427e"},
		{"hello world", "5eb63bbbe01eeed093cb22bb8f5acdc3"},
	}
	for _, tt := range tests {
		result := Md5(tt.input)
		if result != tt.expected {
			t.Errorf("Md5(%q) = %q, want %q", tt.input, result, tt.expected)
		}
	}
}

func TestHashPassword(t *testing.T) {
	password := "testpassword123"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword() error = %v", err)
	}
	if len(hash) == 0 {
		t.Fatal("HashPassword() returned empty hash")
	}
	// Bcrypt hashes should start with "$2a$" or "$2b$"
	if hash[0] != '$' {
		t.Errorf("HashPassword() hash doesn't look like bcrypt: %q", hash)
	}
}

func TestHashPasswordDifferentEachTime(t *testing.T) {
	password := "samepassword"
	hash1, _ := HashPassword(password)
	hash2, _ := HashPassword(password)
	if hash1 == hash2 {
		t.Error("HashPassword() should produce different hashes for the same password (due to salt)")
	}
}

func TestCheckPasswordWithBcrypt(t *testing.T) {
	password := "mySecurePassword"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword() error = %v", err)
	}

	if !CheckPassword(password, hash) {
		t.Error("CheckPassword() should return true for correct password")
	}

	if CheckPassword("wrongpassword", hash) {
		t.Error("CheckPassword() should return false for wrong password")
	}
}

func TestCheckPasswordWithLegacyMd5(t *testing.T) {
	password := "123456"
	md5Hash := Md5(password)

	if !CheckPassword(password, md5Hash) {
		t.Error("CheckPassword() should return true for correct password with legacy MD5 hash")
	}

	if CheckPassword("wrongpassword", md5Hash) {
		t.Error("CheckPassword() should return false for wrong password with legacy MD5 hash")
	}
}

func TestCreateRandomString(t *testing.T) {
	tests := []int{0, 1, 10, 32, 64}
	for _, length := range tests {
		result := CreateRandomString(length)
		if len(result) != length {
			t.Errorf("CreateRandomString(%d) returned string of length %d", length, len(result))
		}
	}
}

func TestCreateRandomStringUniqueness(t *testing.T) {
	str1 := CreateRandomString(32)
	str2 := CreateRandomString(32)
	if str1 == str2 {
		t.Error("CreateRandomString() should produce different strings on each call")
	}
}

func TestInt32ToBytesAndBack(t *testing.T) {
	tests := []int32{0, 1, -1, 42, 2147483647, -2147483648}
	for _, val := range tests {
		bytes := Int32ToBytes(val)
		result := BytesToInt32(bytes)
		if result != val {
			t.Errorf("Int32ToBytes -> BytesToInt32 roundtrip: got %d, want %d", result, val)
		}
	}
}
