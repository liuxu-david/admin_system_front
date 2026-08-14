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
      <SidebarItem v-for="menu in userStore.menus" :key="menu.id" :item="menu" />
    </el-menu>
  </el-scrollbar>
</template>

<style scoped>
.sidebar-scroll {
  height: 100%;
}
.el-menu {
  border-right: none;
  min-height: 100%;
}
</style>
