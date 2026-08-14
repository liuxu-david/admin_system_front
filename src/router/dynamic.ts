import type { RouteRecordRaw } from "vue-router";

import type { MenuTreeNode } from "@/types/rbac";
import ParentView from "@/components/layout/ParentView.vue";

// 用 Vite 的 import.meta.glob 把所有页面组件收集起来，
// 供后端返回的 component 字符串（如 "system/user/index"）映射到 /src/views/system/user/index.vue
const modules = import.meta.glob("../views/**/*.vue");

/** 已注册的动态路由 name 集合（用于重新加载/登出时清理） */
export const addedRouteNames = new Set<string>();

function resolveComponent(component?: string | null) {
  if (!component) return ParentView;
  const key = `../views/${component}.vue`;
  const loader = modules[key] as (() => Promise<unknown>) | undefined;
  return loader ?? ParentView;
}

/** 顶层用全路径；嵌套子菜单用相对路径（取最后一段），Vue Router 会自动拼接 */
function relativizePath(full?: string | null): string {
  if (!full) return "";
  const seg = full.split("/").filter(Boolean).pop();
  return seg || full;
}

function firstLeafRelative(route: RouteRecordRaw): string {
  if (route.children?.length) return firstLeafRelative(route.children[0]);
  return typeof route.path === "string" ? route.path : "";
}

function joinPath(parent: string | null | undefined, child: string): string {
  if (!parent) return child.startsWith("/") ? child : `/${child}`;
  return `${parent.replace(/\/$/, "")}/${child.replace(/^\//, "")}`;
}

function menuToRoute(menu: MenuTreeNode, isTopLevel: boolean): RouteRecordRaw | null {
  // 按钮不生成路由
  if (menu.type === "button") return null;

  const children = (menu.children ?? [])
    .map((child) => menuToRoute(child, false))
    .filter((r): r is RouteRecordRaw => r !== null);

  const name = menu.code;
  addedRouteNames.add(name);

  // 目录重定向：优先用后端 redirect，否则指向第一个子菜单
  let redirect: string | undefined;
  if (menu.type === "directory") {
    redirect =
      menu.redirect ??
      (children.length ? joinPath(menu.path, firstLeafRelative(children[0])) : undefined);
  }

  // 用展开而非「先建对象再赋值」，避开 RouteRecordRaw 联合类型的属性写入限制
  const route = {
    path: isTopLevel ? menu.path ?? `/${name}` : relativizePath(menu.path),
    name,
    component: menu.type === "directory" ? ParentView : resolveComponent(menu.component),
    meta: { title: menu.name, icon: menu.icon ?? "", permission: menu.permission ?? "" },
    ...(children.length ? { children } : {}),
    ...(redirect ? { redirect } : {}),
  } as RouteRecordRaw;
  return route;
}

/** 把后端菜单树转成路由数组（顶层路由会挂到名为 Layout 的路由下） */
export function buildDynamicRoutes(menus: MenuTreeNode[]): RouteRecordRaw[] {
  addedRouteNames.clear();
  return menus.map((m) => menuToRoute(m, true)).filter((r): r is RouteRecordRaw => r !== null);
}
