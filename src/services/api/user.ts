import api from "./auth";
import type { BaseUser, User, Business } from "@/types/user";

// 获取用户详情
export const getUserDetail = async (userId: string): Promise<User> => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

// 获取店铺详情
export const getShopDetail = async (shopId: string): Promise<Business> => {
  const response = await api.get(`/shops/${shopId}`);
  return response.data;
};

// 获取用户或店铺详情
export const getUserOrShopDetail = async (
  id: string,
  isShop: boolean
): Promise<BaseUser> => {
  if (isShop) {
    return getShopDetail(id);
  }
  return getUserDetail(id);
};
