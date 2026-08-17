<script setup lang="ts">
import { useRoute } from "vue-router";
import { useAppStore } from "@/stores/app";
import { useUserStore } from "@/stores/user";
import SidebarItem from "./SidebarItem.vue";

const route = useRoute();
const appStore = useAppStore();
const userStore = useUserStore();
</script>

<template>
  <el-scrollbar class="sidebar-scroll">
    <el-menu
      :default-active="route.path"
      :collapse="appStore.sidebarCollapsed"
      :collapse-transition="false"
      router
      unique-opened
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#ffd04b"
    >
      <!-- 首页固定第一项：静态路由，人人都有，不进菜单表 -->
      <el-menu-item index="/dashboard">
        <el-icon><Odometer /></el-icon>
        <template #title>首页</template>
      </el-menu-item>
      <SidebarItem v-for="menu in userStore.menus" :key="menu.id" :item="menu" />
    </el-menu>
  </el-scrollbar>
</template>

<style scoped>
.sidebar-scroll {
  height: 100%;
  background-color: #304156;
}
/* 让滚动容器的内层视图也撑满，el-menu 的深色背景才不会只跟菜单项走 */
.sidebar-scroll :deep(.el-scrollbar__view) {
  min-height: 100%;
}
.el-menu {
  border-right: none;
}
</style>
