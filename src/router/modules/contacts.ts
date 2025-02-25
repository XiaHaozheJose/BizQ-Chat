import type { RouteRecordRaw } from "vue-router";

const contactsRoutes: RouteRecordRaw = {
  path: "/contacts",
  redirect: "/contacts/index",
  meta: {
    title: "联系人",
    icon: "contacts",
    requiresAuth: true,
  },
  children: [
    {
      path: "index",
      name: "contacts",
      component: () => import("@/views/contacts/index.vue"),
      meta: {
        title: "联系人",
        icon: "contacts",
        requiresAuth: true,
        keepAlive: true,
      },
    },
  ],
};

export default contactsRoutes;
