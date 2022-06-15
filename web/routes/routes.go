package routes

import (
	"github.com/gin-gonic/gin"
	"gonitor/web/controller"
	"gonitor/web/kernel"
	"gonitor/web/middleware"
	"gonitor/web/ws"
)

func config(router group) {
	//router.Registered(GET, "/", controller.Index)
	//router.Registered(GET, "/getTaskInfo", controller.GetTaskInfo)
	router.Group("/system", func(systemGroup group) {
		systemGroup.Registered(GET, "/overview", controller.GetSystemOverview)
		systemGroup.Registered(GET, "/cpu", controller.GetCpuInfo)
		systemGroup.Registered(GET, "/memory", controller.GetMemoryInfo)
		systemGroup.Registered(GET, "/disk", controller.GetDiskInfo)
		systemGroup.Registered(GET, "/net", controller.GetDiskInfo)
	}, middleware.CheckToken)
	router.Group("/task", func(taskGroup group) {
		taskGroup.Registered(POST, "", controller.AddTask)
		taskGroup.Registered(PUT, "/:task_id", controller.EditTask)
		taskGroup.Registered(DELETE, "/:task_id", controller.DeleteTask)
		taskGroup.Registered(GET, "/info/:task_id", controller.GetTaskInfo)
		taskGroup.Registered(GET, "/list", controller.GetTaskList)
		taskGroup.Registered(GET, "/stop/:task_id", controller.StopTask)
		taskGroup.Registered(GET, "/start/:task_id", controller.StartTask)
		taskGroup.Registered(GET, "/test/:task_id", controller.StartOnceTask)
		taskGroup.Group("/log", func(logGroup group) {
			logGroup.Registered(GET, "/list/running/:task_id", controller.GetTaskRunningList)
			logGroup.Registered(GET, "/list/:task_id/:page_number/:page_size", controller.GetTaskLogList)
			logGroup.Registered(GET, "/output/:log_id", controller.GetTaskLogExecOutput)
		})
		//taskGroup.Registered(GET, "/stop/kill", controller.StopTask)
	}, middleware.CheckToken)
	router.Group("/user", func(userGroup group) {
		userGroup.Registered(POST, "/login", controller.UserLogin)
		userGroup.Group("", func(adminGroup group) {
			adminGroup.Registered(GET, "/list/:page_number/:page_size", controller.GetUserList)
			adminGroup.Registered(POST, "", controller.AddUser)
			adminGroup.Registered(GET, "/selfInfo", controller.GetSelfInfo)
			adminGroup.Registered(GET, "/:user_id", controller.GetUserInfo)
			adminGroup.Registered(PUT, "/:user_id", controller.EditUser)
			adminGroup.Registered(DELETE, "/:user_id", controller.DeleteUser)
		}, middleware.CheckToken)
	})
	router.Group("/op", func(opGroup group) {
		opGroup.Registered(GET, "/list/:page_number/:page_size", controller.GetOperationLogList)
	}, middleware.CheckToken)
	router.Group("/push", func(pushGroup group) {
		pushGroup.Registered(GET, "/test", controller.TestPush)
	})
}

func Load(r *gin.Engine) {
	router := newRouter(r)
	router.Group("", func(g group) {
		config(g)
	}, kernel.Middleware...)
	r.GET("/ws/:clientId", ws.WebsocketManager.WsClient)
}
