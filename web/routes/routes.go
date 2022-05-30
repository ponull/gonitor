package routes

import (
	"github.com/gin-gonic/gin"
	"gonitor/web/controller"
	"gonitor/web/kernel"
	"gonitor/web/ws"
)

func config(router group) {
	router.Registered(GET, "/", controller.Index)
	router.Registered(GET, "/getTaskList", controller.GetTaskList)
	router.Registered(GET, "/getTaskLogList", controller.GetTaskLogList)
	router.Registered(GET, "/updateTaskInfo", controller.UpdateTaskInfo)
}

func Load(r *gin.Engine) {
	router := newRouter(r)
	router.Group("", func(g group) {
		config(g)
	}, kernel.Middleware...)
	r.GET("/ws/:clientId", ws.WebsocketManager.WsClient)
}
