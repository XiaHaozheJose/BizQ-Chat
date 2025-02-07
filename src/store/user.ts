import { defineStore } from "pinia";
import { ref } from "vue";
import type { User, Business, UserType } from "@/types";
import type { LoginParams, UserInfo } from "@/types/api";
import {
  login as loginApi,
  getUserInfo,
  getShopsList,
  switchOperator,
} from "@/services/api/auth";

export const useUserStore = defineStore("user", () => {
  const currentUser = ref<User | Business | null>(null);
  const originalUser = ref<User | null>(null);
  const token = ref<string | null>(null);
  const shopsList = ref<Business[]>([]);
  const loading = ref(false);

  // 初始化状态
  const initialize = () => {
    const savedToken = localStorage.getItem("token");
    const savedOriginalUser = localStorage.getItem("originalUser");

    if (savedOriginalUser) {
      originalUser.value = JSON.parse(savedOriginalUser);
    }

    if (savedToken) {
      token.value = savedToken;
      loadUserInfo(); // 加载用户信息
    }
  };

  // 设置用户和Token
  const setUserAndToken = (tokenValue: string) => {
    token.value = tokenValue;
    localStorage.setItem("token", tokenValue);
  };

  // 设置原始用户信息
  const setOriginalUser = (user: User) => {
    originalUser.value = user;
    localStorage.setItem("originalUser", JSON.stringify(user));
  };

  // 登录
  const login = async (credentials: LoginParams) => {
    try {
      loading.value = true;
      const response = await loginApi(credentials);
      setUserAndToken(response.token);
      await loadUserInfo();
      return true;
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

      // 设置商家标识
      if (operator.type === "shop" || userData.operatorType === "shop") {
        userData.isShop = true;
      }

      currentUser.value = userData;

      // 如果是普通用户，保存为原始用户并加载商家列表
      if (operator.type === "user") {
        setOriginalUser(userData as User);
        await loadShopsList(operator.id);
      }
    } finally {
      loading.value = false;
    }
  };

  // 加载商家列表
  const loadShopsList = async (ownerId: string) => {
    try {
      const response = await getShopsList(ownerId);
      // 设置商家标识
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
      const response = await switchOperator({ type, id });
      setUserAndToken(response.token);
      await loadUserInfo();
      return true;
    } finally {
      loading.value = false;
    }
  };

  // 登出
  const logout = () => {
    token.value = null;
    currentUser.value = null;
    originalUser.value = null;
    shopsList.value = [];
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
    initialize,
    login,
    logout,
    loadUserInfo,
    switchAccount,
  };
});
