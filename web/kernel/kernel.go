package kernel

import (
	"gonitor/web/context"
	"gonitor/web/exception"
	"gonitor/web/middleware"
)

var Middleware []context.HandlerFunc

func Load() {
	Middleware = []context.HandlerFunc{
		exception.Exception,
		middleware.Cors,
		//session.Session, //没有运行session 就不用打开
	}
}
