# Gonitor

> 分布式任务调度与系统监控平台

Gonitor 是一个基于 **Go (Gin)** + **React (MUI)** 构建的分布式任务调度与系统监控平台，支持主节点与多边缘节点架构。通过简洁的 Web 界面，您可以管理定时任务、实时监控节点状态、一键部署边缘节点。

---

## 目录

- [功能特性](#-功能特性)
- [系统架构](#-系统架构)
- [技术栈](#-技术栈)
- [快速开始](#-快速开始)
- [配置说明](#-配置说明)
- [任务类型与示例](#-任务类型与示例)
- [JavaScript 断言与结果处理器](#-javascript-断言与结果处理器)
- [分布式节点](#-分布式节点)
- [SSH 自动部署边缘节点](#-ssh-自动部署边缘节点)
- [API 接口文档](#-api-接口文档)
- [项目目录结构](#-项目目录结构)
- [安全说明](#-安全说明)
- [常见问题](#-常见问题)
- [License](#-license)

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🕐 **定时任务调度** | 基于 Cron 表达式，支持 Shell 命令、HTTP 请求、脚本文件三种执行方式 |
| 🌐 **分布式节点** | 主节点 + 多边缘节点，任务按节点分配，边缘节点主动拉取并上报结果 |
| 📊 **实时系统监控** | WebSocket 实时推送 CPU、内存、磁盘、网络使用情况 |
| 🔄 **自动重试** | 可配置重试次数与间隔，失败自动重试 |
| ✅ **JavaScript 断言** | 用 JS 编写输出断言脚本，对任务执行结果进行校验 |
| 🔧 **结果处理器** | 用 JS 编写结果处理器，自定义通知内容与触发条件 |
| 👥 **多用户管理** | 基于 Token 的认证机制，支持多用户创建与管理 |
| 📝 **操作审计** | 完整记录用户操作日志，支持分页查询 |
| 🚀 **SSH 一键部署** | 在 Web UI 填写 SSH 信息，自动完成边缘节点安装与配置 |
| 📡 **节点信息采集** | 自动采集边缘节点的 IP、OS、CPU 架构、内存、Go 版本、Agent 版本 |
| 💬 **企业微信通知** | 支持将任务执行结果推送到企业微信群机器人 |
| 🔑 **优先级管理** | 任务支持 0-3 四个优先级，可按优先级过滤与排序 |
| ⚙️ **并发策略** | 同一任务支持并行、跳过、延迟三种并发执行策略 |
| 📁 **标签管理** | 任务支持自定义标签，便于分类管理 |

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      主控端 (Master)                          │
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────────┐  │
│  │  React 前端   │──▶│  Gin REST API│──▶│  SQLite + GORM  │  │
│  │  (MUI 5)     │   │  (Token 认证) │   │  (数据持久化)    │  │
│  └──────────────┘   └──────────────┘   └─────────────────┘  │
│         │                  │                                  │
│  ┌──────┴──────┐   ┌───────┴───────┐                         │
│  │  WebSocket  │   │  Cron 调度器   │                         │
│  │  (实时推送)  │   │  (本地任务执行) │                         │
│  └─────────────┘   └───────────────┘                         │
└──────────────────────────┬──────────────────────────────────┘
                           │  REST API (X-Node-Secret 认证)
              ┌────────────┼────────────┐
              ▼            ▼            ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │  边缘节点 1   │ │  边缘节点 2   │ │  边缘节点 N   │
    │  (香港)       │ │  (新加坡)     │ │  (东京)       │
    │              │ │              │ │              │
    │ ● 心跳上报    │ │ ● 心跳上报    │ │ ● 心跳上报    │
    │ ● 任务拉取    │ │ ● 任务拉取    │ │ ● 任务拉取    │
    │ ● 结果上报    │ │ ● 结果上报    │ │ ● 结果上报    │
    │ ● 系统信息    │ │ ● 系统信息    │ │ ● 系统信息    │
    └──────────────┘ └──────────────┘ └──────────────┘
```

**数据流：**
1. 边缘节点每隔固定时间发送心跳（`POST /agent/heartbeat`），上报系统信息
2. 边缘节点主动拉取分配给自己的任务（`GET /agent/tasks`），支持增量同步
3. 任务执行完成后，边缘节点将结果上报给主控端（`POST /agent/report`）
4. 主控端通过 WebSocket 将实时状态推送给前端

---

## 🔧 技术栈

| 层次 | 技术 | 说明 |
|------|------|------|
| **后端语言** | Go 1.17 | 高性能并发处理 |
| **Web 框架** | Gin | 轻量 HTTP 路由与中间件 |
| **ORM** | GORM | SQLite 数据持久化 |
| **数据库** | SQLite3 | 零运维单文件数据库 |
| **任务调度** | robfig/cron | Cron 表达式解析与调度 |
| **实时通信** | gorilla/websocket | WebSocket 双向通信 |
| **JavaScript VM** | goja | 在 Go 中执行 JavaScript 断言与处理器 |
| **SSH 客户端** | golang.org/x/crypto/ssh | 远程部署边缘节点 |
| **CLI** | spf13/cobra | 命令行启动/停止/配置 |
| **前端框架** | React 18 | 组件化 UI |
| **UI 组件库** | Material-UI 5 (MUI) | 现代化 UI 组件 |

---

## 🚀 快速开始

### 环境要求

| 项目 | 要求 |
|------|------|
| 操作系统 | Linux / macOS / Windows |
| Go | >= 1.17 |
| Node.js | >= 14（仅前端构建需要） |
| Flutter | >= 3.22（仅移动端开发需要） |
| 磁盘空间 | >= 100 MB |

### 构建与启动

```bash
# 1. 克隆仓库
git clone https://github.com/ponull/gonitor.git
cd gonitor

# 2. 下载 Go 依赖
go mod download

# 3. 构建前端（生产模式）
cd web/client
npm install
npx react-scripts build
cd ../..

# 4. 构建后端（嵌入前端静态文件）
go build -o gonitor .

# 5. 启动服务
./gonitor start

# 或后台守护进程启动
./gonitor start --daemon
```

访问 `http://localhost:8899`，默认账号：**admin** / **123456**

### CLI 命令

```bash
# 启动服务（前台）
./gonitor start

# 启动服务（后台守护进程）
./gonitor start -d
./gonitor start --daemon

# 停止服务
./gonitor stop

# 查看当前配置
./gonitor config

# 查看帮助
./gonitor --help
```

### 开发模式（前后端分离）

```bash
# 启动后端
go run main.go start

# 另开终端启动前端（热更新）
cd web/client
npm install
npm start
# 默认访问 http://localhost:3000，API 代理到 http://localhost:8899
```

### Flutter 移动端（Monorepo apps/mobile）

仓库现已补充 `apps/mobile` Flutter 工程，用于在手机端查看概览、任务、节点、日志和系统设置。

```bash
cd apps/mobile
flutter pub get
flutter run
```

> 移动端默认复用现有 Go API，可直接连接 `http://localhost:8899`；如果暂时没有后端环境，也可以在 App 内进入 Demo 模式预览全部页面。

---

## ⚙️ 配置说明

配置文件为根目录下的 `config.yml`：

```yaml
App:
  Debug: false           # 是否开启调试日志（true 输出到控制台，false 输出到文件）
  DbLog: false           # 是否记录数据库 SQL 日志
  LogFile: tmp/run.log   # 日志文件路径（Debug=false 时生效）

Script:
  Folder: script         # 脚本文件存放目录（file 类型任务使用）
  LogFolder: tmp/log     # 任务输出日志存放目录

Sqlite:
  DbPath: gonitor.db     # SQLite 数据库文件路径

HttpServer:
  Host: 127.0.0.1        # 监听地址（0.0.0.0 表示监听所有网卡）
  Post: 8899             # 监听端口（注意：字段名为 Post，历史原因）

WeCom:                   # 企业微信通知配置
  CorpId: xxxxx          # 企业 ID
  CorpSecret: xxxxx      # 应用 Secret
  AgentId: 1000002       # 应用 AgentId
```

> **提示：** `HttpServer.Post` 字段名为历史遗留，实际含义是端口（Port）。修改此字段名会导致已有 config.yml 不兼容。

---

## 📋 任务类型与示例

任务支持三种执行方式，通过 `ExecType` 字段区分：

### 1. Shell 命令（cmd）

直接执行 Shell 命令，适合简单脚本或系统命令：

```
ExecType: cmd
Command: echo "hello world" && date
```

```
ExecType: cmd
Command: python3 /opt/scripts/backup.py --output /data/backup
```

### 2. HTTP 请求（http）

通过 `curl` 执行 HTTP 请求，适合调用 API 或 Webhook：

```
ExecType: http
Command: https://api.example.com/health
```

```
ExecType: http
Command: POST https://hooks.example.com/trigger {"key":"value"}
```

### 3. 脚本文件（file）

执行存放在 `Script.Folder` 目录中的脚本文件：

```
ExecType: file
Command: backup.sh
```

### 任务参数说明

| 参数 | 类型 | 说明 |
|------|------|------|
| `Name` | string | 任务名称 |
| `Description` | string | 任务描述 |
| `Command` | string | 执行命令 / URL / 文件名 |
| `Schedule` | string | Cron 表达式，如 `*/5 * * * *` |
| `ExecType` | string | 执行类型：`cmd` / `http` / `file` |
| `IsDisable` | bool | 是否禁用 |
| `Priority` | int | 优先级：0=低，1=中，2=高，3=紧急 |
| `Tags` | string | 标签（逗号分隔） |
| `ExecStrategy` | int | 并发策略：0=并行，1=跳过，2=延迟 |
| `RetryTimes` | int | 失败重试次数 |
| `RetryInterval` | int | 重试间隔（秒） |
| `Assert` | string | JavaScript 断言脚本 |
| `ResultHandler` | string | JavaScript 结果处理器脚本 |
| `NodeID` | int64 | 执行节点 ID（0=主节点） |

### Cron 表达式示例

```
*/5 * * * *        每 5 分钟执行
0 */1 * * *        每小时执行
0 0 * * *          每天凌晨执行
0 0 * * 1          每周一凌晨执行
0 0 1 * *          每月 1 号凌晨执行
@every 30s         每 30 秒执行（robfig/cron 扩展语法）
@hourly            每小时
@daily             每天
```

---

## 🔎 JavaScript 断言与结果处理器

Gonitor 使用 [goja](https://github.com/dop251/goja) 在 Go 中执行 JavaScript，为任务提供灵活的输出校验与通知能力。

### Assert（断言脚本）

**用途：** 对任务的标准输出进行校验，返回 `true` 表示成功，`false` 表示失败。

**函数签名：**
```javascript
function main(output) {
    // output: 任务的标准输出字符串
    // 返回 true 表示断言通过（任务成功）
    // 返回 false 表示断言失败（任务标记为失败）
    return true;
}
```

**示例：检查 HTTP 响应包含特定字段**
```javascript
function main(output) {
    var data = JSON.parse(output);
    return data.code === 0 && data.status === "ok";
}
```

**示例：检查命令输出行数**
```javascript
function main(output) {
    var lines = output.trim().split("\n");
    return lines.length > 0 && lines[0] !== "";
}
```

### ResultHandler（结果处理器）

**用途：** 任务执行完成后触发，决定是否发送企业微信通知以及通知内容。

**函数签名：**
```javascript
function main(result, info) {
    // result: 任务执行结果对象
    //   result.status    - 执行状态（0=成功, 1=失败）
    //   result.output    - 标准输出内容
    //   result.runTime   - 运行时间（毫秒）
    //   result.retries   - 重试次数
    //
    // info: 任务信息对象
    //   info.name        - 任务名称
    //   info.command     - 执行命令
    //   info.node        - 节点名称
    //
    // 返回值：
    //   { push: bool, content: string }
    //   push=true 且 content 非空时发送企业微信通知
    return { push: false, content: "" };
}
```

**示例：仅在失败时通知**
```javascript
function main(result, info) {
    if (result.status !== 0) {
        return {
            push: true,
            content: "❌ 任务【" + info.name + "】执行失败！\n输出：" + result.output
        };
    }
    return { push: false, content: "" };
}
```

**示例：始终通知并包含运行时间**
```javascript
function main(result, info) {
    var icon = result.status === 0 ? "✅" : "❌";
    return {
        push: true,
        content: icon + " 任务【" + info.name + "】\n耗时：" + result.runTime + "ms\n节点：" + info.node
    };
}
```

---

## 🌐 分布式节点

### 节点类型

| 类型 | IsMaster | 说明 |
|------|----------|------|
| 主节点 | `true` | 运行主控服务，本地执行任务，系统自动创建 |
| 边缘节点 | `false` | 运行在远程服务器，通过 Agent 拉取并执行任务 |

### 任务分配

- 任务的 `NodeID = 0`：由主节点执行
- 任务的 `NodeID > 0`：分配给对应边缘节点，边缘节点主动拉取并执行

### 边缘节点工作流程

```
边缘节点启动
    │
    ├── 每 N 秒发送心跳 → POST /agent/heartbeat
    │   上报: IP、OS、CPU架构、内存、Go版本、Agent版本
    │   接收: 节点ID、节点名称、服务器时间
    │
    ├── 拉取任务（增量同步） → GET /agent/tasks?since=<时间>
    │   接收: 新增或修改的任务列表
    │   本地更新 Cron 调度器
    │
    └── 执行任务后上报结果 → POST /agent/report
        上报: task_id、执行结果、输出内容、运行时间
```

### 节点认证

边缘节点通过 `X-Node-Secret` Header 进行身份验证：

```http
POST /agent/heartbeat
X-Node-Secret: <node_secret_key>
Content-Type: application/json
```

每个节点拥有唯一的 `SecretKey`（32 位随机字符串），可在 Web UI 中重新生成。

### 节点状态字段

| 字段 | 说明 |
|------|------|
| `IP` | 节点 IP 地址（心跳上报） |
| `OS` | 操作系统类型 |
| `Arch` | CPU 架构（amd64/arm64） |
| `CPUCores` | CPU 核心数 |
| `MemoryTotal` | 总内存（字节） |
| `GoVersion` | Go 版本 |
| `AgentVersion` | Agent 版本 |
| `LastPingAt` | 最近一次心跳时间 |
| `Status` | 在线状态（0=离线，1=在线） |

---

## 🚀 SSH 自动部署边缘节点

在 Web UI「节点管理」页面，填写目标服务器的 SSH 信息，即可一键自动完成边缘节点的安装与配置。

### 部署流程

1. 在 Web UI 填写节点名称、地区、SSH 主机、端口、用户名、密码、安装路径
2. 主控端通过 SSH 连接到目标服务器
3. 自动创建安装目录和日志目录
4. 生成 `config.yml`（包含主控端地址和节点 SecretKey）
5. 生成并注册 `systemd` 服务（`gonitor-agent.service`）
6. 验证部署结果

### SSH 安全要求

- 支持密码认证（SSH 密码登录）
- 安装路径只允许字母、数字、`/`、`-`、`_`、`.`（防止路径注入）
- SSH 端口范围：1–65535，默认 22

> **注意：** 部署功能使用 `ssh.InsecureIgnoreHostKey()`，适用于管理员已知并信任的目标服务器。生产环境建议加固 SSH 配置。

---

## 📡 API 接口文档

**Base URL：** `http://localhost:8899`

**认证方式：** 需要 Token 的接口，请在 Header 中携带：
```
Token: <your_token>
```

**统一响应格式：**
```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

### 用户接口

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/user/login` | ✗ | 登录，返回 Token |
| GET | `/user/selfInfo` | ✓ | 获取当前用户信息 |
| GET | `/user/list/:page/:size` | ✓ | 用户列表（分页） |
| POST | `/user` | ✓ | 新建用户 |
| GET | `/user/:user_id` | ✓ | 获取用户详情 |
| PUT | `/user/:user_id` | ✓ | 编辑用户 |
| DELETE | `/user/:user_id` | ✓ | 删除用户 |

### 任务接口

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/task/list` | ✓ | 任务列表（支持 keyword/priority/status 过滤） |
| GET | `/task/info/:task_id` | ✓ | 任务详情 |
| POST | `/task` | ✓ | 新建任务 |
| PUT | `/task/:task_id` | ✓ | 编辑任务 |
| DELETE | `/task/:task_id` | ✓ | 删除任务 |
| GET | `/task/start/:task_id` | ✓ | 启用任务 |
| GET | `/task/stop/:task_id` | ✓ | 停用任务 |
| GET | `/task/test/:task_id` | ✓ | 手动触发一次执行 |
| GET | `/task/log/list/running/:task_id` | ✓ | 正在运行的任务实例 |
| GET | `/task/log/list/:task_id/:page/:size` | ✓ | 任务执行历史（分页） |
| GET | `/task/log/output/:log_id` | ✓ | 获取任务日志输出内容 |

### 节点接口

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/node/list` | ✓ | 节点列表 |
| GET | `/node/select` | ✓ | 节点下拉选择列表 |
| GET | `/node/info/:node_id` | ✓ | 节点详情 |
| POST | `/node` | ✓ | 注册节点 |
| PUT | `/node/:node_id` | ✓ | 编辑节点 |
| DELETE | `/node/:node_id` | ✓ | 删除节点 |
| GET | `/node/regenerate/:node_id` | ✓ | 重新生成节点 SecretKey |
| GET | `/node/taskCount/:node_id` | ✓ | 获取节点上的任务数量 |
| POST | `/node/deploy` | ✓ | SSH 部署到已有节点 |
| POST | `/node/deploy/new` | ✓ | 创建并 SSH 部署新节点 |
| POST | `/node/deploy/test` | ✓ | 测试 SSH 连接 |

### Agent 接口（边缘节点使用）

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/agent/heartbeat` | X-Node-Secret | 边缘节点心跳上报 |
| GET | `/agent/tasks` | X-Node-Secret | 拉取分配的任务（支持 `?since=` 增量同步） |
| POST | `/agent/report` | X-Node-Secret | 上报任务执行结果 |

### 系统监控接口

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/system/overview` | ✓ | 系统概览（CPU、内存、磁盘） |
| GET | `/system/cpu` | ✓ | CPU 详细信息 |
| GET | `/system/memory` | ✓ | 内存详细信息 |
| GET | `/system/disk` | ✓ | 磁盘详细信息 |
| GET | `/system/net` | ✓ | 网络详细信息 |

### 其他接口

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/op/list/:page/:size` | ✓ | 操作日志列表（分页） |
| GET | `/push/test` | ✗ | 测试企业微信通知 |
| GET | `/ws/:clientId` | ✗ | WebSocket 连接（实时推送） |

#### WebSocket 推送数据格式

```json
{
  "type": "task_update",
  "data": {
    "taskId": 1,
    "status": "running",
    "runningCount": 2
  }
}
```

---

## 📁 项目目录结构

```
gonitor/
├── main.go                    # 程序入口
├── config.yml                 # 配置文件
├── go.mod / go.sum            # Go 模块依赖
│
├── bootstrap/                 # 应用初始化
│   └── bootstrap.go           # 配置加载、数据库迁移、默认数据初始化
│
├── cmd/                       # CLI 命令
│   ├── root.go                # 根命令
│   ├── start.go               # start 命令（启动服务）
│   ├── stop.go                # stop 命令（停止服务）
│   └── config.go              # config 命令（查看配置）
│
├── core/                      # 核心基础设施
│   ├── config.go              # 配置结构体与全局变量
│   └── db.go                  # 数据库连接初始化
│
├── model/                     # 数据模型（GORM）
│   ├── base.go                # 基础模型（软删除、分页）
│   ├── user.go                # 用户模型
│   ├── node.go                # 节点模型
│   ├── task.go                # 任务模型
│   ├── task_log.go            # 任务日志模型
│   └── operation_log.go       # 操作日志模型
│
├── service/                   # 业务逻辑层
│   ├── task.go                # 任务 CRUD 服务
│   ├── node.go                # 节点 CRUD 服务
│   └── user.go                # 用户 CRUD 服务
│
├── task/                      # 任务调度与执行
│   ├── task.go                # 任务管理器（Manager 全局单例）
│   ├── taskIns.go             # 任务实例生命周期管理
│   ├── taskRunning.go         # 运行中任务（进程管理）
│   ├── handler.go             # Cron Job 执行包装器（重试逻辑）
│   ├── tools.go               # JavaScript 断言与处理器执行
│   └── push.go                # WebSocket 实时推送服务
│
├── utils/                     # 工具函数
│   └── common.go              # 密码哈希、HTTP 客户端、随机字符串等
│
├── web/                       # Web 层
│   ├── html.go                # 嵌入前端静态文件（go:embed）
│   ├── middleware/            # 中间件
│   │   ├── middleware.go      # CORS、Token 校验
│   │   └── session/           # Session 管理
│   ├── response/              # 统一响应格式
│   │   └── response.go        # Response 结构体与辅助函数
│   ├── routes/                # 路由注册
│   │   ├── router.go          # 自定义 Router（封装 Gin）
│   │   └── routes.go          # 所有路由定义
│   └── controller/            # HTTP 控制器
│       ├── task.go            # 任务相关接口
│       ├── node.go            # 节点相关接口
│       ├── agent.go           # Agent（边缘节点）接口
│       ├── deploy.go          # SSH 部署接口
│       ├── user.go            # 用户相关接口
│       ├── system.go          # 系统监控接口
│       ├── operation.go       # 操作日志接口
│       ├── push.go            # 推送测试接口
│       └── websocket.go       # WebSocket 接口
│
├── web/client/                # React 前端
│   ├── public/                # 静态资源
│   └── src/
│       ├── App.js             # 路由配置
│       ├── components/        # 通用组件
│       ├── pages/             # 页面组件
│       │   ├── Login.js       # 登录页
│       │   ├── Dashboard.js   # 仪表盘（实时监控）
│       │   ├── TaskList.js    # 任务列表
│       │   ├── TaskEdit.js    # 任务编辑
│       │   ├── TaskLog.js     # 任务日志
│       │   ├── NodeList.js    # 节点管理
│       │   ├── UserList.js    # 用户管理
│       │   └── OperationList.js # 操作日志
│       └── utils/
│           ├── HttpRequest.js # API 请求封装
│           └── Websocket.js   # WebSocket 封装
│
├── apps/
│   └── mobile/                # Flutter 移动端（自适应手机 / 平板）
│       ├── lib/               # App 入口、导航、页面与 API 客户端
│       ├── pubspec.yaml       # Flutter 工程定义
│       └── README.md          # 移动端使用说明
│
├── script/                    # 脚本文件存放目录（file 类型任务）
├── docs/                      # 文档
│   ├── DEPLOYMENT.md          # 部署文档
│   └── MOBILE_MONOREPO_PLAN.md # Monorepo + 移动端设计与落地说明
└── tmp/                       # 临时文件（日志等，.gitignore 忽略）
    ├── run.log                # 运行日志
    └── log/                   # 任务输出日志
```

---

## 🔒 安全说明

1. **Token 认证：** 所有管理接口均需携带 Token Header，Token 存储在数据库并设有过期时间
2. **密码存储：** 使用 bcrypt 加密存储密码，向下兼容旧版 MD5 密码
3. **节点认证：** 边缘节点通过唯一 SecretKey 认证，可随时重新生成
4. **路径注入防护：** SSH 部署路径通过正则表达式验证，防止路径遍历攻击
5. **软删除：** 数据模型使用软删除，误删数据可恢复
6. **CORS：** API 接口已配置 CORS 支持跨域请求（开发环境）

> **生产环境建议：** 修改默认密码、限制 `HttpServer.Host` 为内网地址或使用反向代理（Nginx）

---

## ❓ 常见问题

**Q: 启动报错 `client/build: no such file or directory`**

A: 前端还未构建。执行：
```bash
cd web/client && npm install && npx react-scripts build && cd ../..
```

**Q: 如何修改监听端口？**

A: 编辑 `config.yml`，修改 `HttpServer.Post` 字段（注意字段名是 `Post` 不是 `Port`）：
```yaml
HttpServer:
  Host: 0.0.0.0
  Post: 9000
```

**Q: 边缘节点无法连接主控端**

A: 检查以下几点：
- 主控端 `HttpServer.Host` 是否为 `0.0.0.0`（允许外部连接）
- 防火墙是否开放了对应端口
- 边缘节点的 config.yml 中 `MasterAddress` 是否正确

**Q: 任务执行失败但看不到详细错误**

A: 在任务详情页点击「查看日志」，或通过 `/task/log/output/:log_id` 接口查看完整输出文件。也可将 `config.yml` 中 `App.Debug` 设为 `true` 查看详细日志。

**Q: 如何测试企业微信通知是否配置正确？**

A: 配置好 `WeCom` 后，调用接口 `GET /push/test` 发送测试消息。

**Q: 数据库在哪？如何备份？**

A: 默认在项目根目录下的 `gonitor.db` 文件（SQLite），直接复制该文件即可备份。

---

## 📖 更多文档

- **[完整部署文档](docs/DEPLOYMENT.md)** - 详细的主控端与边缘节点部署指南
- **[API 接口文档](docs/DEPLOYMENT.md#api-接口文档)** - 完整 REST API 参考

---

## 📜 License

[MIT](LICENSE)
