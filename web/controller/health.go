package controller

import (
	"gonitor/core"
	"gonitor/web/context"
	"gonitor/web/response"
)

// HealthCheck 健康检查接口 - 检查服务是否存活
func HealthCheck(context *context.Context) *response.Response {
	return response.Resp().Success("ok", map[string]interface{}{
		"status": "healthy",
	})
}

// ReadyCheck 就绪检查接口 - 检查服务是否可以接收流量
func ReadyCheck(context *context.Context) *response.Response {
	// 检查数据库连接
	if core.Db == nil {
		return response.Resp().Error(503, "database not initialized", map[string]interface{}{
			"status": "not_ready",
			"db":     false,
		})
	}
	dbCheck := core.Db.Exec("SELECT 1")
	if dbCheck.Error != nil {
		return response.Resp().Error(503, "database connection failed", map[string]interface{}{
			"status": "not_ready",
			"db":     false,
		})
	}
	return response.Resp().Success("ok", map[string]interface{}{
		"status": "ready",
		"db":     true,
	})
}
