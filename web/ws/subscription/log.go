package subscription

type TaskLogInfo struct {
	ID            int64  `json:"id"`
	TaskID        int64  `json:"task_id"`
	Command       string `json:"command"` //执行命令
	ProcessID     int64  `json:"process_id"`
	ExecutionTime string `json:"execution_time"` //定时规则
}
