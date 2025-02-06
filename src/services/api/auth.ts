import axios from 'axios'
import type { LoginResponse } from '@/types'

const api = axios.create({
  baseURL: process.env.VITE_API_URL,
  timeout: 10000,
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期,清除登录状态
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 登录
export const login = async (credentials: { 
  username: string; 
  password: string;
}): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/operators-login', credentials)
  return response.data
}

// 刷新Token
export const refreshToken = async (token: string): Promise<string> => {
  const response = await api.post<{ token: string }>('/refresh-token', { token })
  return response.data.token
}

export default api 