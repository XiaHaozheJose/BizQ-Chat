<template>
  <div class="login-container">
    <div class="login-content">
      <div class="login-header">
        <app-logo :size="80" />
        <h1 class="title">{{ t("login.title") }}</h1>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <div class="form-group phone-group">
          <el-select
            v-model="formData.countryCode"
            class="area-code-select"
            size="large"
            :teleported="false"
            popper-class="area-code-dropdown"
          >
            <el-option
              v-for="country in countries"
              :key="country.code"
              :label="country.dialCode"
              :value="country.dialCode"
            >
              <div class="country-option">
                <span class="flag">{{ country.flag }}</span>
                <span class="name">{{ country.name }}</span>
                <span class="code">{{ country.dialCode }}</span>
              </div>
            </el-option>
          </el-select>

          <el-form-item prop="phone" class="phone-input-item">
            <el-input
              v-model="formData.phone"
              :placeholder="t('login.phonePlaceholder')"
              :prefix-icon="Iphone"
              size="large"
              class="phone-input"
            />
          </el-form-item>
        </div>

        <el-form-item prop="password">
          <el-input
            v-model="formData.password"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="t('login.passwordPlaceholder')"
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
        </el-form-item>

        <div class="form-options">
          <el-checkbox v-model="formData.rememberMe">{{
            t("login.rememberMe")
          }}</el-checkbox>
          <el-link type="primary" :underline="false">{{
            t("login.forgotPassword")
          }}</el-link>
        </div>

        <el-button
          type="primary"
          size="large"
          class="login-button"
          native-type="submit"
          :loading="loading"
        >
          {{ t("login.submit") }}
        </el-button>

        <div class="register-link">
          {{ t("login.noAccount")
          }}<el-link type="primary" :underline="false">{{
            t("login.register")
          }}</el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import { FormInstance, FormRules } from "element-plus";
import {
  User,
  Lock,
  View,
  Hide,
  Iphone,
  ArrowDown,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/store/user";
import AppLogo from "@/components/AppLogo.vue";
import { countries, type Country } from "@/constants/countries";
import { useI18n } from "vue-i18n";

const router = useRouter();
const userStore = useUserStore();
const formRef = ref<FormInstance>();
const showPassword = ref(false);
const loading = ref(false);
const { t } = useI18n();

// 表单数据
const formData = reactive({
  countryCode: countries[0].dialCode,
  phone: "",
  password: "",
  rememberMe: false,
});

// 当前选中的国家对象
const selectedCountry = computed(() => {
  return (
    countries.find((c) => c.dialCode === formData.countryCode) || countries[0]
  );
});

// 手机号验证函数
const validatePhone = (rule: any, value: string, callback: Function) => {
  if (!value) {
    callback(new Error("请输入手机号"));
    return;
  }

  const pattern = new RegExp(selectedCountry.value.pattern);
  if (!pattern.test(value)) {
    callback(new Error(`请输入正确的${selectedCountry.value.name}手机号`));
    return;
  }

  callback();
};

// 表单验证规则
const rules = reactive<FormRules>({
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    { validator: validatePhone, trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码长度不能小于6位", trigger: "blur" },
  ],
});

// 登录处理
const handleLogin = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    // 构造登录参数
    const loginParams = {
      phone: formData.phone,
      areaCode: formData.countryCode.replace("+", ""),
      platform: "web",
      type: "user",
      password: formData.password,
    };

    // 调用登录
    const success = await userStore.login(loginParams);
    console.log("success", success);
    if (success) {
      if (formData.rememberMe) {
        localStorage.setItem("lastAreaCode", selectedCountry.value.code);
      }
      router.push("/");
    }
  } catch (error: any) {
    console.error("登录失败:", error);
    ElMessage.error(
      error.response?.data?.message || "登录失败，请检查手机号和密码"
    );
  }
};

// 初始化时尝试恢复上次使用的区号
const lastAreaCode = localStorage.getItem("lastAreaCode");
if (lastAreaCode) {
  const lastCountry = countries.find((c) => c.code === lastAreaCode);
  if (lastCountry) {
    formData.countryCode = lastCountry.dialCode;
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
          gap: 16px;

          .area-code-select {
            width: 140px;
            flex-shrink: 0;

            :deep(.el-input) {
              --el-input-height: 40px;

              .el-input__wrapper {
                padding: 0 12px;
                background-color: var(--el-fill-color-blank);
                box-shadow: 0 0 0 1px var(--el-border-color) inset;
                border-radius: 8px;

                &:hover {
                  box-shadow: 0 0 0 1px var(--el-border-color-hover) inset;
                }
              }

              .el-input__inner {
                text-align: left;
                font-size: 14px;
                color: var(--el-text-color-primary);
                padding-right: 25px;
              }

              .el-input__suffix {
                font-size: 12px;
                color: var(--el-text-color-secondary);
              }
            }
          }

          .phone-input-item {
            flex: 1;
            margin-bottom: 0;

            :deep(.el-input__wrapper) {
              border-radius: 8px;
            }
          }
        }

        :deep(.el-input) {
          --el-input-height: 40px;

          .el-input__wrapper {
            background-color: var(--el-fill-color-blank);
            box-shadow: 0 0 0 1px var(--el-border-color) inset;
            border-radius: 8px;

            &:hover {
              box-shadow: 0 0 0 1px var(--el-border-color-hover) inset;
            }
          }

          .el-input__prefix-inner {
            font-size: 18px;
          }
        }

        .password-toggle {
          cursor: pointer;
          font-size: 16px;
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
        margin: 16px 0 24px;
      }

      .login-button {
        width: 100%;
        height: 40px;
        font-size: 16px;
        margin-bottom: 24px;
      }

      .register-link {
        text-align: center;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

// 区号下拉框样式
:deep(.area-code-dropdown) {
  .country-option {
    display: flex;
    align-items: center;
    padding: 8px 12px;

    .flag {
      margin-right: 8px;
      font-size: 20px;
    }

    .name {
      flex: 1;
      font-size: 14px;
      color: var(--el-text-color-regular);
    }

    .code {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin-left: 8px;
    }
  }

  .el-select-dropdown__item.selected {
    .country-option {
      .name,
      .code {
        color: var(--el-color-primary);
      }
    }
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
