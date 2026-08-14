<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  createMenu,
  deleteMenu,
  getMenuTree,
  updateMenu,
} from "@/api/rbac";
import type { MenuTreeNode, MenuType, MenuStatus } from "@/types/rbac";

const loading = ref(false);
const treeData = ref<MenuTreeNode[]>([]);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const treeRef = ref<any>(null);

async function load() {
  loading.value = true;
  try {
    treeData.value = await getMenuTree();
  } finally {
    loading.value = false;
  }
}

const typeLabel: Record<MenuType, string> = {
  directory: "目录",
  menu: "菜单",
  button: "按钮",
};
const typeTag: Record<MenuType, "primary" | "info" | "warning" | "success"> = {
  directory: "info",
  menu: "success",
  button: "warning",
};

// 父级下拉选项（按钮不能做父级）
const parentOptions = computed(() => {
  const opts: { value: string; label: string }[] = [{ value: "", label: "顶级（无父级）" }];
  const walk = (nodes: MenuTreeNode[], depth: number) => {
    for (const n of nodes) {
      if (n.type !== "button") {
        opts.push({ value: n.id, label: `${"— ".repeat(depth)}${n.name}` });
        walk(n.children ?? [], depth + 1);
      }
    }
  };
  walk(treeData.value, 0);
  return opts;
});

// ─── 新建/编辑 ───────────────────────────────────
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive({
  id: "",
  parentId: "",
  name: "",
  code: "",
  type: "menu" as MenuType,
  path: "",
  component: "",
  redirect: "",
  icon: "",
  permission: "",
  sort: 0,
  visible: true,
  status: "enabled" as MenuStatus,
});

function resetForm() {
  Object.assign(form, {
    id: "",
    parentId: "",
    name: "",
    code: "",
    type: "menu",
    path: "",
    component: "",
    redirect: "",
    icon: "",
    permission: "",
    sort: 0,
    visible: true,
    status: "enabled",
  });
}

function openCreate(parent?: MenuTreeNode) {
  isEdit.value = false;
  resetForm();
  form.parentId = parent?.id ?? "";
  form.type = parent ? "menu" : "directory";
  dialogVisible.value = true;
}

function openEdit(node: MenuTreeNode) {
  isEdit.value = true;
  Object.assign(form, {
    id: node.id,
    parentId: node.parentId ?? "",
    name: node.name,
    code: node.code,
    type: node.type,
    path: node.path ?? "",
    component: node.component ?? "",
    redirect: node.redirect ?? "",
    icon: node.icon ?? "",
    permission: node.permission ?? "",
    sort: node.sort,
    visible: node.visible,
    status: "enabled",
  });
  dialogVisible.value = true;
}

async function submitForm() {
  const payload = {
    parentId: form.parentId || null,
    name: form.name,
    code: form.code,
    type: form.type,
    path: form.path || undefined,
    component: form.component || undefined,
    redirect: form.redirect || undefined,
    icon: form.icon || undefined,
    permission: form.permission || undefined,
    sort: form.sort,
    visible: form.visible,
    status: form.status,
  };
  if (isEdit.value) {
    await updateMenu(form.id, payload);
  } else {
    await createMenu(payload);
  }
  ElMessage.success("已保存");
  dialogVisible.value = false;
  load();
}

async function remove(node: MenuTreeNode) {
  await ElMessageBox.confirm(`确认删除菜单「${node.name}」？子菜单会挂到其父级。`, "提示", {
    type: "warning",
  });
  await deleteMenu(node.id);
  ElMessage.success("已删除");
  load();
}

