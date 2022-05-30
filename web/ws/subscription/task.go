package subscription

type TaskInfo struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	ExecType     string `json:"execType"`    //执行类型
	Command      string `json:"command"`     //执行命令
	Schedule     string `json:"schedule"`    //定时规则
	IsDisable    bool   `json:"isDisable"`   //是否禁用
	IsSingleton  bool   `json:"isSingleton"` //是否单例执行
	LastRunTime  string `json:"lastRunTime"`
	NextRunTime  string `json:"nextRunTime"`
	RunningCount int64  `json:"runningCount"`
}

func (t *TaskInfo) Push() {

}

func (t *TaskInfo) Subscribe() {

}

func (t *TaskInfo) Unsubscribe() {

}
