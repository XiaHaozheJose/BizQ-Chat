import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import App from "./App.vue";
import type { Plugin } from "vue";
import router from "./router";
import i18n from "./i18n";
import "@/styles/index.scss";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(ElementPlus as unknown as Plugin);
app.use(i18n);

app.mount("#app");
