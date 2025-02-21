import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { useUserStore } from "@/store/user";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("@/views/HomeView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/LoginView.vue"),
    meta: { requiresAuth: false },
  },
];

// 检测是否在Electron环境中
const isElectron = window.electronAPI !== undefined;

const router = createRouter({
  // 在Electron环境使用hash模式,Web环境使用history模式
  history: isElectron ? createWebHashHistory() : createWebHistory(),
  routes,
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
});

// 导航错误处理
router.onError((error) => {
  console.error("[Router] Navigation error:", error);
});

export default router;
