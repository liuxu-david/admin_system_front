<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import {
  assignUserRoles,
  createUser,
  deleteUser,
  getRoles,
  getUsers,
  updateUser,
  updateUserStatus,
} from "@/api/rbac";
import { useUserStore } from "@/stores/user";
import { usePermission } from "@/composables/usePermission";
import type { Role, UserWithRoles } from "@/types/rbac";

const { has } = usePermission();
const userStore = useUserStore();

const loading = ref(false);
const list = ref<UserWithRoles[]>([]);
const allRoles = ref<Role[]>([]);

async function load() {
  loading.value = true;
  try {
    const [users, roles] = await Promise.all([getUsers(), getRoles()]);
    list.value = users;
    allRoles.value = roles;
  } finally {
    loading.value = false;
  }
}

async function toggleStatus(row: UserWithRoles) {
  const next = row.status === "active" ? "inactive" : "active";
  try {
    await updateUserStatus(row.id, next);
    row.status = next;
    ElMessage.success("状态已更新");
  } catch {
    // 拦截器已提示
  }
}

function formatDate(val: string) {
  return val ? new Date(val).toLocaleString() : "";
}

// ─── 新增 / 编辑 ───────────────────────────────────
const formDialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const form = reactive({ id: "", email: "", nickname: "", password: "" });

const PWD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;
const rules = computed<FormRules>(() => ({
  email: [{ required: true, message: "请输入账号", trigger: "blur" }],
  password: isEdit.value
    ? [{ pattern: PWD_PATTERN, message: "密码需≥8位且含大写、小写和数字", trigger: "blur" }]
    : [
        { required: true, message: "请输入密码", trigger: "blur" },
        { pattern: PWD_PATTERN, message: "密码需≥8位且含大写、小写和数字", trigger: "blur" },
      ],
}));

function openCreate() {
  isEdit.value = false;
  Object.assign(form, { id: "", email: "", nickname: "", password: "" });
  formDialogVisible.value = true;
}
function openEdit(row: UserWithRoles) {
  isEdit.value = true;
  Object.assign(form, { id: row.id, email: row.email, nickname: row.nickname ?? "", password: "" });
  formDialogVisible.value = true;
}
async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (isEdit.value) {
    await updateUser(form.id, {
      email: form.email,
      nickname: form.nickname,
      ...(form.password ? { password: form.password } : {}),
    });
  } else {
    await createUser({
      email: form.email,
      nickname: form.nickname || undefined,
      password: form.password,
    });
  }
  ElMessage.success("已保存");
  formDialogVisible.value = false;
  load();
}

async function remove(row: UserWithRoles) {
  if (row.id === userStore.userInfo?.id) {
    ElMessage.warning("不能删除当前登录账号");
    return;
  }
  await ElMessageBox.confirm(`确认删除用户「${row.email}」？`, "提示", { type: "warning" });
  await deleteUser(row.id);
  ElMessage.success("已删除");
  load();
}

// ─── 分配角色 ──────────────────────────────────────
const assignVisible = ref(false);
const currentUser = ref<UserWithRoles | null>(null);
const checkedRoleIds = ref<string[]>([]);

function openAssign(row: UserWithRoles) {
  currentUser.value = row;
  checkedRoleIds.value = row.roles.map((r) => r.id);
  assignVisible.value = true;
}
async function submitAssign() {
  if (!currentUser.value) return;
  await assignUserRoles(currentUser.value.id, checkedRoleIds.value);
  ElMessage.success("角色已更新");
  assignVisible.value = false;
  load();
}

onMounted(load);
</script>

<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>用户管理</span>
          <el-button v-permission="'user:create'" type="primary" @click="openCreate">
            新增用户
          </el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="list" border>
        <el-table-column prop="email" label="账号" min-width="160" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column label="角色" min-width="160">
          <template #default="{ row }">
            <el-tag v-for="r in row.roles" :key="r.id" size="small" style="margin-right: 4px">
              {{ r.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-switch
              v-permission="'user:update'"
              :model-value="row.status === 'active'"
              @change="toggleStatus(row as UserWithRoles)"
            />
            <span v-if="!has('user:update')" style="color: #909399">
              {{ row.status === "active" ? "正常" : "停用" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center">
          <template #default="{ row }">
            <el-button
              v-permission="'user:update'"
              link
              type="primary"
              @click="openEdit(row as UserWithRoles)"
            >
              编辑
            </el-button>
            <el-button
              v-permission="'user:assign-role'"
              link
              type="primary"
              @click="openAssign(row as UserWithRoles)"
            >
              分配角色
            </el-button>
            <el-button
              v-if="row.id !== userStore.userInfo?.id"
              v-permission="'user:delete'"
              link
              type="danger"
              @click="remove(row as UserWithRoles)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑 -->
    <el-dialog v-model="formDialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="460px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="账号" prop="email">
          <el-input v-model="form.email" placeholder="邮箱或用户名，如 zhangsan" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            :placeholder="isEdit ? '留空则不修改' : '至少8位，须含大写、小写和数字'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- 分配角色 -->
    <el-dialog v-model="assignVisible" title="分配角色" width="440px">
      <el-checkbox-group v-model="checkedRoleIds">
        <el-checkbox
          v-for="r in allRoles"
          :key="r.id"
          :value="r.id"
          style="display: block; margin: 8px 0"
        >
          {{ r.name }}
          <span style="color: #909399; font-size: 12px">（{{ r.code }}）</span>
        </el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssign">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
