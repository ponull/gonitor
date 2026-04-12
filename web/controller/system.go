package controller

import (
	"fmt"
	"gonitor/core"
	"gonitor/model"
	"gonitor/task"
	"gonitor/web/context"
	"gonitor/web/response"
	"runtime"
	"strings"
)

type systemCounts struct {
	Tasks             int64 `json:"tasks"`
	EnabledTasks      int64 `json:"enabled_tasks"`
	DependencyTasks   int64 `json:"dependency_tasks"`
	TimeoutTasks      int64 `json:"timeout_tasks"`
	Nodes             int64 `json:"nodes"`
	OnlineNodes       int64 `json:"online_nodes"`
	Users             int64 `json:"users"`
	RunningTaskGroups int   `json:"running_task_groups"`
}

type systemSettingsSnapshot struct {
	Version    string            `json:"version"`
	BuildTime  string            `json:"build_time"`
	GitCommit  string            `json:"git_commit"`
	Component  string            `json:"component"`
	GoVersion  string            `json:"go_version"`
	Database   map[string]string `json:"database"`
	HttpServer map[string]string `json:"http_server"`
	Script     map[string]string `json:"script"`
	Features   map[string]bool   `json:"features"`
	Counts     systemCounts      `json:"counts"`
}

func collectSystemCounts() systemCounts {
	counts := systemCounts{
		RunningTaskGroups: len(task.Manager.TaskList),
	}
	if core.Db == nil {
		return counts
	}
	core.Db.Model(&model.Task{}).Where("delete_time IS NULL").Count(&counts.Tasks)
	core.Db.Model(&model.Task{}).Where("delete_time IS NULL AND is_disable = ?", false).Count(&counts.EnabledTasks)
	core.Db.Model(&model.Task{}).Where("delete_time IS NULL AND depends_on_task_id > 0").Count(&counts.DependencyTasks)
	core.Db.Model(&model.Task{}).Where("delete_time IS NULL AND timeout > 0").Count(&counts.TimeoutTasks)
	core.Db.Model(&model.Node{}).Where("delete_time IS NULL").Count(&counts.Nodes)
	core.Db.Model(&model.Node{}).Where("delete_time IS NULL AND status = ?", 1).Count(&counts.OnlineNodes)
	core.Db.Model(&model.User{}).Where("delete_time IS NULL").Count(&counts.Users)
	return counts
}

func buildSystemSettingsSnapshot() systemSettingsSnapshot {
	return systemSettingsSnapshot{
		Version:   core.Version,
		BuildTime: core.BuildTime,
		GitCommit: core.GitCommit,
		Component: core.Component,
		GoVersion: runtime.Version(),
		Database: map[string]string{
			"driver": core.Config.Database.Driver,
		},
		HttpServer: map[string]string{
			"host": core.Config.HttpServer.Host,
			"port": core.Config.HttpServer.Post,
		},
		Script: map[string]string{
			"folder":     core.Config.Script.Folder,
			"log_folder": core.Config.Script.LogFolder,
		},
		Features: map[string]bool{
			"task_timeout":       true,
			"task_dependency":    true,
			"system_settings":    true,
			"prometheus_metrics": true,
			"task_export":        true,
			"task_import":        true,
			"health_check":       true,
		},
		Counts: collectSystemCounts(),
	}
}

func renderPrometheusMetrics(snapshot systemSettingsSnapshot) string {
	lines := []string{
		"# HELP gonitor_tasks_total Total configured tasks.",
		"# TYPE gonitor_tasks_total gauge",
		fmt.Sprintf("gonitor_tasks_total %d", snapshot.Counts.Tasks),
		"# HELP gonitor_tasks_enabled Total enabled tasks.",
		"# TYPE gonitor_tasks_enabled gauge",
		fmt.Sprintf("gonitor_tasks_enabled %d", snapshot.Counts.EnabledTasks),
		"# HELP gonitor_tasks_with_dependency Total tasks using dependency chaining.",
		"# TYPE gonitor_tasks_with_dependency gauge",
		fmt.Sprintf("gonitor_tasks_with_dependency %d", snapshot.Counts.DependencyTasks),
		"# HELP gonitor_tasks_with_timeout Total tasks using timeout protection.",
		"# TYPE gonitor_tasks_with_timeout gauge",
		fmt.Sprintf("gonitor_tasks_with_timeout %d", snapshot.Counts.TimeoutTasks),
		"# HELP gonitor_nodes_total Total configured nodes.",
		"# TYPE gonitor_nodes_total gauge",
		fmt.Sprintf("gonitor_nodes_total %d", snapshot.Counts.Nodes),
		"# HELP gonitor_nodes_online Total online nodes.",
		"# TYPE gonitor_nodes_online gauge",
		fmt.Sprintf("gonitor_nodes_online %d", snapshot.Counts.OnlineNodes),
		"# HELP gonitor_users_total Total users.",
		"# TYPE gonitor_users_total gauge",
		fmt.Sprintf("gonitor_users_total %d", snapshot.Counts.Users),
		"# HELP gonitor_scheduler_task_groups Total task groups loaded in memory.",
		"# TYPE gonitor_scheduler_task_groups gauge",
		fmt.Sprintf("gonitor_scheduler_task_groups %d", snapshot.Counts.RunningTaskGroups),
		"# HELP gonitor_build_info Build information.",
		"# TYPE gonitor_build_info gauge",
		fmt.Sprintf("gonitor_build_info{version=%q,component=%q,commit=%q,go=%q} 1", snapshot.Version, snapshot.Component, snapshot.GitCommit, snapshot.GoVersion),
	}
	return strings.Join(lines, "\n") + "\n"
}

func GetSystemSettings(context *context.Context) *response.Response {
	return response.Resp().Success("success", buildSystemSettingsSnapshot())
}

func GetPrometheusMetrics(context *context.Context) *response.Response {
	return response.Resp().String(renderPrometheusMetrics(buildSystemSettingsSnapshot()))
}
