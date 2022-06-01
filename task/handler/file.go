package handler

import "gonitor/model"

type FileTaskHandler struct{}

func (h *FileTaskHandler) Run(task *model.Task, taskLog *model.TaskLog) (string, error) {
	return "", nil
}
