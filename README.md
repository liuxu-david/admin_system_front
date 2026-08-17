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
