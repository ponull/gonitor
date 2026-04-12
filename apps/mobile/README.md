# Gonitor Mobile

Gonitor Mobile 是为 `ponull/gonitor` 设计的 Flutter 移动端应用骨架，目标是在手机上高频查看系统状态、管理任务、追踪节点与审计日志。

## 已实现的移动端能力

- 登录页：支持输入服务地址、账号、密码
- Demo 模式：无后端环境时也能直接预览 UI 与交互流
- 自适应导航：窄屏使用底部导航，宽屏使用 `NavigationRail`
- 概览页：任务/节点/用户统计、CPU/内存/磁盘/网络卡片、功能标签
- 任务页：搜索、状态概览、启停、立即执行、任务详情和执行日志展示
- 节点页：在线状态、心跳、系统信息、密钥再生入口
- 用户页：用户列表与账号信息浏览
- 审计日志页：操作日志时间线式展示
- 设置页：版本、功能开关、脚本目录、HTTP 服务信息、推送测试入口

## API 对接

移动端默认复用现有 Go API：

- `POST /user/login`
- `GET /system/overview`
- `GET /system/cpu`
- `GET /system/memory`
- `GET /system/disk`
- `GET /system/net`
- `GET /system/settings`
- `GET /task/list`
- `GET /task/info/:task_id`
- `GET /task/log/list/running/:task_id`
- `GET /task/log/list/:task_id/:page/:size`
- `GET /task/start/:task_id`
- `GET /task/stop/:task_id`
- `GET /task/test/:task_id`
- `GET /node/list`
- `GET /node/regenerate/:node_id`
- `GET /user/list/1/20`
- `GET /op/list/1/20`
- `GET /push/test`

鉴于当前仓库没有 Flutter SDK，本次提交提供的是可直接落地的 Flutter 工程源码；在具备 Flutter 环境后可继续执行：

```bash
cd apps/mobile
flutter pub get
flutter run
```
