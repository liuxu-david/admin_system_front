# AGENTS.md — 前端 admin_system_front

> AI 助手开工前先读完本文件（~1 分钟）。只写项目特有的约定，通用知识不赘述。
> 配套后端是**独立仓库** `admin_system_backstage`（NestJS，API 前缀 `/api`）。
> 最后治理：2026-08-17 · 治理规则见文末

## 项目一句话

Vue 3.5 + TypeScript + `<script setup>` + Vite + Element Plus + Pinia + Vue Router 的中后台前端，核心是 **RBAC 权限渲染**：动态路由、递归侧边栏、按钮级权限。

## 常用命令

| 场景 | 命令 |
|---|---|
| 启动开发（需后端 :3000 在跑） | `pnpm dev` → http://localhost:5173（/api 自动代理到 3000，见 vite.config.ts） |
| 类型检查 | `pnpm type-check`（vue-tsc） |
| 构建（测试模式） | `pnpm build` |
| 登录账号 | `admin` / `qwer123456`（后端 seed 提供） |

## 目录速览

```
src/
├─ api/          request.ts（axios：解包 {code,data} + 401 自动刷新）+ 按域拆分的接口文件
├─ types/        与后端契约对齐的 TS 类型（rbac.ts 最重要）
├─ stores/       user（token/roles/permissions/menus + 动态路由注册）、app（侧边栏折叠）、tabs（多标签导航）
├─ router/       index.ts（静态路由 + 守卫）、dynamic.ts（菜单树 → 路由，核心）
├─ directives/   v-permission 指令
├─ composables/  usePermission()（has/hasRole）
├─ components/   HasPermission.vue + layout/（Layout/Sidebar/SidebarItem递归/Navbar/TabsView多标签/AppMain/ParentView）
└─ views/        页面，目录结构 = 后端菜单 component 字段（见硬约束 1）
```

## 硬约束（每条都带原因）

1. **views 目录 ↔ 后端菜单 component 一一对应**：后端菜单存 `system/user/index` → 必须存在 `src/views/system/user/index.vue`（`import.meta.glob` 映射，找不到会兜底成空白 ParentView 且无报错）。新增页面两边的路径必须一致。
2. **按钮权限三件套共用同一数据源** `userStore.permissions`：指令 `v-permission="'user:delete'"` / 组件 `<HasPermission code>` / 函数 `usePermission().has()`。权限码 = 后端 seed 里的 `模块:动作`，一字不差。
3. **别手写路由**：业务路由全部由登录后 `/users/info` 返回的菜单树动态生成（`router/dynamic.ts`）。静态路由只有 /login、**首页 /dashboard（人人都有，不受权限控制）**、Layout 壳、404 兜底。新增页面 = 建文件 + 后端加菜单，不是改 router。
4. **守卫重入必须按 path**（router/index.ts）：`return { path: to.path, ... }` 而不是 `return { ...to }`——刷新瞬间动态路由未注册，`to.name` 是兜底路由的 "NotFound"，spread 会带着它跳回 404。改这段前先想清楚。
5. **API 调用一律走 `src/api/request.ts`**：响应拦截器已把 `{code,data,meta}` 解包成 data（泛型 T 直接写业务类型）；401 自动用 refreshToken 无感续期并重试。别在组件里裸用 axios。
6. **组件模板用 Element Plus 全量注册**（main.ts `app.use(ElementPlus)` + 全局图标），模板里直接写 `<el-xxx>` / `<component :is="图标名">`，不用 import。

## 何时读哪篇文档（按需加载，别全读）

| 要做的事 | 读 |
|---|---|
| 新增页面 / 菜单 / 按钮 | `docs/conventions.md` |
| 理解动态路由 / 权限渲染 / 排错 | `docs/architecture.md` |
| 构建 / 部署 / nginx | `docs/ci-cd.md` |

## 治理约定

- 本文件 ≤110 行；`docs/` 每篇 ≤130 行。超了就精简或拆分，**不追加**。
- 大改动合入后核对：命令、目录、硬约束是否仍然真实。
- 新陷阱 → 记到对应 docs 的"陷阱"小节；AGENTS.md 不堆细节。
