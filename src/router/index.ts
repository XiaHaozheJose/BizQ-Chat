import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { useUserStore } from "@/store/user";
import Layout from "@/layout/index.vue";

// 基础路由
const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      title: "登录",
      requiresAuth: false,
    },
  },
  {
    path: "/",
    component: Layout,
    redirect: "/chat",
    children: [
      {
        path: "chat/:id?",
        name: "chat",
        component: () => import("@/views/chat/index.vue"),
        meta: {
          title: "聊天",
          icon: "chat",
          requiresAuth: true,
        },
      },
      {
        path: "contacts/:id?",
        name: "contacts",
        component: () => import("@/views/contacts/index.vue"),
        meta: {
          title: "联系人",
          icon: "contacts",
          requiresAuth: true,
        },
      },
      {
        path: "circle",
        name: "circle",
        component: () => import("@/views/circle/index.vue"),
        meta: {
          title: "圈子",
          icon: "circle",
          requiresAuth: true,
        },
      },
      {
        path: "order",
        name: "order",
        component: () => import("@/views/order/OrderLayout.vue"),
        meta: {
          title: "订单管理",
          icon: "order",
          requiresAuth: true,
        },
        children: [
          {
            path: "",
            redirect: "/order/my",
          },
          {
            path: "my",
            component: () => import("@/views/order/MyOrders.vue"),
            meta: {
              title: "我的订单",
            },
          },
          {
            path: "customer",
            component: () => import("@/views/order/CustomerOrders.vue"),
            meta: {
              title: "客户订单",
            },
          },
        ],
      },
    ],
    meta: {
      requiresAuth: true,
    },
  },
];

// 合并所有路由
const routes = constantRoutes;

// 检测是否在Electron环境中
const isElectron = window.electronAPI !== undefined;

const router = createRouter({
  // 在Electron环境使用hash模式,Web环境使用history模式
  history: isElectron ? createWebHashHistory() : createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的位置,使用保存的位置
    if (savedPosition) {
      return savedPosition;
    }
    // 否则保持当前位置
    return { left: 0, top: 0 };
  },
});

// 全局导航守卫
router.beforeEach(async (to, from, next) => {
  console.log("[Router] Navigation started:", {
    to: to.fullPath,
    from: from.fullPath,
    isElectron,
  });

  const userStore = useUserStore();
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  // 确保 store 已初始化
  if (!userStore.initialized) {
    console.log("[Router] Initializing user store...");
    try {
      await userStore.initialize();
      // 如果有token但没有用户信息,加载用户信息
      if (userStore.token && !userStore.currentUser) {
        await userStore.loadUserInfo();
      }
      console.log("[Router] User store initialized successfully");
    } catch (error) {
      console.error("[Router] Failed to initialize user store:", error);
      next({ path: "/login" });
      return;
    }
  }

  // 如果已登录且访问登录页,重定向到首页
  if (to.path === "/login" && userStore.isAuthenticated) {
    console.log("[Router] Redirecting authenticated user from login to home");
    next({ path: "/" });
    return;
  }

  // 如果需要认证但未登录,重定向到登录页
  if (requiresAuth && !userStore.isAuthenticated) {
    console.log("[Router] Redirecting unauthenticated user to login");
    next({
      path: "/login",
      query: { redirect: to.fullPath },
    });
    return;
  }

  // 在Electron环境中处理导航
  if (isElectron && window.electronAPI) {
    try {
      // 只处理完整URL导航,让Vue Router处理hash导航
      if (!to.fullPath.startsWith("/") && !to.fullPath.startsWith("#")) {
        console.log("[Router] Handling Electron navigation for external URL");
        const success = await window.electronAPI.navigation.navigate(
          to.fullPath
        );
        if (!success) {
          console.error("[Router] Electron navigation failed");
          next(false);
          return;
        }
      }
    } catch (error) {
      console.error("[Router] Failed to navigate in Electron:", error);
      next(false);
      return;
    }
  }

  console.log("[Router] Navigation proceeding normally");
  next();
});

// 导航完成后的处理
router.afterEach((to) => {
  console.log("[Router] Navigation completed:", to.fullPath);
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - BizQ Chat`;
  }
});

// 导航错误处理
router.onError((error) => {
  console.error("[Router] Navigation error:", error);
});

export default router;
