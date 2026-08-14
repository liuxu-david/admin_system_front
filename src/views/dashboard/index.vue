<script setup lang="ts">
import { computed } from "vue";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const displayName = computed(
  () => userStore.userInfo?.nickname || userStore.userInfo?.email || "用户",
);
</script>

<template>
  <div class="dashboard">
    <el-card shadow="never">
      <h2>你好，{{ displayName }} 👋</h2>
      <p style="color: #909399">欢迎使用 RBAC 权限管理系统后台。</p>
    </el-card>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-label">角色</div>
          <div class="stat-value">{{ userStore.roles.length }}</div>
          <div class="stat-tags">
            <el-tag v-for="r in userStore.roles" :key="r" type="success" size="small">{{ r }}</el-tag>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-label">权限点</div>
          <div class="stat-value">{{ userStore.permissions.length }}</div>
          <div class="stat-foot">控制按钮/操作的显隐</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat-label">菜单</div>
          <div class="stat-value">{{ userStore.menus.length }}</div>
          <div class="stat-foot">动态生成路由与侧边栏</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.stat-label {
  color: #909399;
  font-size: 14px;
}
.stat-value {
  font-size: 32px;
  font-weight: 600;
  margin: 8px 0;
}
.stat-foot {
  color: #c0c4cc;
  font-size: 12px;
}
.stat-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
</style>
