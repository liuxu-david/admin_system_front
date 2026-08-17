# 开发约定（新增页面 / 菜单 / 按钮 checklist）

> 新功能动手前读。按 checklist 走，别即兴发挥。

## 新增一个页面（完整链路）

1. **建视图文件**：`src/views/<目录>/<页面>/index.vue`，记住这个相对路径（如 `report/list/index`）。页面骨架照抄现有管理页（el-card + el-table + 弹窗表单）。
2. **后端加菜单**（菜单管理页或 seed 的 MENU_TREE）：
   - 菜单节点：`type=menu`，`path=/report/list`，`component=report/list/index`（**与文件路径一字不差**），`code` 唯一（如 `report:list`），`permission=页面查询权限码`（如 `report:read`，勾了页面 = 能调它的查询接口）
   - 按钮节点：挂在菜单下，`type=button`，`permission=操作权限码`（如 `report:export`）
   - 权限码一律从下拉里选（数据来自后端权限字典），别手打
3. **后端加权限点**：seed `PERMISSIONS` 登记 + Controller 挂 `@RequirePermissions`（详见后端仓库 docs/rbac.md）。
4. **给角色勾上新菜单/按钮**（角色管理 → 分配权限，一棵树勾到底），刷新浏览器生效。
5. 页面内按钮挂权限：
   ```vue
   <el-button v-permission="'report:export'">导出</el-button>
   ```

## 页面骨架模板

```vue
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
// api + types + usePermission 按需引入
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span>页面标题</span>
        <el-button v-permission="'xxx:create'" type="primary">新增</el-button>
      </div>
    </template>
    <el-table :data="list" v-loading="loading" border> ... </el-table>
  </el-card>
</template>
```

## 代码约定

- 一律 `<script setup lang="ts">`；组件名多词（SidebarItem），页面目录 kebab-case
- el-table 插槽的 `row` 是 `DefaultRow` 类型，传给函数要 `row as XxxType` 断言
- 接口调用放 `src/api/`（一个域一个文件），类型放 `src/types/`，页面里不写 axios
- 时间格式化等工具内联即可，别提前抽象
- 权限判断优先 `v-permission`；JS 逻辑里才用 `usePermission().has()`；需要"置灰而非隐藏"用 `<HasPermission disabled>`

## 提交前自查

```bash
pnpm type-check        # vue-tsc 必须干净
pnpm build             # 构建验证（CI 同款）
```
