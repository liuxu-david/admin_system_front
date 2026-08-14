<script setup lang="ts">
import { computed } from "vue";
import { useUserStore } from "@/stores/user";

const props = withDefaults(
  defineProps<{
    code: string | string[];
    mode?: "any" | "all";
    /** true=不满足时渲染 #disabled 插槽（置灰）而非隐藏 */
    disabled?: boolean;
  }>(),
  { mode: "any", disabled: false },
);

const userStore = useUserStore();
const ok = computed(() => {
  const required = Array.isArray(props.code) ? props.code : [props.code];
  return props.mode === "all"
    ? required.every((c) => userStore.permissions.includes(c))
    : required.some((c) => userStore.permissions.includes(c));
});
</script>

<template>
  <slot v-if="ok" />
  <slot v-else-if="disabled" name="disabled" />
</template>
