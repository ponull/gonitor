package handler

import "gonitor/model"

type HttpTaskHandler struct{}

func (h *HttpTaskHandler) Run(task *model.Task, taskLog *model.TaskLog) (string, error) {
	return "", nil
}
