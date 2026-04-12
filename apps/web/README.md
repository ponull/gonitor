# Gonitor Web

`apps/web` 是 monorepo 下的 React Web 应用入口。

为保持现有 Go 服务端 `web/html.go` 的 `go:embed client/build/*` 构建链路不被破坏，当前 React 源码仍然保留在 `web/client`，这里先通过工作区脚本统一出 monorepo 入口：

```bash
# 在仓库根目录
npm run web:deps
npm run web:start
npm run web:build
```

如果后续需要把源码物理迁移到 `apps/web`，还需要同步调整 Go 侧静态资源 embed 与发布流程。
