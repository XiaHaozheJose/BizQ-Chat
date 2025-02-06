import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '@/types'
import { login as loginApi } from '@/services/api/auth'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null)
  const token = ref<string | null>(null)
  
  // 初始化状态
  const initialize = () => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken) {
      token.value = savedToken
    }
    
    if (savedUser) {
      try {
        currentUser.value = JSON.parse(savedUser)
      } catch (error) {
        console.error('Failed to parse saved user:', error)
      }
    }
  }
  
  // 登录
  const login = async (credentials: { username: string; password: string }) => {
    const response = await loginApi(credentials)
    
    token.value = response.token
    currentUser.value = response.user
    
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
    
    return response.user
  }
  
  // 登出
  const logout = () => {
    token.value = null
    currentUser.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
  
  // 更新用户信息
  const updateUser = (user: User) => {
    currentUser.value = user
    localStorage.setItem('user', JSON.stringify(user))
  }
  
  return {
    currentUser,
    token,
    initialize,
    login,
    logout,
    updateUser,
  }
}) 