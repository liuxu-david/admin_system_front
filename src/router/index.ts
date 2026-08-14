import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

import { useUserStore } from "@/stores/user";

NProgress.configure({ showSpinner: false });

const staticRoutes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: { public: true, title: "登录" },
  },
  {
    path: "/",
    name: "Layout",
    component: () => import("@/components/layout/index.vue"),
    redirect: "/dashboard",
    children: [],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/error/404.vue"),
    meta: { public: true, title: "404" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes: staticRoutes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to) => {
  NProgress.start();
  const userStore = useUserStore();
  document.title = to.meta.title ? `${to.meta.title} · Admin System` : "Admin System";

  // 去登录页：已登录就转首页
  if (to.path === "/login") {
    return userStore.token ? { path: "/" } : true;
  }

  // 未登录 → 登录页（带 redirect）
  if (!userStore.token) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }

  // 已登录但 store 是空的（刷新后丢失）→ 重新拉 /users/info 并生成路由，再重入
  if (userStore.menus.length === 0) {
    try {
      await userStore.fetchUserInfo();
    } catch {
      userStore.resetState();
      return { path: "/login" };  
    }
    // 关键：按 path 重入，不要 spread 整个 to——
    // 否则会带上刷新瞬间命中兜底路由时的 to.name="NotFound"，导致重入又跳 404。
    return { path: to.path, query: to.query, hash: to.hash, replace: true };
  }

  return true;
});

router.afterEach(() => {
  NProgress.done();
});

export default router;
