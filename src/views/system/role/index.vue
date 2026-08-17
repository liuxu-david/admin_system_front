<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  assignRoleMenus,
  createRole,
  deleteRole,
  getMenuTree,
  getRoleDetail,
  getRoles,
  updateRole,
} from "@/api/rbac";
import type { MenuTreeNode, Role } from "@/types/rbac";

const loading = ref(false);
const list = ref<Role[]>([]);
const allMenuTree = ref<MenuTreeNode[]>([]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const menuTreeRef = ref<any>(null);

interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}
function toMenuNodes(nodes: MenuTreeNode[]): TreeNode[] {
  return nodes.map<TreeNode>((n) => ({
    id: n.id,
    // 方括号里是该节点授予的权限码：勾了节点 = 拥有该权限
    label: `${n.name}${n.permission ? ` [${n.permission}]` : ""}`,
    children: n.children?.length ? toMenuNodes(n.children) : undefined,
  }));
}
const menuTreeData = computed(() => toMenuNodes(allMenuTree.value));

async function load() {
  loading.value = true;
  try {
    const [roles, menus] = await Promise.all([getRoles(), getMenuTree()]);
    list.value = roles;
    allMenuTree.value = menus;
  } finally {
    loading.value = false;
  }
}

// ─── 新建/编辑 ───────────────────────────────────
const formDialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive({ id: "", code: "", name: "", description: "", sort: 0 });

function openCreate() {
  isEdit.value = false;
  Object.assign(form, { id: "", code: "", name: "", description: "", sort: 0 });
  formDialogVisible.value = true;
}
function openEdit(role: Role) {
  isEdit.value = true;
  Object.assign(form, {
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description ?? "",
    sort: role.sort,
  });
  formDialogVisible.value = true;
}
async function submitForm() {
  if (isEdit.value) {
    await updateRole(form.id, {
      name: form.name,
      description: form.description,
      sort: form.sort,
    });
  } else {
    await createRole({
      code: form.code,
      name: form.name,
      description: form.description,
      sort: form.sort,
    });
  }
  ElMessage.success("已保存");
  formDialogVisible.value = false;
  load();
}
async function remove(role: Role) {
  await ElMessageBox.confirm(`确认删除角色「${role.name}」？`, "提示", { type: "warning" });
  await deleteRole(role.id);
  ElMessage.success("已删除");
  load();
}

// ─── 分配菜单权限（单一入口：勾了节点即授予其权限码）───
const assignDialogVisible = ref(false);
const currentRole = ref<Role | null>(null);

/** childId → parentId 映射：提交时自动补全父级目录，保证菜单树不断裂 */
const parentMap = computed(() => {
  const map = new Map<string, string>();
  const walk = (nodes: MenuTreeNode[], parent: string | null) => {
    for (const n of nodes) {
      if (parent) map.set(n.id, parent);
      if (n.children?.length) walk(n.children, n.id);
    }
  };
  walk(allMenuTree.value, null);
  return map;
});

async function openAssign(role: Role) {
  currentRole.value = role;
  const detail = await getRoleDetail(role.id);
  assignDialogVisible.value = true;
  await nextTick();
  // check-strictly 下父子解耦：setCheckedKeys 精确回显，不会级联勾上子孙
  menuTreeRef.value?.setCheckedKeys(detail.menus.map((m) => m.id));
}

async function submitAssign() {
  if (!currentRole.value) return;

  // check-strictly 下父子解耦：只取勾选项，再沿树向上补全父级目录（防侧边栏树断裂）
  const checked = menuTreeRef.value!.getCheckedKeys() as string[];
  const ids = new Set<string>(checked);
  for (const id of checked) {
    let p = parentMap.value.get(id);
    while (p && !ids.has(p)) {
      ids.add(p);
      p = parentMap.value.get(p);
    }
  }

  await assignRoleMenus(currentRole.value.id, [...ids]);
  ElMessage.success("权限已更新");
  assignDialogVisible.value = false;
  load();
}

onMounted(load);
</script>

<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>角色管理</span>
          <el-button v-permission="'role:create'" type="primary" @click="openCreate">
            新建角色
          </el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="list" border>
        <el-table-column prop="code" label="编码" width="180" />
        <el-table-column prop="name" label="名称" width="160" />
        <el-table-column prop="description" label="描述" min-width="160" />
        <el-table-column label="内置" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isSystem" type="warning" size="small">内置</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="90" align="center" />
        <el-table-column label="操作" width="240" align="center">
          <template #default="{ row }">
            <el-button v-permission="'role:assign'" link type="primary" @click="openAssign(row as Role)">
              分配权限
            </el-button>
            <el-button v-permission="'role:update'" link type="primary" @click="openEdit(row as Role)">
              编辑
            </el-button>
            <el-button
              v-if="!row.isSystem"
              v-permission="'role:delete'"
              link
              type="danger"
              @click="remove(row as Role)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建/编辑 -->
    <el-dialog v-model="formDialogVisible" :title="isEdit ? '编辑角色' : '新建角色'" width="460px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="编码">
          <el-input v-model="form.code" :disabled="isEdit" placeholder="如 project_manager" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="如 项目经理" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- 分配菜单权限：勾了菜单/按钮节点 = 授予其挂的权限码 -->
    <el-dialog
      v-model="assignDialogVisible"
      :title="`分配权限 - ${currentRole?.name ?? ''}`"
      width="560px"
    >
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="勾选页面 = 可访问该页面；勾选按钮 = 可执行对应操作（方括号内为权限码）。父级勾选不会自动选中子级，保存时会自动带上父级目录。"
        style="margin-bottom: 12px"
      />
      <el-tree
        ref="menuTreeRef"
        :data="menuTreeData"
        show-checkbox
        check-strictly
        node-key="id"
        :props="{ label: 'label', children: 'children' }"
        default-expand-all
      />
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssign">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
