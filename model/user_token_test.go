package model

import (
	"testing"
	"time"
)

func TestUserTokenExpiredAt(t *testing.T) {
	token := UserToken{
		UserID:    1,
		Token:     "test-token-string",
		ExpiredAt: time.Now().Add(24 * time.Hour),
	}

	// Token should not be expired
	if token.ExpiredAt.Before(time.Now()) {
		t.Error("newly created token should not be expired")
	}

	// Expired token
	expiredToken := UserToken{
		UserID:    1,
		Token:     "expired-token-string",
		ExpiredAt: time.Now().Add(-1 * time.Hour),
	}
	if !expiredToken.ExpiredAt.Before(time.Now()) {
		t.Error("expired token should have ExpiredAt before now")
	}
}

func TestUserTokenTableName(t *testing.T) {
	token := UserToken{}
	if token.TableName() != "user_token" {
		t.Errorf("UserToken.TableName() = %q, want %q", token.TableName(), "user_token")
	}
}
