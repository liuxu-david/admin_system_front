import { useUserStore } from "@/stores/user";

/** 在 JS 逻辑里判断权限/角色 */
export function usePermission() {
  const userStore = useUserStore();

  const has = (code: string | string[], mode: "any" | "all" = "any"): boolean => {
    const required = Array.isArray(code) ? code : [code];
    if (required.length === 0) return true;
    return mode === "all"
      ? required.every((c) => userStore.permissions.includes(c))
      : required.some((c) => userStore.permissions.includes(c));
  };

  const hasRole = (role: string | string[]): boolean => {
    const required = Array.isArray(role) ? role : [role];
    return required.some((r) => userStore.roles.includes(r));
  };

  return { has, hasRole };
}
