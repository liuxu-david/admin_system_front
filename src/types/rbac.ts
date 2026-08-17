export type MenuType = "directory" | "menu" | "button";
export type MenuStatus = "enabled" | "disabled";

/** 后端 /users/info 返回的菜单树节点 */
export interface MenuTreeNode {
  id: string;
  parentId: string | null;
  name: string;
  code: string;
  type: MenuType;
  path: string | null;
  component: string | null;
  redirect: string | null;
  icon: string | null;
  permission: string | null;
  sort: number;
  visible: boolean;
  children: MenuTreeNode[];
}

/** 登录后一次性拿到的用户授权信息 */
export interface UserInfoBundle {
  user: { id: string; email: string; nickname: string; avatarUrl: string | null };
  roles: string[];
  permissions: string[];
  menus: MenuTreeNode[];
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
  action: string;
  description: string | null;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  sort: number;
  createdAt: string;
  updatedAt: string;
}

/** 角色详情：带已分配的 permissions / menus（供分配弹窗回显） */
/** 角色详情：带已勾选的 menus（权限码从菜单节点派生，无独立权限关联） */
export interface RoleDetail extends Role {
  menus: Menu[];
}

export interface Menu {
  id: string;
  parentId: string | null;
  name: string;
  code: string;
  type: MenuType;
  path: string | null;
  component: string | null;
  redirect: string | null;
  icon: string | null;
  permission: string | null;
  sort: number;
  visible: boolean;
  status: MenuStatus;
  createdAt: string;
  updatedAt: string;
  children?: Menu[];
}

export interface UserWithRoles {
  id: string;
  email: string;
  nickname: string;
  status: string;
  avatarUrl: string | null;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}
