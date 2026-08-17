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

// ─── 权限（权限码字典，菜单表单下拉用） ──────────────
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
// 权限随勾选的菜单节点派生，只分配菜单即可
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
// CRUD 走 /users（UserController），列表走 /rbac/users（带角色）
export const createUser = (data: { email: string; nickname?: string; password: string }) =>
  request.post<UserWithRoles>("/users", data);
export const updateUser = (
  id: string,
  data: { email?: string; nickname?: string; password?: string },
) => request.patch<UserWithRoles>(`/users/${id}`, data);
export const deleteUser = (id: string) => request.delete<null>(`/users/${id}`);
export const getUsers = () => request.get<UserWithRoles[]>("/rbac/users");
export const assignUserRoles = (id: string, ids: string[]) =>
  request.put<null>(`/rbac/users/${id}/roles`, { ids });
export const updateUserStatus = (id: string, status: MenuStatus | string) =>
  request.patch<null>(`/rbac/users/${id}/status`, { status });
