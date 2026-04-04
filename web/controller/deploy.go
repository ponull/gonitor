package controller

import (
	"fmt"
	"gonitor/core"
	"gonitor/model"
	"gonitor/utils"
	"gonitor/web/context"
	"gonitor/web/response"
	"gonitor/web/response/errorCode"
	"golang.org/x/crypto/ssh"
	"log"
	"net"
	"strings"
	"time"
)

// DeployNode 通过SSH自动部署边缘节点
func DeployNode(ctx *context.Context) *response.Response {
	type deployForm struct {
		NodeID   int64  `json:"node_id"`
		SSHHost  string `json:"ssh_host"`
		SSHPort  int    `json:"ssh_port"`
		SSHUser  string `json:"ssh_user"`
		SSHPass  string `json:"ssh_password"`
		InstallPath string `json:"install_path"`
	}
	form := deployForm{}
	err := ctx.ShouldBindJSON(&form)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "parse fail:"+err.Error(), nil)
	}

	if form.SSHHost == "" {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "SSH host is required", nil)
	}
	if form.SSHUser == "" {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "SSH user is required", nil)
	}
	if form.SSHPass == "" {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "SSH password is required", nil)
	}
	if form.SSHPort <= 0 {
		form.SSHPort = 22
	}
	if form.InstallPath == "" {
		form.InstallPath = "/opt/gonitor"
	}

	// 查找节点
	nodeModel := &model.Node{}
	if form.NodeID > 0 {
		dbRt := core.Db.Where("id = ?", form.NodeID).First(nodeModel)
		if dbRt.Error != nil {
			return response.Resp().Error(errorCode.NOT_FOUND, "node not found", nil)
		}
		if nodeModel.IsMaster {
			return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "cannot deploy to master node", nil)
		}
	} else {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "node_id is required", nil)
	}

	// 构建SSH配置
	sshConfig := &ssh.ClientConfig{
		User: form.SSHUser,
		Auth: []ssh.AuthMethod{
			ssh.Password(form.SSHPass),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         15 * time.Second,
	}

	// 连接SSH
	addr := fmt.Sprintf("%s:%d", form.SSHHost, form.SSHPort)
	client, err := ssh.Dial("tcp", addr, sshConfig)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "SSH connection failed: "+err.Error(), nil)
	}
	defer client.Close()

	// 收集远程节点系统信息
	sysInfo := collectRemoteSystemInfo(client)

	// 执行部署命令
	deployLog, deployErr := executeDeployCommands(client, form.InstallPath, nodeModel)

	// 更新节点信息
	nodeModel.IP = form.SSHHost
	if sysInfo["os"] != "" {
		nodeModel.OS = sysInfo["os"]
	}
	if sysInfo["arch"] != "" {
		nodeModel.Arch = sysInfo["arch"]
	}
	if nodeModel.Address == "" {
		nodeModel.Address = fmt.Sprintf("http://%s:%s", form.SSHHost, core.Config.HttpServer.Post)
	}
	core.Db.Save(nodeModel)

	// 记录操作日志
	model.OperationLog{}.AddOperationLog(
		getCurrentUserId(ctx),
		nodeModel.ID,
		"DeployNode",
		fmt.Sprintf("Node:%s\nSSH:%s@%s:%d\nPath:%s\nClient Ip:%s",
			nodeModel.Name, form.SSHUser, form.SSHHost, form.SSHPort, form.InstallPath, ctx.ClientIP()))

	result := map[string]interface{}{
		"node_id":   nodeModel.ID,
		"node_name": nodeModel.Name,
		"ssh_host":  form.SSHHost,
		"sys_info":  sysInfo,
		"deploy_log": deployLog,
	}

	if deployErr != nil {
		result["status"] = "partial"
		result["error"] = deployErr.Error()
		return response.Resp().Success("deploy completed with warnings", result)
	}

	result["status"] = "success"
	return response.Resp().Success("deploy success", result)
}

