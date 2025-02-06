<template>
  <div class="login-container">
    <div class="login-content">
      <div class="login-header">
        <app-logo :size="80" />
        <h1 class="title">Web Chat</h1>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group phone-group">
          <el-select
            v-model="selectedCountry"
            class="country-select"
            size="large"
            :teleported="false"
            popper-class="country-select-dropdown"
          >
            <template #prefix>
              <span class="selected-flag">{{ selectedCountry.flag }}</span>
            </template>
            <el-option
              v-for="country in countries"
              :key="country.code"
              :label="country.dialCode"
              :value="country"
            >
              <span class="country-option">
                <span class="flag">{{ country.flag }}</span>
                <span class="dial-code">{{ country.dialCode }}</span>
                <span class="country-name">{{ country.name }}</span>
              </span>
            </el-option>
          </el-select>

          <el-input
            v-model="phone"
            placeholder="请输入手机号"
            :prefix-icon="Iphone"
            size="large"
            class="phone-input"
          />
        </div>

        <div class="form-group">
          <el-input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="密码"
            :prefix-icon="Lock"
            size="large"
          >
            <template #suffix>
              <el-icon 
                class="password-toggle"
                @click="showPassword = !showPassword"
              >
                <View v-if="showPassword" />
                <Hide v-else />
              </el-icon>
            </template>
          </el-input>
        </div>

        <div class="form-options">
          <el-checkbox v-model="rememberMe">记住我</el-checkbox>
          <el-link type="primary" :underline="false">忘记密码？</el-link>
        </div>

        <el-button
          type="primary"
          size="large"
          class="login-button"
          native-type="submit"
          :loading="loading"
        >
          登录
        </el-button>

        <div class="register-link">
          还没有账号？<el-link type="primary" :underline="false">立即注册</el-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, View, Hide, Iphone } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import AppLogo from '@/components/AppLogo.vue'
import { countries, type Country } from '@/constants/countries'

const router = useRouter()
const phone = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
const loading = ref(false)
const selectedCountry = ref<Country>(countries[5]) // 默认选中中国

const handleLogin = async () => {
  if (!phone.value || !password.value) {
    ElMessage.warning('请输入手机号和密码')
    return
  }

  // 简单的手机号格式验证
  const phoneRegex = /^\d{11}$/
  if (!phoneRegex.test(phone.value)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }

  loading.value = true
  try {
    // TODO: 调用登录API
    const fullPhone = selectedCountry.value.dialCode + phone.value
    console.log('登录信息:', { phone: fullPhone, password: password.value })
    
    // 模拟登录成功
    localStorage.setItem('isLoggedIn', 'true')
    router.push('/')
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error('登录失败，请检查手机号和密码')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);

  .login-content {
    width: 100%;
    max-width: 400px;
    padding: 40px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    animation: fadeIn 0.5s ease;

    .login-header {
      text-align: center;
      margin-bottom: 40px;

      .title {
        font-size: 24px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-top: 16px;
      }
    }

    .login-form {
      .form-group {
        margin-bottom: 24px;

        &.phone-group {
          display: flex;
          gap: 12px;

          .country-select {
            width: 100px;
            flex-shrink: 0;

            :deep(.el-input) {
              --el-input-height: 48px;

              .el-input__wrapper {
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
                padding: 0 8px;
              }

              .el-input__inner {
                display: none;
              }

              .el-input__prefix {
                margin-right: 0;
              }
            }

            .selected-flag {
              font-size: 20px;
              margin-right: 4px;
            }
          }

          .phone-input {
            flex: 1;
          }
        }

        :deep(.el-input) {
          --el-input-height: 48px;
          
          .el-input__wrapper {
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
          }

          .el-input__prefix-inner {
            font-size: 18px;
          }
        }

        .password-toggle {
          cursor: pointer;
          font-size: 18px;
          color: var(--el-text-color-secondary);

          &:hover {
            color: var(--el-text-color-primary);
          }
        }
      }

      .form-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }

      .login-button {
        width: 100%;
        height: 48px;
        font-size: 16px;
        border-radius: 8px;
        margin-bottom: 24px;
      }

      .register-link {
        text-align: center;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

:deep(.country-option) {
  display: flex;
  align-items: center;
  gap: 8px;

  .flag {
    font-size: 20px;
  }

  .dial-code {
    color: var(--el-text-color-regular);
    width: 50px;
  }

  .country-name {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
}

:deep(.country-select-dropdown) {
  .el-select-dropdown__item {
    height: 40px;
    line-height: 40px;
    padding: 0 12px;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 