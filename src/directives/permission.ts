import type { Directive, DirectiveBinding } from "vue";

import { useUserStore } from "@/stores/user";

type Mode = "any" | "all";
type Value = string | string[] | { value: string | string[]; mode?: Mode };

/** 核心判断：当前用户是否拥有所需权限 */
export function checkPermission(value: string | string[], mode: Mode = "any"): boolean {
  const { permissions } = useUserStore();
  const required = Array.isArray(value) ? value : [value];
  if (required.length === 0) return true;
  return mode === "all"
    ? required.every((c) => permissions.includes(c))
    : required.some((c) => permissions.includes(c));
}

function normalize(raw: Value): { value: string[]; mode: Mode } {
  if (typeof raw === "string") return { value: [raw], mode: "any" };
  if (Array.isArray(raw)) return { value: raw, mode: "any" };
  return {
    value: Array.isArray(raw.value) ? raw.value : [raw.value],
    mode: raw.mode ?? "any",
  };
}

/**
 * v-permission 指令：无权限直接从 DOM 移除元素。
 * @example
 *   v-permission="'user:delete'"
 *   v-permission="['user:update','user:delete']"            // 任一即可
 *   v-permission="{ value: ['a','b'], mode: 'all' }"        // 必须同时拥有
 */
export const vPermission: Directive<HTMLElement, Value> = {
  mounted(el, binding: DirectiveBinding<Value>) {
    const { value, mode } = normalize(binding.value);
    if (!checkPermission(value, mode)) {
      el.parentNode?.removeChild(el);
    }
  },
};
