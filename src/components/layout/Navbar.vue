<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { CaretBottom, Expand, Fold, UserFilled } from "@element-plus/icons-vue";
import { useAppStore } from "@/stores/app";
import { useUserStore } from "@/stores/user";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const userStore = useUserStore();

async function handleLogout() {
  await ElMessageBox.confirm("确定要退出登录吗？", "提示", { type: "warning" });
  await userStore.logout();
}

function handleCommand(command: string) {
  if (command === "logout") handleLogout();
}
</script>

<template>
  <div class="navbar">
    <div class="navbar-left">
      <el-icon class="hamburger" @click="appStore.toggleSidebar()">
        <Fold v-if="!appStore.sidebarCollapsed" />
        <Expand v-else />
      </el-icon>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-if="route.meta.title && route.path !== '/dashboard'">
          {{ route.meta.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="navbar-right">
      <el-dropdown @command="handleCommand">
        <span class="user-info">
          <el-avatar :size="28" :icon="UserFilled" />
          <span class="nickname">
            {{ userStore.userInfo?.nickname || userStore.userInfo?.email || "用户" }}
          </span>
          <el-icon><CaretBottom /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style scoped>
.navbar {
  height: var(--navbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}
.navbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.hamburger {
  font-size: 20px;
  cursor: pointer;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  outline: none;
}
.nickname {
  font-size: 14px;
}
</style>
