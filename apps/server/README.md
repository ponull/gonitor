# Gonitor Server

`apps/server` 用于标记 monorepo 下的 Go 服务端应用入口。

当前为了保持 `gonitor` 现有 Go module、包导入路径和启动方式稳定，服务端源码与模块定义仍保留在仓库根目录：

- `go.mod`
- `main.go`
- `cmd/`
- `bootstrap/`
- `core/`
- `model/`
- `task/`
- `web/`

统一启动方式改为优先使用仓库根目录脚本：

```bash
# 在仓库根目录
npm run server:start
npm run server:test
```
