import { defineStore } from "pinia";
import { ref } from "vue";

import { login as loginApi, logout as logoutApi } from "@/api/auth";
import { getUserInfo } from "@/api/user";
import {
  getToken,
  setToken,
  removeToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
} from "@/utils/auth";
import type { MenuTreeNode, UserInfoBundle } from "@/types/rbac";
import type { LoginPayload, LoginResult } from "@/types/auth";
import router from "@/router";
import { buildDynamicRoutes, addedRouteNames } from "@/router/dynamic";

export const useUserStore = defineStore("user", () => {
  const token = ref(getToken());
  const userInfo = ref<UserInfoBundle["user"] | null>(null);
  const roles = ref<string[]>([]);
  const permissions = ref<string[]>([]);
  const menus = ref<MenuTreeNode[]>([]);

  async function login(payload: LoginPayload): Promise<LoginResult> {
    const data = await loginApi(payload);
    setToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    token.value = data.accessToken;
    await fetchUserInfo();
    return data;
  }

  /** 拉 /users/info，写入 store 并生成动态路由 */
  async function fetchUserInfo(): Promise<UserInfoBundle> {
    const data = await getUserInfo();
    userInfo.value = data.user;
    roles.value = data.roles;
    permissions.value = data.permissions;
    menus.value = data.menus;
    registerDynamicRoutes(data.menus);
    return data;
  }

  function registerDynamicRoutes(menuTree: MenuTreeNode[]) {
    // 先清掉旧动态路由（重新登录 / 切角色场景）
    addedRouteNames.forEach((name) => router.removeRoute(name));
    addedRouteNames.clear();
    buildDynamicRoutes(menuTree).forEach((route) => router.addRoute("Layout", route));
  }

  async function logout() {
    try {
      await logoutApi(getRefreshToken());
    } catch {
      // 登出接口失败也继续清本地
    }
    resetState();
    // 最简单可靠：刷新清空一切（动态路由、组件状态）
    location.reload();
  }

  function resetState() {
    token.value = "";
    userInfo.value = null;
    roles.value = [];
    permissions.value = [];
    menus.value = [];
    removeToken();
    removeRefreshToken();
    addedRouteNames.forEach((name) => router.removeRoute(name));
    addedRouteNames.clear();
  }

  return { token, userInfo, roles, permissions, menus, login, fetchUserInfo, logout, resetState };
});
