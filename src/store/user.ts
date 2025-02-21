import { defineStore } from "pinia";
import { ref, nextTick, computed } from "vue";
import type { User, Business } from "@/types";
import { UserType } from "@/types";
import type { LoginParams } from "@/types/api";
import {
  login as loginApi,
  getUserInfo,
  getShopsList,
  switchOperator,
} from "@/services/api/auth";
import { useChatStore } from "./chat";
import { useContactStore } from "./contact";
import { initializeFileServices } from "@/services/file";

export const useUserStore = defineStore("user", () => {
  const currentUser = ref<User | Business | null>(null);
  const originalUser = ref<User | null>(null);
  const token = ref<string | null>(null);
  const shopsList = ref<Business[]>([]);
  const loading = ref(false);
  const initialized = ref(false);

  const isAuthenticated = computed(() => {
    return !!token.value && !!currentUser.value;
  });

  // 初始化状态
  const initialize = async () => {
    try {
      const savedToken = localStorage.getItem("token");
      const savedOriginalUser = localStorage.getItem("originalUser");

      if (savedOriginalUser) {
        originalUser.value = JSON.parse(savedOriginalUser);
      }

      if (savedToken) {
        token.value = savedToken;
        await loadUserInfo(); // 加载用户信息
      }
    } finally {
      initialized.value = true;
    }
  };

  // 设置用户和Token
  const setUserAndToken = (tokenValue: string) => {
    if (!tokenValue) {
      console.error("Cannot set empty token");
      return;
    }
    token.value = tokenValue;
    localStorage.setItem("token", tokenValue);
  };

  // 设置原始用户信息
  const setOriginalUser = (user: User) => {
    originalUser.value = user;
    localStorage.setItem("originalUser", JSON.stringify(user));
  };

  // 清除所有状态
  const clearAllStates = () => {
    token.value = null;
    currentUser.value = null;
    initialized.value = false;
  };

  // 登录
  const login = async (loginParams: LoginParams): Promise<boolean> => {
    try {
      loading.value = true;
      const response = await loginApi(loginParams);
      const tokenValue = response.token;

      if (!tokenValue) {
        console.error("Login failed: Empty token received");
        return false;
      }

      // 设置用户信息和token
      setUserAndToken(tokenValue);

      // 加载用户信息
      await loadUserInfo();

      return true;
    } catch (error) {
      console.error("Login error:", error);
      // 清除所有状态
      clearAllStates();
      // 移除token
      localStorage.removeItem("token");
      return false;
    } finally {
      loading.value = false;
    }
  };

  // 加载用户信息
  const loadUserInfo = async () => {
    try {
      loading.value = true;
      const response = await getUserInfo();
      const { operator } = response;
      const userData = operator.payload.data;

      if (operator.type === "shop") {
        // 商家用户
        currentUser.value = {
          ...userData,
          isShop: true,
          operatorType: UserType.Shop,
        } as Business;
      } else {
        // 普通用户
        const user = {
          ...userData,
          isShop: false,
          operatorType: UserType.User,
        } as User;

        currentUser.value = user;
        setOriginalUser(user);

        // 如果没有 myshops 数据，则加载商家列表
        if (!user.myshops?.length) {
          await loadShopsList(user.id);
        } else {
          shopsList.value = user.myshops.map((shop: Business) => ({
            ...shop,
            isShop: true,
          }));
        }
      }

      // Initialize file services after user info is loaded
      await initializeFileServices(currentUser.value.id);
    } catch (error) {
      console.error("Failed to load user info:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 加载商家列表
  const loadShopsList = async (ownerId: string) => {
    try {
      const response = await getShopsList(ownerId);
      shopsList.value = response.shops.map((shop) => ({
        ...shop,
        isShop: true,
      }));
    } catch (error) {
      console.error("Failed to load shops list:", error);
      shopsList.value = [];
    }
  };

  // 切换账号
  const switchAccount = async (type: UserType, id: string) => {
    try {
      loading.value = true;

      // 1. 获取新token
      const response = await switchOperator({ type, id });

      // 2. 关闭当前用户的数据库连接
      // 注意:这里只是关闭连接,不删除数据,以便将来可以重新加载
      const chatStore = useChatStore();
      const contactStore = useContactStore();
      await Promise.all([chatStore.cleanup?.(), contactStore.cleanup?.()]);

      // 3. 设置新token并加载新用户
      setUserAndToken(response.token);
      await loadUserInfo();

      // 4. 初始化新用户的stores
      // 这里会自动连接到新用户的数据库
      await Promise.all([chatStore.initialize(), contactStore.initialize()]);

      return true;
    } catch (error) {
      console.error("Failed to switch account:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 清理所有数据
  const cleanup = async () => {
    currentUser.value = null;
    shopsList.value = [];

    // 清理本地存储
    localStorage.removeItem("user");

    // 清理文件服务
    const { generalFileService, audioFileService } = await import(
      "@/services/file"
    );
    await Promise.all([
      generalFileService.clearAllFiles(),
      audioFileService.clearAllFiles(),
    ]);
  };

  // 登出
  const logout = async () => {
    await cleanup();
    token.value = null;
    originalUser.value = null;
    localStorage.removeItem("token");
    localStorage.removeItem("originalUser");
    localStorage.removeItem("user");
  };

  return {
    currentUser,
    originalUser,
    token,
    shopsList,
    loading,
    initialized,
    initialize,
    login,
    logout,
    loadUserInfo,
    switchAccount,
    isAuthenticated,
  };
});
