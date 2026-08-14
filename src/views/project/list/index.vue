<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  createProject,
  deleteProject,
  getProjects,
  type Project,
  updateProject,
} from "@/api/project";

const loading = ref(false);
const list = ref<Project[]>([]);

async function load() {
  loading.value = true;
  try {
    list.value = await getProjects();
  } finally {
    loading.value = false;
  }
}

// ─── 新建/编辑 ───────────────────────────────────
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = reactive({ id: "", name: "", description: "" });

function openCreate() {
  isEdit.value = false;
  Object.assign(form, { id: "", name: "", description: "" });
  dialogVisible.value = true;
}
function openEdit(row: Project) {
  isEdit.value = true;
  Object.assign(form, { id: row.id, name: row.name, description: row.description ?? "" });
  dialogVisible.value = true;
}
async function submitForm() {
  if (isEdit.value) {
    await updateProject(form.id, { name: form.name, description: form.description });
  } else {
    await createProject({ name: form.name, description: form.description });
  }
  ElMessage.success("已保存");
  dialogVisible.value = false;
  load();
}

async function remove(row: Project) {
  await ElMessageBox.confirm(`确认删除项目「${row.name}」？`, "提示", { type: "warning" });
  await deleteProject(row.id);
  ElMessage.success("已删除");
  load();
}

function formatDate(val: string) {
  return val ? new Date(val).toLocaleString() : "";
}

onMounted(load);
</script>

<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>项目列表</span>
          <!-- 只有拥有 project:create 才显示「新增」按钮 -->
          <el-button v-permission="'project:create'" type="primary" @click="openCreate">
            新增项目
          </el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="list" border>
        <el-table-column prop="name" label="名称" min-width="160" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="可见性" width="110" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.visibility }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <el-button
              v-permission="'project:update'"
              link
              type="primary"
              @click="openEdit(row as Project)"
            >
              编辑
            </el-button>
            <el-button
              v-permission="'project:delete'"
              link
              type="danger"
              @click="remove(row as Project)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无项目（按权限码控制的新增/编辑/删除按钮）" />
        </template>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑项目' : '新增项目'" width="480px">
      <el-form :model="form" label-width="70px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
