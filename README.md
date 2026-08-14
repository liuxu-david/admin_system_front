# Admin System Frontend

基于 **Vite + Vue 3 + TypeScript + `<script setup>` + Element Plus + Pinia + Vue Router** 的中后台管理前端，搭配同仓库的 NestJS 后端（`admin_system_backstage`）使用，实现了完整的 **RBAC 权限系统**：动态路由、路由守卫、递归侧边栏、按钮级权限、以及「用户 / 角色 / 菜单」全套管理页。

## ✨ 功能

- **认证**：邮箱密码登录，JWT 双 token（access + refresh），access 过期自动用 refresh 续期、无感刷新。
- **动态路由**：登录后调 `GET /users/info` 拿菜单树，前端用 `import.meta.glob` 把后端的 `component` 字符串映射成真实组件，动态 `addRoute`。
- **路由守卫**：未登录跳登录页；刷新后 store 丢失自动重拉 `/users/info` 并重建路由；手动输无权限 URL 也会被后端拦（403）。
- **递归侧边栏**：按菜单树分层渲染，目录可展开，图标用 Element Plus 图标。
- **按钮级权限**：三种方式，共用同一数据源 `userStore.permissions`：
  - 指令 `v-permission="'user:delete'"`
  - 组件 `<HasPermission code="user:delete">`
  - 函数 `usePermission().has('user:delete')`
- **RBAC 管理**：用户（分配角色 / 改状态）、角色（CRUD + 分配接口权限树 + 分配菜单树）、菜单（树形 + 拖拽排序 + CRUD）。

## 🧩 权限模型回顾

```
用户 User ──拥有──> 角色 Role ──拥有──> 接口权限 Permission / 菜单 Menu
```

- **接口权限**（后端 `PermissionsGuard` 拦截）：真防线，前端再怎么绕都被拦。
- **菜单权限**（前端渲染路由/侧边栏/按钮）：体验优化，把没权限的藏起来。

> 设计详见后端 `docs/rbac-design.md`。

## 🚀 快速开始

### 1. 先把后端跑起来（带 RBAC）

```bash
cd ../admin_system_backstage
docker-compose up -d postgres redis   # 起 PG + Redis
pnpm install
pnpm migration:generate src/database/migrations/CreateRbac   # 生成 RBAC 迁移（建表 + 删 users.role）
pnpm migration:run
pnpm seed                  # 初始化 角色/权限/菜单 + 超管账号
pnpm start:dev             # http://localhost:3000 ，Swagger 在 /api/docs
```

### 2. 跑前端

```bash
cd ../admin_system_front
pnpm install
pnpm dev                   # http://localhost:5173
```

开发环境通过 vite proxy 把 `/api` 代理到 `http://localhost:3000`（见 `vite.config.ts`），免 CORS。

### 3. 登录

初始账号（由 `pnpm seed` 创建，**超级管理员，拥有全部权限**）：

```
邮箱：admin@admin.com
密码：Admin@123456
```

## 📁 目录结构

```
src/
├─ api/            # axios 封装（解包 envelope + 401 自动刷新）+ 各业务接口
├─ types/          # TS 类型（与后端契约对齐）
├─ utils/auth.ts   # token 的 localStorage 读写
├─ stores/         # Pinia：user（token/roles/permissions/menus）、app（侧边栏折叠）
├─ router/         # 静态路由 + 路由守卫；dynamic.ts 把菜单树转成路由
├─ directives/     # v-permission 指令
├─ composables/    # usePermission()
├─ components/     # HasPermission.vue + layout/（Layout/Sidebar/SidebarItem/Navbar/AppMain）
└─ views/          # 页面，目录结构与后端 menu.component 字段一一对应
   ├─ login/ dashboard/ error/404
   ├─ system/{user,role,menu}/
   └─ project/list/
```

> **重要约定**：后端菜单的 `component` 字段（如 `system/user/index`）必须对应 `src/views/system/user/index.vue`。新增页面时两边保持一致。

## 🔧 按钮权限用法

```vue
<!-- 指令：最简洁 -->
<el-button v-permission="'user:delete'" type="danger">删除</el-button>

<!-- 多权限：任一满足（默认 any） -->
<el-button v-permission="['user:update', 'user:delete']">操作</el-button>

<!-- 多权限：必须全部满足 -->
<el-button v-permission="{ value: ['a', 'b'], mode: 'all' }">操作</el-button>

<!-- 组件：支持「置灰」而非隐藏 -->
<HasPermission code="user:delete" disabled>
  <el-button type="danger">删除</el-button>
  <template #disabled><el-button type="danger" disabled>删除</el-button></template>
</HasPermission>

<!-- JS 逻辑里判断 -->
<script setup lang="ts">
import { usePermission } from "@/composables/usePermission";
const { has } = usePermission();
if (has("user:delete")) { /* ... */ }
</script>
```

## 🛠️ 脚本

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 启动开发服务器（5173） |
| `pnpm build` | 类型检查 + 生产构建 |
| `pnpm preview` | 预览构建产物 |
| `pnpm type-check` | 仅 `vue-tsc` 类型检查 |

## ⚙️ 配置

- `VITE_API_BASE_URL`（`.env.development` / `.env.production`）：后端 API 基址。开发用 `/api`（走代理），生产改成真实地址如 `https://api.example.com/api`。

## 🔍 验证权限是否生效

1. 用 `admin@admin.com` 登录 → 看到全部菜单、所有操作按钮。
2. 在「角色管理」新建一个角色，只勾 `project:read` 权限 + 项目列表菜单，再在「用户管理」把它分配给某用户。
3. 用该用户登录 → 侧边栏只有「仪表盘 / 项目管理」；「项目列表」页没有「新增 / 编辑 / 删除」按钮（被 `v-permission` 移除）。
4. 该用户手动 `PUT /projects` → 后端 `PermissionsGuard` 返回 403（`code 20507`）。
