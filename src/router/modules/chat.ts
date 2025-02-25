import type { RouteRecordRaw } from "vue-router";

const chatRoutes: RouteRecordRaw = {
  path: "/chat",
  redirect: "/chat/index",
  meta: {
    title: "聊天",
    icon: "chat",
    requiresAuth: true,
  },
  children: [
    {
      path: "index",
      name: "chat",
      component: () => import("@/views/chat/index.vue"),
      meta: {
        title: "聊天",
        icon: "chat",
        requiresAuth: true,
        keepAlive: true,
      },
    },
  ],
};

export default chatRoutes;
