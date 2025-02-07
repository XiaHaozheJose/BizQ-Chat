import { User, Business, UserType } from "./index";

// API 通用响应格式
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 登录请求参数
export interface LoginParams {
  phone: string;
  areaCode: string;
  platform: string;
  type: string;
  password: string;
}

// 登录响应
export interface LoginResponse {
  token: string;
}

// 用户信息响应
export interface UserInfo {
  operator: {
    type: UserType;
    id: string;
    platform: string;
    payload: {
      app?: {
        lastLoginTimeStamp: number;
      };
      web?: {
        lastLoginTimeStamp: number;
      };
      areaCode: string;
      phone: string;
      data: User | Business;
    };
  };
}

// 商家列表响应
export interface ShopsListResponse {
  count: number;
  currentPageHasMoreData: boolean;
  shops: Business[];
}

// 切换账号请求参数
export interface SwitchOperatorParams {
  type: UserType;
  id: string;
}
