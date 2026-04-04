# Gonitor 部署文档

> Gonitor - 分布式任务调度与系统监控平台

## 目录

- [项目概述](#项目概述)
- [系统架构](#系统架构)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [主控端部署](#主控端部署)
- [边缘节点部署](#边缘节点部署)
- [一键自动部署边缘节点](#一键自动部署边缘节点)
- [配置说明](#配置说明)
- [API 接口文档](#api-接口文档)
- [代码结构](#代码结构)
- [安全说明](#安全说明)
- [常见问题](#常见问题)

---

## 项目概述

Gonitor 是一个基于 Go + React 构建的分布式任务调度与系统监控平台，支持：

- **任务调度**：基于 Cron 的定时任务管理，支持 Shell 命令、HTTP 请求、脚本文件执行
- **分布式执行**：主节点 + 多边缘节点架构，任务可分配到不同节点执行
- **实时监控**：通过 WebSocket 实时推送任务状态、系统指标（CPU、内存、磁盘、网络）
- **断言与处理器**：JavaScript 编写的断言脚本和结果处理器
- **重试机制**：可配置的任务重试次数和间隔
- **用户管理**：基于 Token 的认证机制，支持多用户
- **操作审计**：完整的操作日志记录
- **SSH 自动部署**：在主控端 UI 中输入边缘节点 SSH 信息，自动完成部署
- **企业微信通知**：支持企业微信消息推送

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    主控端 (Master)                        │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────┐  │
│  │ React UI │──│ Gin API   │──│ SQLite + GORM        │  │
│  │ (前端)    │  │ (REST API)│  │ (数据存储)            │  │
│  └──────────┘  └───────────┘  └──────────────────────┘  │
│       │              │                                    │
│  ┌────┴─────┐  ┌─────┴──────┐                            │
│  │WebSocket │  │ Cron 调度器 │                            │
│  │(实时推送) │  │ (任务执行)  │                            │
│  └──────────┘  └────────────┘                            │
└─────────────────────┬───────────────────────────────────┘
                      │ REST API (X-Node-Secret 认证)
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌──────────────┐┌──────────────┐┌──────────────┐
│  边缘节点 1   ││  边缘节点 2   ││  边缘节点 N   │
│  (香港)       ││  (新加坡)     ││  (东京)       │
│              ││              ││              │
│ - 心跳上报    ││ - 心跳上报    ││ - 心跳上报    │
│ - 任务拉取    ││ - 任务拉取    ││ - 任务拉取    │
│ - 结果上报    ││ - 结果上报    ││ - 结果上报    │
│ - 系统信息    ││ - 系统信息    ││ - 系统信息    │
└──────────────┘└──────────────┘└──────────────┘
```

## 环境要求

### 主控端
| 项目 | 要求 |
|------|------|
| 操作系统 | Linux / macOS / Windows |
| Go | >= 1.17 |
| Node.js | >= 14 (仅构建前端需要) |
| SQLite3 | 系统自带或通过 CGO 编译 |
| 端口 | 默认 8899 (可配置) |

### 边缘节点
| 项目 | 要求 |
|------|------|
| 操作系统 | Linux (推荐) / macOS |
| 网络 | 能够访问主控端 API |

## 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/ponull/gonitor.git
cd gonitor
```

### 2. 构建后端
```bash
# 安装 Go 依赖
go mod download

# 编译
go build -o gonitor .
```

### 3. 构建前端
```bash
cd web/client
npm install
npx react-scripts build
cd ../..
```

### 4. 配置
```bash
# 编辑配置文件
cp config.yml config.yml.bak
vim config.yml
```

### 5. 启动
```bash
# 前台运行
./gonitor start

# 后台运行 (守护进程模式)
./gonitor start -d
```

### 6. 访问
打开浏览器访问 `http://your-server-ip:8899`

**默认账号：**
- 用户名: `admin`
- 密码: `123456`

> ⚠️ **重要**: 首次登录后请立即修改默认密码！

---

## 主控端部署

### 方式一：直接编译部署

```bash
# 1. 准备环境
sudo apt update
sudo apt install -y gcc git

# 安装 Go (如尚未安装)
wget https://go.dev/dl/go1.17.13.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.17.13.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin

# 安装 Node.js (如尚未安装)
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# 2. 克隆并构建
git clone https://github.com/ponull/gonitor.git
cd gonitor

# 构建后端
go mod download
CGO_ENABLED=1 go build -o gonitor .

# 构建前端
cd web/client
npm install
npx react-scripts build
cd ../..

# 3. 配置
vim config.yml

# 4. 启动
./gonitor start -d
```

### 方式二：Systemd 服务部署（推荐）

```bash
# 1. 将编译好的文件部署到目标目录
sudo mkdir -p /opt/gonitor
sudo cp gonitor /opt/gonitor/
sudo cp config.yml /opt/gonitor/
sudo mkdir -p /opt/gonitor/tmp/log
sudo mkdir -p /opt/gonitor/script

# 2. 创建 systemd 服务文件
sudo cat > /etc/systemd/system/gonitor.service << 'EOF'
[Unit]
Description=Gonitor - Task Scheduler & Monitor
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/gonitor
ExecStart=/opt/gonitor/gonitor start
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 3. 启动服务
sudo systemctl daemon-reload
sudo systemctl enable gonitor
sudo systemctl start gonitor

# 4. 查看状态
sudo systemctl status gonitor
sudo journalctl -u gonitor -f
```

### 配置文件 (config.yml)

```yaml
App:
  Debug: false          # 调试模式 (true 输出到控制台, false 输出到日志文件)
  DbLog: false          # 数据库查询日志
  LogFile: tmp/run.log  # 日志文件路径

Script:
  Folder: script        # 脚本文件目录
  LogFolder: tmp/log    # 任务执行日志目录

Sqlite:
  DbPath: gonitor.db    # SQLite 数据库文件路径

HttpServer:
  Host: 0.0.0.0         # 监听地址 (0.0.0.0 = 所有网卡)
  Post: 8899            # 监听端口

WeCom:                   # 企业微信通知 (可选)
  CorpId: ""
  CorpSecret: ""
  AgentId: ""
```

> **注意**: 生产环境请将 `Host` 设为 `0.0.0.0` 以便边缘节点访问。

---

## 边缘节点部署

### 手动部署

#### 1. 在主控端添加节点

在主控端 Web UI 中：
1. 进入 **节点管理** 页面
2. 点击 **添加节点**
3. 填写节点名称、区域、地址
4. 记录生成的 **通信密钥 (Secret Key)**

#### 2. 在边缘节点服务器上部署

```bash
# 1. 将编译好的 gonitor 二进制文件上传到边缘节点
scp gonitor user@edge-node:/opt/gonitor/

# 2. 创建配置文件
ssh user@edge-node
mkdir -p /opt/gonitor/tmp/log /opt/gonitor/script

cat > /opt/gonitor/config.yml << EOF
App:
  Debug: false
  DbLog: false
  LogFile: /opt/gonitor/tmp/run.log

Script:
  Folder: /opt/gonitor/script
  LogFolder: /opt/gonitor/tmp/log

Sqlite:
  DbPath: /opt/gonitor/gonitor.db

HttpServer:
  Host: 0.0.0.0
  Post: 8899

Agent:
  MasterAddress: http://MASTER_IP:8899
  SecretKey: YOUR_SECRET_KEY
  NodeName: YOUR_NODE_NAME
EOF

# 3. 启动
cd /opt/gonitor
./gonitor start -d
```

#### 3. 配置为系统服务

```bash
sudo cat > /etc/systemd/system/gonitor-agent.service << 'EOF'
[Unit]
Description=Gonitor Agent - Edge Node
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/gonitor
ExecStart=/opt/gonitor/gonitor start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable gonitor-agent
sudo systemctl start gonitor-agent
```

### 边缘节点通信机制

边缘节点通过以下 API 与主控端通信：

| API | 方法 | 说明 |
|-----|------|------|
| `/agent/heartbeat` | POST | 心跳上报，携带系统信息（IP、OS、架构、CPU、内存等） |
| `/agent/tasks` | GET | 拉取分配给自己的任务列表 |
| `/agent/report` | POST | 上报任务执行结果 |

所有 Agent API 通过 `X-Node-Secret` HTTP Header 进行认证。

---

## 一键自动部署边缘节点

### 通过 Web UI 部署

Gonitor 支持在主控端 Web UI 中通过 SSH 自动部署边缘节点：

#### 方式一：部署到已注册的节点

1. 进入 **节点管理** 页面
2. 在目标节点的操作列中点击 **SSH部署** 按钮 (云上传图标)
3. 填写 SSH 连接信息：
   - **SSH 主机地址**: 边缘节点的 IP 或域名
   - **SSH 端口**: 默认 22
   - **SSH 用户名**: 默认 root
   - **SSH 密码**: 远程服务器的密码
   - **安装路径**: 默认 `/opt/gonitor`
4. 可以先点击 **测试连接** 验证 SSH 连通性并查看远程系统信息
5. 点击 **开始部署**

#### 方式二：一键创建并部署新节点

1. 进入 **节点管理** 页面
2. 点击 **一键部署新节点** 按钮
3. 填写节点信息（名称、区域、备注）
4. 填写 SSH 连接信息
5. 点击 **测试连接** 验证
6. 点击 **创建并部署**

系统将自动完成：
- ✅ SSH 连接到远程服务器
- ✅ 收集远程系统信息（OS、架构、CPU、内存）
- ✅ 创建安装目录
- ✅ 生成配置文件（含主控端地址和通信密钥）
- ✅ 创建 systemd 服务文件
- ✅ 注册节点信息到数据库

### 通过 API 部署

```bash
# 测试 SSH 连接
curl -X POST http://localhost:8899/node/deploy/test \
  -H "Content-Type: application/json" \
  -H "Token: YOUR_AUTH_TOKEN" \
  -d '{
    "ssh_host": "192.168.1.100",
    "ssh_port": 22,
    "ssh_user": "root",
    "ssh_password": "your_password"
  }'

# 部署到已有节点
curl -X POST http://localhost:8899/node/deploy \
  -H "Content-Type: application/json" \
  -H "Token: YOUR_AUTH_TOKEN" \
  -d '{
    "node_id": 2,
    "ssh_host": "192.168.1.100",
    "ssh_port": 22,
    "ssh_user": "root",
    "ssh_password": "your_password",
    "install_path": "/opt/gonitor"
  }'

# 一键创建并部署新节点
curl -X POST http://localhost:8899/node/deploy/new \
  -H "Content-Type: application/json" \
  -H "Token: YOUR_AUTH_TOKEN" \
  -d '{
    "name": "香港节点",
    "region": "香港",
    "remark": "生产环境",
    "ssh_host": "192.168.1.100",
    "ssh_port": 22,
    "ssh_user": "root",
    "ssh_password": "your_password",
    "install_path": "/opt/gonitor"
  }'
```

> **注意**: 自动部署会生成配置文件和 systemd 服务，但仍需手动上传 gonitor 二进制文件到边缘节点。部署完成后，将编译好的二进制文件上传到安装路径，然后启动服务：
> ```bash
> sudo systemctl start gonitor-agent
> ```

---

## 配置说明

### 主控端配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `App.Debug` | `false` | 调试模式，开启后日志输出到控制台 |
| `App.DbLog` | `false` | 开启 GORM SQL 日志 |
| `App.LogFile` | `tmp/run.log` | 日志文件路径 |
| `Sqlite.DbPath` | `gonitor.db` | SQLite 数据库文件路径 |
| `HttpServer.Host` | `127.0.0.1` | 监听地址 |
| `HttpServer.Post` | `8899` | 监听端口 |
| `Script.Folder` | `script` | 脚本文件目录 |
| `Script.LogFolder` | `tmp/log` | 任务执行日志目录 |
| `WeCom.CorpId` | - | 企业微信企业 ID |
| `WeCom.CorpSecret` | - | 企业微信应用密钥 |
| `WeCom.AgentId` | - | 企业微信应用 ID |

### 用户管理

- **默认管理员**: admin / 123456
- **密码存储**: bcrypt 加密（兼容 MD5 旧密码）
- **认证方式**: 基于 Token 的无状态认证
- **Token**: 登录后生成 32 位随机字符串 Token

### 边缘节点管理

每个边缘节点包含以下信息：

| 字段 | 说明 |
|------|------|
| 名称 | 节点唯一标识名 |
| 区域 | 节点地理位置（如：香港、新加坡） |
| 地址 | 节点 HTTP 通信地址 |
| 通信密钥 | 32 位随机字符串，用于 Agent 认证 |
| 状态 | 在线 / 离线 |
| IP | 节点 IP 地址（心跳自动上报） |
| OS | 操作系统（心跳自动上报） |
| 架构 | 系统架构如 x86_64, aarch64（心跳自动上报） |
| CPU 核心数 | CPU 核心数量（心跳自动上报） |
| 总内存 | 内存大小（心跳自动上报） |
| Go 版本 | 节点上的 Go 版本（心跳自动上报） |
| Agent 版本 | 节点上的 Agent 版本（心跳自动上报） |
| 最后心跳 | 最后一次心跳时间 |

---

## API 接口文档

### 认证

所有受保护的 API 需要在 HTTP Header 中携带 Token：
```
Token: your_auth_token
```

### 用户 API

| 路径 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/user/login` | POST | 用户登录 | 否 |
| `/user/selfInfo` | GET | 获取当前用户信息 | 是 |
| `/user/:user_id` | GET | 获取指定用户信息 | 是 |
| `/user/list/:page/:size` | GET | 获取用户列表 | 是 |
| `/user` | POST | 添加用户 | 是 |
| `/user/:user_id` | PUT | 编辑用户 | 是 |
| `/user/:user_id` | DELETE | 删除用户 | 是 |

### 节点 API

| 路径 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/node/list` | GET | 获取节点列表（含系统信息） | 是 |
| `/node/info/:node_id` | GET | 获取节点详情 | 是 |
| `/node` | POST | 添加节点 | 是 |
| `/node/:node_id` | PUT | 编辑节点 | 是 |
| `/node/:node_id` | DELETE | 删除节点 | 是 |
| `/node/regenerate/:node_id` | GET | 重新生成密钥 | 是 |
| `/node/select` | GET | 节点选择列表 | 是 |
| `/node/taskCount/:node_id` | GET | 节点任务数量 | 是 |
| `/node/deploy` | POST | SSH 部署到已有节点 | 是 |
| `/node/deploy/new` | POST | 一键创建并部署新节点 | 是 |
| `/node/deploy/test` | POST | 测试 SSH 连接 | 是 |

### 任务 API

| 路径 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/task/list` | GET | 获取任务列表 | 是 |
| `/task/info/:task_id` | GET | 获取任务详情 | 是 |
| `/task` | POST | 添加任务 | 是 |
| `/task/:task_id` | PUT | 编辑任务 | 是 |
| `/task/:task_id` | DELETE | 删除任务 | 是 |
| `/task/start/:task_id` | GET | 启动任务 | 是 |
| `/task/stop/:task_id` | GET | 停止任务 | 是 |
| `/task/test/:task_id` | GET | 执行一次（测试） | 是 |
| `/task/log/list/:task_id/:page/:size` | GET | 任务日志列表 | 是 |
| `/task/log/list/running/:task_id` | GET | 正在执行的任务 | 是 |
| `/task/log/output/:log_id` | GET | 任务执行输出 | 是 |

### Agent API（边缘节点）

| 路径 | 方法 | 说明 | 认证方式 |
|------|------|------|----------|
| `/agent/heartbeat` | POST | 心跳上报 | X-Node-Secret |
| `/agent/tasks` | GET | 拉取任务 | X-Node-Secret |
| `/agent/report` | POST | 上报结果 | X-Node-Secret |

### 系统监控 API

| 路径 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/system/overview` | GET | 系统概览 | 是 |
| `/system/cpu` | GET | CPU 信息 | 是 |
| `/system/memory` | GET | 内存信息 | 是 |
| `/system/disk` | GET | 磁盘信息 | 是 |
| `/system/net` | GET | 网络信息 | 是 |

---

## 代码结构

```
gonitor/
├── main.go                     # 程序入口
├── config.yml                  # 配置文件
├── go.mod                      # Go 模块定义
├── bootstrap/
│   └── bootstrap.go            # 初始化：配置加载、数据库、默认数据
├── cmd/
│   ├── root.go                 # CLI 基础命令
│   └── start.go                # start 命令：启动服务
├── core/
│   ├── config.go               # 配置结构定义
│   └── variable.go             # 全局变量
├── model/                      # 数据模型层
│   ├── base.go                 # 基础模型（分页、ID、时间戳）
│   ├── node.go                 # 节点模型（含系统信息字段）
│   ├── task.go                 # 任务模型
│   ├── task_log.go             # 任务日志模型
│   ├── user.go                 # 用户模型
│   ├── user_token.go           # 用户 Token 模型
│   └── operation_log.go        # 操作日志模型
├── service/                    # 业务服务层
│   ├── monitor/                # 系统监控
│   │   ├── system.go           # 系统信息
│   │   ├── cpu.go              # CPU 监控
│   │   ├── memory.go           # 内存监控
│   │   ├── disk.go             # 磁盘监控
│   │   ├── net.go              # 网络监控
│   │   └── user.go             # 在线用户
│   └── wecom/                  # 企业微信
│       ├── wecom.go            # 企业微信接口
│       └── post.go             # 消息发送
├── task/                       # 任务调度引擎
│   ├── task.go                 # 任务管理器
│   ├── taskIns.go              # 任务实例
│   ├── taskRunning.go          # 运行中的任务
│   ├── handler.go              # 执行处理器
│   ├── tools.go                # 工具函数
│   └── push.go                 # 实时推送
├── utils/
│   └── common.go               # 通用工具函数
├── web/                        # Web 层
│   ├── web.go                  # 服务初始化
│   ├── html.go                 # 前端文件嵌入
│   ├── controller/             # 控制器
│   │   ├── user.go             # 用户管理
│   │   ├── node.go             # 节点管理
│   │   ├── deploy.go           # SSH 部署
│   │   ├── task.go             # 任务管理
│   │   ├── agent.go            # 边缘节点通信
│   │   ├── monitor.go          # 系统监控
│   │   ├── index.go            # 操作日志
│   │   └── push.go             # 通知推送
│   ├── routes/                 # 路由定义
│   │   ├── router.go           # 路由框架
│   │   └── routes.go           # 路由配置
│   ├── middleware/              # 中间件
│   │   └── middleware.go       # CORS、Token 验证
│   ├── ws/                     # WebSocket
│   │   ├── ws.go               # 连接管理
│   │   └── client.go           # 客户端管理
│   ├── response/               # 响应格式
│   │   ├── response.go         # 统一响应
│   │   └── errorCode/          # 错误码
│   └── client/                 # React 前端
│       ├── src/
│       │   ├── App.js          # 路由配置
│       │   └── screen/         # 页面组件
│       │       ├── login/      # 登录页
│       │       ├── layout/     # 布局组件
│       │       ├── dashboard/  # 仪表盘
│       │       ├── taskList/   # 任务管理
│       │       ├── taskInfo/   # 任务详情
│       │       ├── nodeList/   # 节点管理（含SSH部署）
│       │       ├── userList/   # 用户管理
│       │       └── operationList/ # 操作日志
│       └── package.json        # 前端依赖
```

---

## 安全说明

### 认证机制
- **Web UI 认证**: 基于 Token 的认证，登录后生成 32 位随机 Token
- **边缘节点认证**: 基于 `X-Node-Secret` Header 的密钥认证
- **密码存储**: bcrypt 哈希（兼容 MD5 旧密码自动迁移）

### 安全建议
1. **修改默认密码**: 首次登录后立即修改 admin 默认密码
2. **网络隔离**: 建议主控端与边缘节点之间使用内网或 VPN 通信
3. **HTTPS**: 生产环境建议配置 Nginx 反向代理并启用 HTTPS
4. **SSH 密钥**: SSH 部署时使用的密码不会存储在数据库中，仅用于一次性连接
5. **防火墙**: 仅开放必要端口（默认 8899）

### Nginx 反向代理配置示例

```nginx
server {
    listen 443 ssl;
    server_name gonitor.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:8899;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8899;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 常见问题

### Q: 编译时提示 CGO 错误？
A: Gonitor 使用 SQLite，需要 CGO 支持。确保安装了 gcc：
```bash
sudo apt install -y gcc
CGO_ENABLED=1 go build -o gonitor .
```

### Q: 边缘节点显示"离线"？
A: 检查以下项目：
1. 边缘节点是否已启动
2. 边缘节点的 `X-Node-Secret` 是否正确
3. 网络是否连通（边缘节点需要能访问主控端 API）
4. 防火墙是否阻止了通信

### Q: SSH 部署失败？
A: 检查以下项目：
1. SSH 连接信息是否正确（先使用"测试连接"验证）
2. SSH 用户是否有目标目录的写权限
3. 如需安装 systemd 服务，用户需要 sudo 权限

### Q: 如何跨平台编译？
```bash
# Linux AMD64
GOOS=linux GOARCH=amd64 CGO_ENABLED=1 go build -o gonitor-linux-amd64 .

# Linux ARM64
GOOS=linux GOARCH=arm64 CGO_ENABLED=1 CC=aarch64-linux-gnu-gcc go build -o gonitor-linux-arm64 .
```

### Q: 如何备份数据？
```bash
# 备份 SQLite 数据库
cp gonitor.db gonitor.db.bak

# 备份配置
cp config.yml config.yml.bak
```

### Q: 如何查看日志？
```bash
# 查看应用日志
tail -f tmp/run.log

# 如果使用 systemd
journalctl -u gonitor -f

# 查看任务执行日志
ls tmp/log/
```
