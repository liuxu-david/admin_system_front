import request from "./request";
import type {
  Role,
  RoleDetail,
  Permission,
  Menu,
  MenuTreeNode,
  UserWithRoles,
  MenuType,
  MenuStatus,
} from "@/types/rbac";

// ─── 权限 ──────────────────────────────────────────
export const getPermissions = () => request.get<Permission[]>("/rbac/permissions");

// ─── 角色 ──────────────────────────────────────────
export const getRoles = () => request.get<Role[]>("/rbac/roles");
export const getRoleDetail = (id: string) => request.get<RoleDetail>(`/rbac/roles/${id}`);
export const createRole = (data: {
  code: string;
  name: string;
  description?: string;
  sort?: number;
}) => request.post<Role>("/rbac/roles", data);
export const updateRole = (
  id: string,
  data: { name?: string; description?: string; sort?: number },
) => request.patch<Role>(`/rbac/roles/${id}`, data);
export const deleteRole = (id: string) => request.delete<null>(`/rbac/roles/${id}`);
export const assignRolePermissions = (id: string, ids: string[]) =>
  request.put<null>(`/rbac/roles/${id}/permissions`, { ids });
export const assignRoleMenus = (id: string, ids: string[]) =>
  request.put<null>(`/rbac/roles/${id}/menus`, { ids });

// ─── 菜单 ──────────────────────────────────────────
export const getMenuTree = () => request.get<MenuTreeNode[]>("/rbac/menus/tree");
export const getMenusFlat = () => request.get<Menu[]>("/rbac/menus");
export const createMenu = (data: {
  parentId?: string | null;
  name: string;
  code: string;
  type: MenuType;
  path?: string;
  component?: string;
  redirect?: string;
  icon?: string;
  permission?: string;
  sort?: number;
  visible?: boolean;
  status?: MenuStatus;
}) => request.post<Menu>("/rbac/menus", data);
export const updateMenu = (id: string, data: Partial<Menu>) =>
  request.patch<Menu>(`/rbac/menus/${id}`, data);
export const deleteMenu = (id: string) => request.delete<null>(`/rbac/menus/${id}`);

// ─── 用户（管理端） ────────────────────────────────
export const getUsers = () => request.get<UserWithRoles[]>("/rbac/users");
export const assignUserRoles = (id: string, ids: string[]) =>
  request.put<null>(`/rbac/users/${id}/roles`, { ids });
export const updateUserStatus = (id: string, status: MenuStatus | string) =>
  request.patch<null>(`/rbac/users/${id}/status`, { status });
