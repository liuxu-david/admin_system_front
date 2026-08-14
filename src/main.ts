import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

import App from "./App.vue";
import router from "./router";
import { vPermission } from "./directives/permission";
import "./styles/index.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(ElementPlus);

// 全局注册所有 Element Plus 图标，供侧边栏 <component :is="icon" /> 使用
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 按钮级权限指令：v-permission="'user:delete'"
app.directive("permission", vPermission);

app.mount("#app");
