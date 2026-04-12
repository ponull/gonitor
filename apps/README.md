# Gonitor Apps

Gonitor 已继续向完整 monorepo 推进，当前三端入口约定如下：

- `apps/web`：React Web 控制台入口（当前通过工作区脚本代理到 `web/client`，避免破坏 Go `embed` 链路）
- `apps/mobile`：Flutter 移动端工程
- `apps/server`：Go 服务端说明入口（当前 Go 模块与业务代码仍位于仓库根目录）

推荐从仓库根目录统一执行：

```bash
npm run web:deps
npm run web:start
npm run server:start
npm run mobile:deps
```