// TestSSHConnection 测试SSH连接
func TestSSHConnection(ctx *context.Context) *response.Response {
	type testForm struct {
		SSHHost string `json:"ssh_host"`
		SSHPort int    `json:"ssh_port"`
		SSHUser string `json:"ssh_user"`
		SSHPass string `json:"ssh_password"`
	}
	form := testForm{}
	err := ctx.ShouldBindJSON(&form)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "parse fail:"+err.Error(), nil)
	}
	if form.SSHHost == "" || form.SSHUser == "" || form.SSHPass == "" {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "SSH host, user and password are required", nil)
	}
	if form.SSHPort <= 0 {
		form.SSHPort = 22
	}

	sshConfig := &ssh.ClientConfig{
		User: form.SSHUser,
		Auth: []ssh.AuthMethod{
			ssh.Password(form.SSHPass),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         10 * time.Second,
	}

	addr := fmt.Sprintf("%s:%d", form.SSHHost, form.SSHPort)
	client, err := ssh.Dial("tcp", addr, sshConfig)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "SSH connection failed: "+err.Error(), nil)
	}
	defer client.Close()

	// 收集系统信息
	sysInfo := collectRemoteSystemInfo(client)

	return response.Resp().Success("SSH connection successful", map[string]interface{}{
		"connected": true,
		"sys_info":  sysInfo,
	})
}

// collectRemoteSystemInfo 通过SSH收集远程系统信息
func collectRemoteSystemInfo(client *ssh.Client) map[string]string {
	info := map[string]string{}

	commands := map[string]string{
		"os":          "uname -s 2>/dev/null || echo unknown",
		"arch":        "uname -m 2>/dev/null || echo unknown",
		"hostname":    "hostname 2>/dev/null || echo unknown",
		"kernel":      "uname -r 2>/dev/null || echo unknown",
		"cpu_cores":   "nproc 2>/dev/null || echo 0",
		"memory_total": "free -b 2>/dev/null | awk '/Mem:/{print $2}' || echo 0",
		"ip":          "hostname -I 2>/dev/null | awk '{print $1}' || echo unknown",
		"go_version":  "go version 2>/dev/null | awk '{print $3}' || echo not_installed",
		"platform":    "cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d '\"' || echo unknown",
	}

	for key, cmd := range commands {
		output, err := runSSHCommand(client, cmd)
		if err != nil {
			info[key] = ""
			continue
		}
		info[key] = strings.TrimSpace(output)
	}

	return info
}

// executeDeployCommands 执行部署命令
func executeDeployCommands(client *ssh.Client, installPath string, node *model.Node) (string, error) {
	var logBuilder strings.Builder
	masterAddr := fmt.Sprintf("http://%s:%s", core.Config.HttpServer.Host, core.Config.HttpServer.Post)

	commands := []struct {
		desc string
		cmd  string
	}{
		{"Creating install directory", fmt.Sprintf("mkdir -p %s", installPath)},
		{"Creating config directory", fmt.Sprintf("mkdir -p %s/tmp/log", installPath)},
		{"Generating agent config", fmt.Sprintf(`cat > %s/config.yml << 'GONITOR_EOF'
App:
  Debug: false
  DbLog: false
  LogFile: %s/tmp/run.log

Script:
  Folder: %s/script
  LogFolder: %s/tmp/log

Sqlite:
  DbPath: %s/gonitor.db

HttpServer:
  Host: 0.0.0.0
  Post: %s

Agent:
  MasterAddress: %s
  SecretKey: %s
  NodeName: %s
GONITOR_EOF`, installPath, installPath, installPath, installPath, installPath,
			core.Config.HttpServer.Post, masterAddr, node.SecretKey, node.Name)},
		{"Generating systemd service", fmt.Sprintf(`cat > /tmp/gonitor-agent.service << 'GONITOR_EOF'
[Unit]
Description=Gonitor Agent - Edge Node
After=network.target

[Service]
Type=simple
WorkingDirectory=%s
ExecStart=%s/gonitor start
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
GONITOR_EOF`, installPath, installPath)},
		{"Installing systemd service", "sudo cp /tmp/gonitor-agent.service /etc/systemd/system/gonitor-agent.service 2>/dev/null || true"},
		{"Reloading systemd", "sudo systemctl daemon-reload 2>/dev/null || true"},
		{"Checking installation", fmt.Sprintf("ls -la %s/", installPath)},
	}

	for _, step := range commands {
		logBuilder.WriteString(fmt.Sprintf("[%s] %s\n", time.Now().Format("15:04:05"), step.desc))
		output, err := runSSHCommand(client, step.cmd)
		if err != nil {
			errMsg := fmt.Sprintf("  WARNING: %s\n", err.Error())
			logBuilder.WriteString(errMsg)
			log.Printf("Deploy step '%s' warning: %s", step.desc, err.Error())
			continue
		}
		if output != "" {
			logBuilder.WriteString(fmt.Sprintf("  %s\n", strings.TrimSpace(output)))
		}
		logBuilder.WriteString("  OK\n")
	}

	return logBuilder.String(), nil
}

