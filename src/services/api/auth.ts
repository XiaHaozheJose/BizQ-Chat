import axios from "axios";
import type {
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
    console.log("[API] Making request:", {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      timeout: config.timeout,
    });

    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => {
    console.error("[API] Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log("[API] Response received:", {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("[API] Response error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout,
      },
    });
    return Promise.reject(error);
  }
);

// 登录
export const login = async (params: LoginParams): Promise<LoginResponse> => {
  console.log("[API] Attempting login with params:", params);
  try {
    const response = await api.post("/operators-login", params);
    console.log("[API] Login successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("[API] Login failed:", error);
    throw error;
  }
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
