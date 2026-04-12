package controller

import (
	"gonitor/core"
	"gonitor/task"
	"gonitor/web/context"
	"gonitor/web/response"
)

func buildHealthStatus() (map[string]interface{}, bool) {
	status := map[string]interface{}{
		"status":              "healthy",
		"db":                  false,
		"log_folder":          core.Config.Script.LogFolder,
		"running_task_groups": len(task.Manager.TaskList),
	}
	if core.Db == nil {
		status["status"] = "degraded"
		status["message"] = "database not initialized"
		return status, false
	}
	dbCheck := core.Db.Exec("SELECT 1")
	if dbCheck.Error != nil {
		status["status"] = "degraded"
		status["message"] = "database connection failed"
		return status, false
	}
	status["db"] = true
	return status, true
}

// HealthCheck 健康检查接口 - 检查服务是否存活
func HealthCheck(context *context.Context) *response.Response {
	data, _ := buildHealthStatus()
	return response.Resp().Success("ok", data)
}

// ReadyCheck 就绪检查接口 - 检查服务是否可以接收流量
func ReadyCheck(context *context.Context) *response.Response {
	data, ready := buildHealthStatus()
	if !ready {
		data["status"] = "not_ready"
		message, _ := data["message"].(string)
		if message == "" {
			message = "database not initialized"
		}
		return response.Resp().Error(503, message, data)
	}
	data["status"] = "ready"
	return response.Resp().Success("ok", data)
}
