package exception

import (
	"fmt"
	"gonitor/web/context"
	"runtime/debug"
)

func Exception(c *context.Context) {
	defer func() {
		if r := recover(); r != nil {
			//这里有一个错误  例如客户端设置了超时时间，那么客户端会主动断开连接，这里就会提示状态码从200变到500  引起gin框架的报错
			msg := fmt.Sprint(r) + "\n" + string(debug.Stack())
			c.String(500, msg)
			c.Abort()
		}
	}()
	c.Next()
}
