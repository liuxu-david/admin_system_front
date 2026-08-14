<script setup lang="ts">
import { useAppStore } from "@/stores/app";
import Sidebar from "./Sidebar.vue";
import Navbar from "./Navbar.vue";
import AppMain from "./AppMain.vue";

const appStore = useAppStore();
</script>

<template>
  <div class="app-wrapper">
    <div class="app-sidebar" :class="{ 'is-collapsed': appStore.sidebarCollapsed }">
      <Sidebar />
    </div>
    <div class="app-main-container">
      <Navbar />
      <AppMain />
    </div>
  </div>
</template>
