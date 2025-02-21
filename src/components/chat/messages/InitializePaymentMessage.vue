<template>
  <order-message-base
    ref="orderMessageRef"
    :message="message"
    :sender-avatar="senderAvatar"
    :is-shop="isShop"
    :sender-name="senderName"
  >
    <template #status-area>
      <!-- 支付状态 -->
      <div class="payment-status">
        <div class="status-row" v-if="orderInfo?.payStatus">
          <span class="status-label">{{ t("order.paymentStatus") }}:</span>
          <span
            class="status-value"
            :class="{ paid: orderInfo.payStatus === 'paid' }"
          >
            {{
              orderInfo.payStatus === "paid"
                ? t("order.paid")
                : t("order.unpaid")
            }}
          </span>
        </div>
        <div class="status-row" v-if="orderInfo?.expiredAt">
          <span class="status-label">{{ t("order.expireTime") }}:</span>
          <span class="status-value" :class="{ expired: isExpired }">
            {{ isExpired ? t("order.expired") : orderInfo.expiredAt }}
          </span>
        </div>
      </div>
    </template>

    <template #action-area>
      <!-- 支付按钮 -->
      <div class="payment-action">
        <el-button
          type="primary"
          :disabled="isExpired || orderInfo?.payStatus === 'paid'"
          @click.stop="handlePayment"
        >
          {{ buttonText }}
        </el-button>
      </div>
    </template>
  </order-message-base>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { Message } from "@/types";
import { useUserStore } from "@/store/user";
import OrderMessageBase from "./OrderMessageBase.vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  message: Message;
  senderAvatar?: string;
  isShop?: boolean;
  senderName?: string;
}>();

const { t } = useI18n();
const userStore = useUserStore();
const orderMessageRef = ref<InstanceType<typeof OrderMessageBase>>();

const orderInfo = computed(() => orderMessageRef.value?.orderInfo);

// 判断订单是否过期
const isExpired = computed(() => {
  if (!orderInfo.value?.expiredAt) return false;
  return new Date(orderInfo.value.expiredAt) < new Date();
});

// 按钮文本
const buttonText = computed(() => {
  if (!orderInfo.value) return t("order.loading");
  if (orderInfo.value.payStatus === "paid") return t("order.paid");
  if (isExpired.value) return t("order.expired");

  const isCurrentShop = orderInfo.value.shopId === userStore.currentUser?.id;
  return isCurrentShop ? t("order.waitingForPayment") : t("order.payNow");
});

// 处理支付操作
const handlePayment = async () => {
  if (
    !orderInfo.value ||
    isExpired.value ||
    orderInfo.value.payStatus === "paid"
  )
    return;

  // TODO: 实现支付逻辑
  console.log("TODO: Implement payment logic");
};

// 添加 onMounted 钩子来获取订单信息
onMounted(() => {
  orderMessageRef.value?.fetchOrderInfo();
});
</script>

<style lang="scss" scoped>
.payment-status {
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color-light);

  .status-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }

    .status-label {
      font-size: 14px;
      color: var(--el-text-color-regular);
    }

    .status-value {
      font-size: 14px;
      color: var(--el-color-warning);

      &.paid {
        color: var(--el-color-success);
      }

      &.expired {
        color: var(--el-color-danger);
      }
    }
  }
}

.payment-action {
  padding: 12px;
  text-align: center;

  .el-button {
    width: 100%;
  }
}
</style>