// runSSHCommand 执行单个SSH命令
func runSSHCommand(client *ssh.Client, command string) (string, error) {
	session, err := client.NewSession()
	if err != nil {
		return "", fmt.Errorf("failed to create session: %v", err)
	}
	defer session.Close()

	output, err := session.CombinedOutput(command)
	if err != nil {
		return string(output), fmt.Errorf("command failed: %v, output: %s", err, string(output))
	}
	return string(output), nil
}

// DeployNewNode 一键创建并部署新边缘节点
func DeployNewNode(ctx *context.Context) *response.Response {
	type deployNewForm struct {
		Name        string `json:"name"`
		Region      string `json:"region"`
		Remark      string `json:"remark"`
		SSHHost     string `json:"ssh_host"`
		SSHPort     int    `json:"ssh_port"`
		SSHUser     string `json:"ssh_user"`
		SSHPass     string `json:"ssh_password"`
		InstallPath string `json:"install_path"`
	}
	form := deployNewForm{}
	err := ctx.ShouldBindJSON(&form)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "parse fail:"+err.Error(), nil)
	}

	if form.Name == "" {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "node name is required", nil)
	}
	if form.SSHHost == "" || form.SSHUser == "" || form.SSHPass == "" {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "SSH credentials are required", nil)
	}
	if form.SSHPort <= 0 {
		form.SSHPort = 22
	}
	if form.InstallPath == "" {
		form.InstallPath = "/opt/gonitor"
	}

	// 检查名称是否已存在
	existNode := model.Node{}
	dbCheck := core.Db.Where("name = ?", form.Name).First(&existNode)
	if dbCheck.Error == nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "node name already exists", nil)
	}

	// 先测试SSH连接
	sshConfig := &ssh.ClientConfig{
		User: form.SSHUser,
		Auth: []ssh.AuthMethod{
			ssh.Password(form.SSHPass),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         15 * time.Second,
	}

	addr := fmt.Sprintf("%s:%d", form.SSHHost, form.SSHPort)
	client, err := ssh.Dial("tcp", addr, sshConfig)
	if err != nil {
		return response.Resp().Error(errorCode.PARSE_PARAMS_ERROR, "SSH connection failed: "+err.Error(), nil)
	}
	defer client.Close()

	// 收集系统信息
	sysInfo := collectRemoteSystemInfo(client)

	// 创建节点
	secretKey := utils.CreateRandomString(32)
	nodeAddress := fmt.Sprintf("http://%s:%s", form.SSHHost, core.Config.HttpServer.Post)
	nodeModel := &model.Node{
		Name:      form.Name,
		Region:    form.Region,
		Address:   nodeAddress,
		SecretKey: secretKey,
		Status:    0,
		IsMaster:  false,
		Remark:    form.Remark,
		IP:        form.SSHHost,
		OS:        sysInfo["os"],
		Arch:      sysInfo["arch"],
	}
	dbRt := core.Db.Create(nodeModel)
	if dbRt.Error != nil {
		return response.Resp().Error(errorCode.DB_ERROR, "create node fail", nil)
	}

	// 执行部署
	deployLog, deployErr := executeDeployCommands(client, form.InstallPath, nodeModel)

	model.OperationLog{}.AddOperationLog(
		getCurrentUserId(ctx),
		nodeModel.ID,
		"DeployNewNode",
		fmt.Sprintf("Node:%s\nSSH:%s@%s:%d\nPath:%s\nClient Ip:%s",
			nodeModel.Name, form.SSHUser, form.SSHHost, form.SSHPort, form.InstallPath, ctx.ClientIP()))

	result := map[string]interface{}{
		"node_id":    nodeModel.ID,
		"node_name":  nodeModel.Name,
		"secret_key": nodeModel.SecretKey,
		"address":    nodeModel.Address,
		"sys_info":   sysInfo,
		"deploy_log": deployLog,
	}

	if deployErr != nil {
		result["status"] = "partial"
		result["error"] = deployErr.Error()
		return response.Resp().Success("node created, deploy completed with warnings", result)
	}

	result["status"] = "success"
	return response.Resp().Success("node created and deployed successfully", result)
}

// validateSSHHost checks that the host is not empty and resolves to an IP address.
func validateSSHHost(host string) error {
	if host == "" {
		return fmt.Errorf("host is empty")
	}
	_, err := net.ResolveIPAddr("ip", host)
	return err
}
