package session

import (
	context2 "context"
	"encoding/json"
	uuid "github.com/satori/go.uuid"
	"gonitor/web/context"
	"gonitor/web/redis"
	"time"
)

var cookieName = "yogo"
var lifeTime = 3600

func Session(c *context.Context) {
	cookie, err := c.Cookie(cookieName)
	if err == nil {
		sessionString, err := redis.Client().Get(context2.TODO(), cookie).Result()
		if err == nil {
			var session context.Session
			err = json.Unmarshal([]byte(sessionString), &session)
			if err != nil {
				return
			}
			c.Set("_session", session)
			return
		}
	}
	sessionKey := uuid.NewV4().String()
	c.SetCookie(cookieName, sessionKey, lifeTime, "/", c.Domain(), false, true)
	session := context.Session{
		Cookie:      sessionKey,
		ExpireTime:  time.Now().Unix() + int64(lifeTime),
		SessionList: make(map[string]interface{}),
	}

	c.Set("_session", session)
	jsonString, _ := json.Marshal(session)
	redis.Client().Set(context2.TODO(), sessionKey, jsonString, time.Second*time.Duration(lifeTime))
}
