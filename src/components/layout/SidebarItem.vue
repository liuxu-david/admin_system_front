<script setup lang="ts">
import { computed } from "vue";
import type { MenuTreeNode } from "@/types/rbac";

defineOptions({ name: "SidebarItem" });

const props = defineProps<{ item: MenuTreeNode }>();

/** 只渲染非按钮 + visible 的子节点 */
const visibleChildren = computed(
  () => props.item.children?.filter((c) => c.type !== "button" && c.visible) ?? [],
);
</script>

<template>
  <!-- 有可见子节点：可展开子菜单 -->
  <el-sub-menu v-if="visibleChildren.length" :index="item.path || item.code">
    <template #title>
      <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
      <span>{{ item.name }}</span>
    </template>
    <SidebarItem
      v-for="child in visibleChildren"
      :key="child.id"
      :item="child"
    />
  </el-sub-menu>

  <!-- 叶子菜单 -->
  <el-menu-item v-else :index="item.path || ''">
    <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
    <template #title>{{ item.name }}</template>
  </el-menu-item>
</template>
