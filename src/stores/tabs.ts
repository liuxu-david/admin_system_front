import { defineStore } from "pinia";
import { ref } from "vue";

import router from "@/router";

export interface TabItem {
  path: string;
  title: string;
}

/** 固定标签（不可关闭）：首页（静态路由，所有登录用户都有） */
const AFFIX: TabItem[] = [{ path: "/dashboard", title: "首页" }];

/**
 * 多标签导航：访问过的页面自动记录成标签，点标签切页。
 * 会话级（刷新后重置）；页面状态保持（keep-alive）暂未做。
 */
export const useTabsStore = defineStore("tabs", () => {
  const tabs = ref<TabItem[]>([...AFFIX]);

  function isAffix(path: string): boolean {
    return AFFIX.some((t) => t.path === path);
  }

  /** 路由进入时记录标签；登录页/404/无标题的路由不记 */
  function addTab(to: { path: string; name?: unknown; meta?: { title?: string } }): void {
    if (to.path === "/login") return;
    if (to.name === "NotFound" || !to.meta?.title) return;
    if (tabs.value.some((t) => t.path === to.path)) return;
    tabs.value.push({ path: to.path, title: to.meta.title });
  }

  /** 删一个标签，返回「关的是当前页」时应跳去的相邻页 */
  function removeTab(path: string): string | null {
    if (isAffix(path)) return null;
    const idx = tabs.value.findIndex((t) => t.path === path);
    if (idx === -1) return null;
    tabs.value.splice(idx, 1);
    return tabs.value[idx]?.path ?? tabs.value[idx - 1]?.path ?? AFFIX[0].path;
  }

  function closeOthers(current: string): void {
    tabs.value = tabs.value.filter((t) => isAffix(t.path) || t.path === current);
  }

  function closeAll(): void {
    tabs.value = [...AFFIX];
  }

  // store 晚于首个路由创建（Layout 挂载时才初始化），先把当前页记上，再监听后续跳转
  addTab(router.currentRoute.value);
  router.afterEach((to) => addTab(to));

  return { tabs, isAffix, addTab, removeTab, closeOthers, closeAll };
});
