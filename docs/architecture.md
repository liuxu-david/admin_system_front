# 前端架构速览

> 理解权限渲染链路 / 排错时读。

## 权限渲染全景（本项目的核心）

```
登录 POST /auth/login → 存 accessToken/refreshToken（localStorage，utils/auth.ts）
  ↓
GET /users/info → { user, roles[], permissions[], menus[]（树） }
  ↓ 存 Pinia userStore
  ├─ menus   → buildDynamicRoutes()（router/dynamic.ts）→ router.addRoute("Layout", r)
  │             + 侧边栏递归渲染（SidebarItem.vue）
  └─ permissions → 按钮/操作显隐（v-permission / HasPermission / usePermission）
```

permissions 由后端从「角色勾选的菜单节点上的权限码」实时派生（见后端 docs/rbac.md）——角色分配弹窗只有一棵菜单树，勾了节点即授予权限，不存在单独的"接口权限"页签。

## 动态路由生成（router/dynamic.ts）

- `import.meta.glob("../views/**/*.vue")` 收集全部页面；后端菜单 `component: "system/user/index"` 映射到 `../views/system/user/index.vue`。
- **顶层菜单用全路径、子菜单取最后一段做相对路径**（`/system/user` → `user` 挂在 `/system` 下，Vue Router 自动拼接）。
- `directory` 类型用 ParentView（就是个 `<router-view/>`）占位；`button` 不生成路由。
- 目录 redirect：优先用后端字段，否则指向第一个子菜单。
- `addedRouteNames` 集合记录已注入路由，重新登录/登出时 removeRoute 清理。

## 路由守卫（router/index.ts）

```
to /login？已登录→/ ；未登录→放行
无 token → /login?redirect=...
有 token 但 menus 为空（刷新丢 store）→ await fetchUserInfo() 重建路由 → 按 path 重入（见 AGENTS 硬约束 4）
```

**首页是静态路由**（Layout 的固定子路由 `/dashboard`），人人都有、不受菜单权限控制；侧边栏第一项和标签栏固定标签都是它——不存在"用户没有首页"的登录死局。

## 请求层（api/request.ts）

- 拦截器注入 `Authorization: Bearer <token>`。
- 响应拦截器把 `{code:0,data}` 解包直接返回 data；`code!==0` 弹 ElMessage 并 reject `{code,message}`。
- **401 自动续期**：用 refreshToken 调 `/auth/refresh`（裸 axios 防递归）→ 更新双 token → 重试原请求；续期期间的并发请求进队列等新 token；失败则清 token 跳 /login。
- `request.get<T>(url)` 的泛型 T = 业务数据类型（不是 AxiosResponse）。

## 布局

`components/layout/index.vue` = Sidebar（el-menu，router 模式，default-active=当前 path）+ Navbar（折叠/面包屑/用户下拉退出）+ TabsView（多标签导航：访问过的页面自动成标签，首页标签固定，支持关闭单个/其他/全部，会话级不持久化）+ AppMain（transition 的 router-view）。样式变量在 `styles/index.css`。

## 陷阱

| 现象 | 原因 / 解法 |
|---|---|
| 刷新动态路由 404 | 守卫重入带了兜底路由的 name（见 AGENTS 硬约束 4），已修复，别改回去 |
| 新页面空白但不报错 | views 目录与菜单 component 字段不一致，glob 没匹配到，兜底成了 ParentView。对照两边路径 |
| 改了菜单/权限，前端不变 | 后端 Redis 缓存 30 分钟；走管理接口改会自动清缓存，直接改库要手动清（后端 docs/rbac.md） |
| 403 (code 20507) | 后端 PermissionsGuard 拦的——权限码没配。正常防御，不是前端 bug |
| 构建报 chunk >500kB 警告 | Element Plus 全量引入所致，内网后台可忽略；要优化再改按需引入 |
