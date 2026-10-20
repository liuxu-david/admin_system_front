# Admin System 前端

Vue 3 + TypeScript + `<script setup>` + Vite + Element Plus + Pinia 的中后台前端，核心是 RBAC 权限渲染：动态路由、递归侧边栏、按钮级权限。配套后端为独立仓库 `admin_system_backstage`（NestJS）。

## 快速开始

```bash
# 先把后端跑起来（见后端仓库 README），然后：
pnpm install
pnpm dev          # → http://localhost:5173（/api 自动代理到后端 3000）
```

登录：`admin` / `qwer123456`

## 常用命令

| 命令 | 作用 |
|---|---|
| `pnpm dev` | 开发服务器 |
| `pnpm type-check` | vue-tsc 类型检查 |
| `pnpm build` | 类型检查 + 生产构建 |

## 文档

- **给 AI 助手 / 新人**：先读 [AGENTS.md](AGENTS.md)（项目约定 + 硬约束 + 文档索引）
- 架构与排障 → [docs/architecture.md](docs/architecture.md)
- 新增页面/菜单/按钮 → [docs/conventions.md](docs/conventions.md)
- 构建部署 nginx → [docs/ci-cd.md](docs/ci-cd.md)
- 两仓统一测试部署教程 → [后端 deploy/README.md](https://github.com/liuxu-david/admin_system_backstage/blob/main/deploy/README.md)（后端分支合入 main 后可在线读取）

## 环境与测试发布

开发／CI 使用 Node `24.19.0`（`.nvmrc`）、pnpm `11.20.0`。GitHub Actions 的测试镜像以 `MODE=test` 构建，使用同源 `/api`，服务器只运行 Nginx 镜像，不运行 `pnpm dev`。

PR 到 main 仅检查／构建／隔离 smoke；push main 默认只推 GHCR，不部署。首次统一 bootstrap、seed、改密完成后，才手动 `workflow_dispatch deploy=true`；自动部署须显式设置仓库变量 `AUTO_DEPLOY_TEST=true`。服务器固定 `/opt/admin-system-test/`，部署必须使用 Summary 输出的完整前端 digest。

本地实现不表示云端已启用；当前变更待用户 review／commit／push／PR。双端镜像构建受 Docker Hub 认证网络超时阻塞，GitHub／GHCR／服务器发布尚未实跑。首次通过 SSH 隧道访问 `http://127.0.0.1:18080` 并更改 seed 默认密码。
