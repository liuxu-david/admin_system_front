<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { ArrowDown } from "@element-plus/icons-vue";
import { useTabsStore } from "@/stores/tabs";

const route = useRoute();
const router = useRouter();
const tabsStore = useTabsStore();

function isActive(path: string): boolean {
  return route.path === path;
}

function handleClick(path: string): void {
  if (route.path !== path) router.push(path);
}

function handleClose(path: string): void {
  const wasActive = route.path === path;
  const next = tabsStore.removeTab(path);
  if (wasActive && next && next !== route.path) router.push(next);
}

function handleCommand(cmd: string): void {
  if (cmd === "others") {
    tabsStore.closeOthers(route.path);
  } else if (cmd === "all") {
    tabsStore.closeAll();
    const affix = tabsStore.tabs[0]?.path ?? "/dashboard";
    if (route.path !== affix) router.push(affix);
  }
}
</script>

<template>
  <div class="tabs-view">
    <div class="tabs-scroll">
      <el-tag
        v-for="tab in tabsStore.tabs"
        :key="tab.path"
        :closable="!tabsStore.isAffix(tab.path)"
        :effect="isActive(tab.path) ? 'dark' : 'plain'"
        class="tabs-tag"
        @click="handleClick(tab.path)"
        @close="handleClose(tab.path)"
      >
        {{ tab.title }}
      </el-tag>
    </div>

    <el-dropdown @command="handleCommand">
      <span class="tabs-action">
        <el-icon><ArrowDown /></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="others">关闭其他</el-dropdown-item>
          <el-dropdown-item command="all">关闭全部</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped>
.tabs-view {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 5px 12px;
}
.tabs-scroll {
  display: flex;
  gap: 6px;
  flex: 1;
  overflow-x: auto;
}
.tabs-scroll::-webkit-scrollbar {
  height: 3px;
}
.tabs-tag {
  cursor: pointer;
  flex-shrink: 0;
  user-select: none;
}
.tabs-action {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #606266;
  outline: none;
  padding: 2px;
}
</style>
