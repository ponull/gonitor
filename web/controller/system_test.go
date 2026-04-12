package controller

import (
	"strings"
	"testing"
)

func TestRenderPrometheusMetrics(t *testing.T) {
	output := renderPrometheusMetrics(systemSettingsSnapshot{
		Version:   "v1.0.0",
		Component: "master",
		GitCommit: "abc123",
		GoVersion: "go1.22.0",
		Counts: systemCounts{
			Tasks:             10,
			EnabledTasks:      8,
			DependencyTasks:   3,
			TimeoutTasks:      4,
			Nodes:             2,
			OnlineNodes:       1,
			Users:             5,
			RunningTaskGroups: 6,
		},
	})

	expectedLines := []string{
		"gonitor_tasks_total 10",
		"gonitor_tasks_enabled 8",
		"gonitor_tasks_with_dependency 3",
		"gonitor_tasks_with_timeout 4",
		"gonitor_nodes_total 2",
		"gonitor_nodes_online 1",
		"gonitor_users_total 5",
		"gonitor_scheduler_task_groups 6",
		`gonitor_build_info{version="v1.0.0",component="master",commit="abc123",go="go1.22.0"} 1`,
	}
	for _, expected := range expectedLines {
		if !strings.Contains(output, expected) {
			t.Fatalf("expected metrics output to contain %q, got %s", expected, output)
		}
	}
}
