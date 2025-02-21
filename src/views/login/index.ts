import { RouteRecordRaw } from "vue-router";

export const loginView: RouteRecordRaw = {
  path: "/login",
  name: "login",
  component: () => import("@/views/login/index.vue"),
  meta: { requiresAuth: false },
};
