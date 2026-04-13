# Gonitor Monorepo + Flutter Mobile 计划与落地结果

## 本次目标

围绕“移动端才是王道”的诉求，本次采用**最小风险、可持续演进**的方式，为仓库补齐移动端能力，并把目录结构推进到更适合多端共存的 monorepo 形态。

## 本次已落地的开发计划

- [x] 明确单仓多端方向：在现有 Go 后端 + React Web 的基础上新增 `apps/mobile`
- [x] 设计移动端核心导航：概览、任务、节点、用户、日志、设置六大工作区
- [x] 设计手机优先、自适应布局：窄屏底部导航、宽屏 `NavigationRail` 双栏布局
- [x] 让移动端尽量覆盖现有仓库能力：登录、系统概览、任务管理、任务详情、节点查看、密钥操作、用户列表、审计日志、系统设置、推送测试
- [x] 兼顾真实环境和演示环境：支持调用现有 Go API，也提供 Demo 数据模式方便快速预览
- [x] 补充 monorepo / 移动端文档与目录说明，方便后续继续扩展

## 当前 monorepo 目录形态

```text
/home/runner/work/gonitor/gonitor
├── apps/
│   ├── server/          # Go 服务端 monorepo 入口说明
│   ├── web/             # React Web monorepo 工作区入口
│   └── mobile/          # Flutter 移动端
├── web/client/          # 现有 React 源码与构建输出（Go embed 仍依赖）
├── web/                 # Go 服务的 Web 层与前端 embed
├── model/ task/ core/   # Go 领域与调度核心
└── docs/                # 文档与移动端规划
```

> 说明：考虑到 `web/html.go` 通过 `go:embed` 直接依赖 `web/client/build/*`，本次继续采用兼容式推进：补齐 `apps/web` 与 `apps/server` 作为 monorepo 统一入口，但暂不粗暴搬迁现有 React 源码和 Go module。这样仓库已经具备 React + Flutter + Go 的完整 monorepo 入口，同时不破坏既有发布链路。

## 移动端功能映射

| 移动端页面 | 对应现有能力 | 本次实现 |
|---|---|---|
| 登录 | `/user/login` | 支持服务地址、账号、密码登录，也支持 Demo 直接预览 |
| 概览 | `/system/*` + `/system/settings` | 统计卡片、CPU/内存/磁盘/网络、功能标签 |
| 任务 | `/task/list` `/task/start` `/task/stop` `/task/test` | 搜索、任务卡片、启停、立即执行 |
| 任务详情 | `/task/info` `/task/log/list/*` | 基本信息、调度参数、运行中/已结束日志 |
| 节点 | `/node/list` `/node/regenerate/:id` | 在线状态、系统信息、密钥复制、密钥重置 |
| 用户 | `/user/list/1/20` | 用户与账号信息浏览 |
| 日志 | `/op/list/1/20` | 时间线式操作审计 |
| 设置 | `/system/settings` `/push/test` | 版本、服务配置、功能开关、推送测试 |

## UI 设计原则

1. **手机优先**：关键信息收敛成卡片与标签，减少表格依赖。
2. **现代化**：Material 3 风格、圆角卡片、高密度摘要区。
3. **自适应**：窄屏单列、宽屏双列/双栏，不强依赖单一尺寸。
4. **内容显示优化**：任务、节点、日志优先展示摘要，细节通过详情区展开。
5. **真实可接入**：默认复用现有 Go API，不强制后端新增接口。

## 后续建议（不在本次最小改动范围内）

- 将现有 Web 前端源码从 `web/client` 物理迁移到统一的 `apps/web`
- 将 Go 服务端入口与打包链路进一步下沉到 `apps/server`
- 为移动端抽出共享 API Schema / OpenAPI 文档，减少字段漂移
- 引入角色权限与只读移动角色，降低移动端误操作风险
- 为任务详情补充 WebSocket / SSE 实时更新能力
- 为移动端增加批量操作、告警中心、工作流视图
