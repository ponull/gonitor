package controller

import (
	"fmt"
	"github.com/jinzhu/gorm"
	"gonitor/core"
	"gonitor/model"
	"gonitor/web/context"
	"gonitor/web/response"
	"gonitor/web/response/errorCode"
	"strconv"
	"strings"
	"time"
)

type taskTransferItem struct {
	ID              int64  `json:"id"`
	Name            string `json:"name"`
	Description     string `json:"description"`
	Command         string `json:"command"`
	Schedule        string `json:"schedule"`
	ExecType        string `json:"exec_type"`
	IsDisable       bool   `json:"is_disable"`
	Priority        int8   `json:"priority"`
	Tags            string `json:"tags"`
	ExecStrategy    int8   `json:"exec_strategy"`
	RetryTimes      int8   `json:"retry_times"`
	RetryInterval   int    `json:"retry_interval"`
	Timeout         int    `json:"timeout"`
	DependsOnTaskID int64  `json:"depends_on_task_id"`
	Assert          string `json:"assert"`
	ResultHandler   string `json:"result_handler"`
	NodeID          int64  `json:"node_id"`
}

type taskImportForm struct {
	Tasks []taskTransferItem `json:"tasks"`
}

func parseTaskIDs(value string) ([]int64, error) {
	if strings.TrimSpace(value) == "" {
		return nil, nil
	}
	parts := strings.Split(value, ",")
	ids := make([]int64, 0, len(parts))
	for _, part := range parts {
		id, err := strconv.ParseInt(strings.TrimSpace(part), 10, 64)
		if err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}

func exportTaskItems(taskModels []model.Task) []taskTransferItem {
	items := make([]taskTransferItem, 0, len(taskModels))
	for _, taskModel := range taskModels {
		items = append(items, taskTransferItem{
			ID:              taskModel.ID,
			Name:            taskModel.Name,
			Description:     taskModel.Description,
			Command:         taskModel.Command,
			Schedule:        taskModel.Schedule,
			ExecType:        taskModel.ExecType,
			IsDisable:       taskModel.IsDisable,
			Priority:        taskModel.Priority,
			Tags:            taskModel.Tags,
			ExecStrategy:    taskModel.ExecStrategy,
			RetryTimes:      taskModel.RetryTimes,
			RetryInterval:   taskModel.RetryInterval,
			Timeout:         taskModel.Timeout,
			DependsOnTaskID: taskModel.DependsOnTaskID,
			Assert:          taskModel.Assert,
			ResultHandler:   taskModel.ResultHandler,
			NodeID:          taskModel.NodeID,
		})
	}
	return items
}

func importTaskItems(db *gorm.DB, items []taskTransferItem) ([]*model.Task, error) {
	oldToNew := make(map[int64]int64)
	createdTasks := make([]*model.Task, 0, len(items))

	tx := db.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}
	for _, item := range items {
		payload := taskMutationPayload{
			Name:            item.Name,
			Description:     item.Description,
			ExecType:        item.ExecType,
			Command:         item.Command,
			Schedule:        item.Schedule,
			IsDisable:       true,
			Priority:        item.Priority,
			Tags:            item.Tags,
			ExecStrategy:    item.ExecStrategy,
			RetryTimes:      item.RetryTimes,
			RetryInterval:   item.RetryInterval,
			Timeout:         item.Timeout,
			DependsOnTaskID: 0,
			Assert:          item.Assert,
			ResultHandler:   item.ResultHandler,
			NodeID:          item.NodeID,
		}
		if err := validateTaskMutationPayload(0, &payload); err != nil {
			tx.Rollback()
			return nil, err
		}
		taskModel := &model.Task{
			Name:          payload.Name,
			Description:   payload.Description,
			Command:       payload.Command,
			Schedule:      payload.Schedule,
			ExecType:      payload.ExecType,
			IsDisable:     true,
			Priority:      payload.Priority,
			Tags:          payload.Tags,
			ExecStrategy:  payload.ExecStrategy,
			RetryTimes:    payload.RetryTimes,
			RetryInterval: payload.RetryInterval,
			Timeout:       payload.Timeout,
			Assert:        payload.Assert,
			ResultHandler: payload.ResultHandler,
			NodeID:        payload.NodeID,
		}
		if err := tx.Create(taskModel).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
		if item.ID > 0 {
			oldToNew[item.ID] = taskModel.ID
		}
		createdTasks = append(createdTasks, taskModel)
	}

	for index, item := range items {
		if item.DependsOnTaskID == 0 {
			continue
		}
		dependencyID := item.DependsOnTaskID
		if mappedID, ok := oldToNew[item.DependsOnTaskID]; ok {
			dependencyID = mappedID
		} else {
			dependencyTask := &model.Task{}
			dbRt := tx.Where("id = ?", dependencyID).First(dependencyTask)
			if dbRt.Error != nil {
				tx.Rollback()
				return nil, fmt.Errorf("depends_on_task_id is invalid")
			}
		}
		if dependencyID == createdTasks[index].ID {
			tx.Rollback()
			return nil, fmt.Errorf("task dependency cannot reference itself")
		}
		createdTasks[index].DependsOnTaskID = dependencyID
		if err := tx.Save(createdTasks[index]).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
	}
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}
	return createdTasks, nil
}

func ExportTasks(context *context.Context) *response.Response {
	taskIDs, err := parseTaskIDs(context.Query("ids"))
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "invalid ids", nil)
	}
	var taskModels []model.Task
	query := core.Db.Where("delete_time IS NULL").Order("id ASC")
	if len(taskIDs) > 0 {
		query = query.Where("id IN (?)", taskIDs)
	}
	if dbRt := query.Find(&taskModels); dbRt.Error != nil {
		return response.Resp().Error(errorCode.DB_ERROR, "query task fail", nil)
	}
	return response.Resp().Success("success", map[string]interface{}{
		"exported_at": time.Now().Format("2006-01-02 15:04:05"),
		"count":       len(taskModels),
		"tasks":       exportTaskItems(taskModels),
	})
}

func ImportTasks(context *context.Context) *response.Response {
	form := taskImportForm{}
	if err := context.ShouldBindJSON(&form); err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "parse fail:"+err.Error(), nil)
	}
	if len(form.Tasks) == 0 {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "tasks is required", nil)
	}
	createdTasks, err := importTaskItems(core.Db, form.Tasks)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, err.Error(), nil)
	}
	return response.Resp().Success("success", map[string]interface{}{
		"imported_count": len(createdTasks),
		"is_disable":     true,
		"tasks":          exportTaskItems(derefTasks(createdTasks)),
	})
}

func derefTasks(tasks []*model.Task) []model.Task {
	items := make([]model.Task, 0, len(tasks))
	for _, taskModel := range tasks {
		if taskModel == nil {
			continue
		}
		items = append(items, *taskModel)
	}
	return items
}
