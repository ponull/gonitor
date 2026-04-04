package controller

import (
	"fmt"
	"gonitor/core"
	"gonitor/model"
	"gonitor/utils"
	"gonitor/web/context"
	"gonitor/web/response"
	"gonitor/web/response/errorCode"
	"strconv"
)

// GetNodeList 获取节点列表
func GetNodeList(context *context.Context) *response.Response {
	var nodeList []model.NodeInfoTpl
	core.Db.Table("node").Where("delete_time IS NULL").Order("is_master DESC, id ASC").Scan(&nodeList)
	return response.Resp().Success("success", nodeList)
}

// GetNodeInfo 获取单个节点信息
func GetNodeInfo(context *context.Context) *response.Response {
	nodeId := context.Param("node_id")
	nodeModel := model.Node{}
	dbRt := core.Db.Where("id = ?", nodeId).First(&nodeModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "node not found", nil)
	}
	return response.Resp().Success("success", nodeModel)
}

// AddNode 添加边缘节点
func AddNode(context *context.Context) *response.Response {
	type nodeAddFormTpl struct {
		Name    string `json:"name"`
		Region  string `json:"region"`
		Address string `json:"address"`
		Remark  string `json:"remark"`
	}
	addInfo := nodeAddFormTpl{}
	err := context.ShouldBindJSON(&addInfo)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "parse fail:"+err.Error(), nil)
	}
	if len(addInfo.Name) == 0 {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "node name is required", nil)
	}
	if len(addInfo.Name) > 255 {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "node name must be less than 255 characters", nil)
	}
	if len(addInfo.Address) == 0 {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "node address is required", nil)
	}

	// 检查名称是否已存在
	existNode := model.Node{}
	dbCheck := core.Db.Where("name = ?", addInfo.Name).First(&existNode)
	if dbCheck.Error == nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "node name already exists", nil)
	}

	secretKey := utils.CreateRandomString(32)
	nodeModel := &model.Node{
		Name:      addInfo.Name,
		Region:    addInfo.Region,
		Address:   addInfo.Address,
		SecretKey: secretKey,
		Status:    0,
		IsMaster:  false,
		Remark:    addInfo.Remark,
	}
	dbRt := core.Db.Create(nodeModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.DB_ERROR, "create node fail", nil)
	}

	model.OperationLog{}.AddOperationLog(
		getCurrentUserId(context),
		nodeModel.ID,
		"AddNode",
		fmt.Sprintf("Node:%s\nRegion:%s\nClient Ip:%s", nodeModel.Name, nodeModel.Region, context.ClientIP()))
	return response.Resp().Success("add success", nodeModel)
}

// EditNode 编辑边缘节点
func EditNode(context *context.Context) *response.Response {
	type nodeEditFormTpl struct {
		Name    string `json:"name"`
		Region  string `json:"region"`
		Address string `json:"address"`
		Remark  string `json:"remark"`
	}
	editInfo := nodeEditFormTpl{}
	err := context.ShouldBindJSON(&editInfo)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "parse fail:"+err.Error(), nil)
	}
	nodeId := context.Param("node_id")
	nodeModel := &model.Node{}
	dbRt := core.Db.Where("id = ?", nodeId).First(nodeModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "node not found", nil)
	}
	if nodeModel.IsMaster {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "cannot edit master node connection info", nil)
	}
	if len(editInfo.Name) == 0 {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "node name is required", nil)
	}
	if len(editInfo.Name) > 255 {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "node name must be less than 255 characters", nil)
	}
	if len(editInfo.Address) == 0 {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "node address is required", nil)
	}

	// 检查名称是否已被其他节点使用
	existNode := model.Node{}
	dbCheck := core.Db.Where("name = ? AND id != ?", editInfo.Name, nodeId).First(&existNode)
	if dbCheck.Error == nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "node name already exists", nil)
	}

	nodeModel.Name = editInfo.Name
	nodeModel.Region = editInfo.Region
	nodeModel.Address = editInfo.Address
	nodeModel.Remark = editInfo.Remark
	dbRt = core.Db.Save(nodeModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.DB_ERROR, "update node fail", nil)
	}

	model.OperationLog{}.AddOperationLog(
		getCurrentUserId(context),
		nodeModel.ID,
		"EditNode",
		fmt.Sprintf("Node:%s\nClient Ip:%s", nodeModel.Name, context.ClientIP()))
	return response.Resp().Success("update success", nodeModel)
}

// DeleteNode 删除边缘节点
func DeleteNode(context *context.Context) *response.Response {
	nodeId := context.Param("node_id")
	nodeModel := model.Node{}
	dbRt := core.Db.Where("id = ?", nodeId).First(&nodeModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "node not found", nil)
	}
	if nodeModel.IsMaster {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "cannot delete master node", nil)
	}
	// 检查是否有任务关联到此节点
	var taskCount int64
	core.Db.Model(&model.Task{}).Where("node_id = ? AND delete_time IS NULL", nodeId).Count(&taskCount)
	if taskCount > 0 {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "node has associated tasks, please reassign them first", nil)
	}

	if dbRt = core.Db.Delete(&nodeModel); dbRt.Error != nil {
		return response.Resp().Error(errorCode.DB_ERROR, "delete node fail", nil)
	}

	model.OperationLog{}.AddOperationLog(
		getCurrentUserId(context),
		nodeModel.ID,
		"DeleteNode",
		fmt.Sprintf("Node:%s\nClient Ip:%s", nodeModel.Name, context.ClientIP()))
	return response.Resp().Success("delete success", nodeModel)
}

// RegenerateNodeKey 重新生成节点密钥
func RegenerateNodeKey(context *context.Context) *response.Response {
	nodeId := context.Param("node_id")
	nodeModel := &model.Node{}
	dbRt := core.Db.Where("id = ?", nodeId).First(nodeModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.NOT_FOUND, "node not found", nil)
	}
	if nodeModel.IsMaster {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "cannot regenerate master node key", nil)
	}
	nodeModel.SecretKey = utils.CreateRandomString(32)
	dbRt = core.Db.Save(nodeModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.DB_ERROR, "update node key fail", nil)
	}
	return response.Resp().Success("regenerate success", nodeModel)
}

// GetNodeSelectList 获取节点选择列表（用于任务表单下拉）
func GetNodeSelectList(context *context.Context) *response.Response {
	type nodeSelect struct {
		ID       int64  `json:"id"`
		Name     string `json:"name"`
		Region   string `json:"region"`
		IsMaster bool   `json:"is_master"`
		Status   int8   `json:"status"`
	}
	var nodeList []nodeSelect
	core.Db.Table("node").Where("delete_time IS NULL").Order("is_master DESC, id ASC").Scan(&nodeList)
	return response.Resp().Success("success", nodeList)
}

// GetNodeTaskCount 获取每个节点关联的任务数量
func GetNodeTaskCount(context *context.Context) *response.Response {
	nodeIdStr := context.Param("node_id")
	nodeId, err := strconv.ParseInt(nodeIdStr, 10, 64)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "invalid node id", nil)
	}
	var taskCount int64
	core.Db.Model(&model.Task{}).Where("node_id = ? AND delete_time IS NULL", nodeId).Count(&taskCount)
	return response.Resp().Success("success", map[string]int64{"count": taskCount})
}