// ─── 拖拽排序 ─────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isDescendant(maybeParent: any, node: any): boolean {
  let p = node.parent;
  while (p) {
    if (p === maybeParent) return true;
    p = p.parent;
  }
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function allowDrop(_draggingNode: any, dropNode: any, type: string): boolean {
  // 不允许拖进自己的后代（避免环）
  if (type === "inner") {
    return !isDescendant(_draggingNode, dropNode);
  }
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function onDrop(draggingNode: any, dropNode: any, dropType: string) {
  // 计算新父级 id
  let newParentId: string | null;
  if (dropType === "inner") {
    newParentId = (dropNode.data as MenuTreeNode).id;
  } else {
    newParentId =
      dropNode.parent && dropNode.parent.level > 0
        ? (dropNode.parent.data as MenuTreeNode).id
        : null;
  }
  // 新的兄弟节点顺序（el-tree 已更新 draggingNode.parent.childNodes）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const siblings: MenuTreeNode[] = draggingNode.parent?.childNodes?.map((n: any) => n.data) ?? [];
  // 回写 sort + 受影响节点的 parentId
  await Promise.all(
    siblings.map((s, idx) => {
      const patch: { sort: number; parentId?: string | null } = { sort: idx };
      if ((s.parentId ?? null) !== (newParentId ?? null)) patch.parentId = newParentId;
      return updateMenu(s.id, patch);
    }),
  );
  ElMessage.success("已调整顺序");
  load();
}

onMounted(load);
</script>

<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>菜单管理（可拖拽排序）</span>
          <el-button v-permission="'menu:create'" type="primary" @click="openCreate()">
            新建顶级菜单
          </el-button>
        </div>
      </template>

      <el-tree
        ref="treeRef"
        v-loading="loading"
        :data="treeData"
        node-key="id"
        draggable
        :expand-on-click-node="false"
        default-expand-all
        :allow-drop="allowDrop"
        @node-drop="onDrop"
      >
        <template #default="{ data }">
          <div class="menu-node">
            <span class="menu-node-title">
              <el-tag size="small" :type="typeTag[data.type as MenuType]">{{ typeLabel[data.type as MenuType] }}</el-tag>
              <span class="name">{{ data.name }}</span>
              <span class="code">{{ data.code }}</span>
              <span v-if="data.path" class="path">{{ data.path }}</span>
              <span v-if="data.permission" class="perm">{{ data.permission }}</span>
            </span>
            <span class="menu-node-actions" @click.stop>
              <el-button
                v-if="data.type !== 'button'"
                v-permission="'menu:create'"
                link
                type="primary"
                @click="openCreate(data)"
              >
                新增子级
              </el-button>
              <el-button v-permission="'menu:update'" link type="primary" @click="openEdit(data)">
                编辑
              </el-button>
              <el-button v-permission="'menu:delete'" link type="danger" @click="remove(data)">
                删除
              </el-button>
            </span>
          </div>
        </template>
      </el-tree>
    </el-card>

    <!-- 新建/编辑 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑菜单' : '新建菜单'" width="560px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="父级菜单">
          <el-select v-model="form.parentId" placeholder="顶级" clearable style="width: 100%">
            <el-option
              v-for="o in parentOptions"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.type">
            <el-radio value="directory">目录</el-radio>
            <el-radio value="menu">菜单</el-radio>
            <el-radio value="button">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="编码"><el-input v-model="form.code" placeholder="如 system:user" /></el-form-item>
        <template v-if="form.type === 'menu'">
          <el-form-item label="路由路径">
            <el-input v-model="form.path" placeholder="/system/user" />
          </el-form-item>
          <el-form-item label="组件路径">
            <el-input v-model="form.component" placeholder="system/user/index" />
          </el-form-item>
        </template>
        <el-form-item v-if="form.type === 'directory'" label="重定向">
          <el-input v-model="form.redirect" placeholder="/system/user" />
        </el-form-item>
        <el-form-item v-if="form.type !== 'button'" label="图标">
          <el-input v-model="form.icon" placeholder="如 Setting（Element Plus 图标名）" />
        </el-form-item>
        <el-form-item v-if="form.type === 'button'" label="权限码">
          <el-input v-model="form.permission" placeholder="如 user:delete" />
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
        <el-form-item label="是否可见">
          <el-switch v-model="form.visible" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="form.status"
            active-value="enabled"
            inactive-value="disabled"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.menu-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px;
}
.menu-node-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.menu-node-title .name {
  font-weight: 500;
}
.menu-node-title .code,
.menu-node-title .path {
  color: #909399;
  font-size: 12px;
}
.menu-node-title .perm {
  color: #e6a23c;
  font-size: 12px;
}
.menu-node-actions {
  display: none;
}
:deep(.el-tree-node__content:hover) .menu-node-actions {
  display: inline;
}
</style>
