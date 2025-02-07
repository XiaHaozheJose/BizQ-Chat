import axios from "axios";
import type {
  ApiResponse,
  LoginParams,
  LoginResponse,
  UserInfo,
  ShopsListResponse,
  SwitchOperatorParams,
} from "@/types/api";

// 创建axios实例
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL || "http://dev.bizq.com/backend/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 登录
export const login = async (params: LoginParams): Promise<LoginResponse> => {
  const response = await api.post("/operators-login", params);
  return response.data;
};

// 获取用户信息
export const getUserInfo = async (): Promise<UserInfo> => {
  const response = await api.get("/me");
  return response.data;
};

// 获取商家列表
export const getShopsList = async (
  ownerId: string
): Promise<ShopsListResponse> => {
  const response = await api.get("/shops-list-basic", {
    params: { ownerId },
  });
  return response.data;
};

// 切换账号
export const switchOperator = async (
  params: SwitchOperatorParams
): Promise<LoginResponse> => {
  const response = await api.post("/switch-operator", params);
  return response.data;
};

export default api;
