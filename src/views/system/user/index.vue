<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { assignUserRoles, getRoles, getUsers, updateUserStatus } from "@/api/rbac";
import { usePermission } from "@/composables/usePermission";
import type { Role, UserWithRoles } from "@/types/rbac";

const { has } = usePermission();
const loading = ref(false);
const list = ref<UserWithRoles[]>([]);
const allRoles = ref<Role[]>([]);

const dialogVisible = ref(false);
const currentUser = ref<UserWithRoles | null>(null);
const checkedRoleIds = ref<string[]>([]);

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

function openAssign(row: UserWithRoles) {
  currentUser.value = row;
  checkedRoleIds.value = row.roles.map((r) => r.id);
  dialogVisible.value = true;
}

async function submitAssign() {
  if (!currentUser.value) return;
  await assignUserRoles(currentUser.value.id, checkedRoleIds.value);
  ElMessage.success("角色已更新");
  dialogVisible.value = false;
  load();
}

function formatDate(val: string) {
  return val ? new Date(val).toLocaleString() : "";
}

onMounted(load);
</script>

<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <span>用户管理</span>
      </template>
      <el-table v-loading="loading" :data="list" border>
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column label="角色" min-width="160">
          <template #default="{ row }">
            <el-tag
              v-for="r in row.roles"
              :key="r.id"
              size="small"
              style="margin-right: 4px"
            >
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
        <el-table-column label="操作" width="130" align="center">
          <template #default="{ row }">
            <el-button
              v-permission="'user:assign-role'"
              link
              type="primary"
              @click="openAssign(row as UserWithRoles)"
            >
              分配角色
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="分配角色" width="440px">
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
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssign">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
