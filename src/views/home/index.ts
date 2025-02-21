import { RouteRecordRaw } from "vue-router";

export const homeView: RouteRecordRaw = {
  path: "/",
  name: "home",
  component: () => import("@/views/home/index.vue"),
  meta: { requiresAuth: true },
};
