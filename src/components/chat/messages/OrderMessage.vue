<template>
  <order-message-base
    ref="orderMessageRef"
    :message="message"
    :sender-avatar="senderAvatar"
    :is-shop="isShop"
    :sender-name="senderName"
  >
    <template #status-area>
      <!-- 订单状态 -->
      <div class="order-status">
        <div class="status-row" v-if="orderInfo?.status">
          <span class="status-label">{{ t("order.status") }}:</span>
          <span class="status-value" :class="orderInfo.status">
            {{ getStatusText(orderInfo.status) }}
          </span>
        </div>
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
      </div>

      <!-- 备注信息 -->
      <div class="order-remark" v-if="orderInfo?.remark">
        <span class="remark-label">{{ t("order.remark") }}:</span>
        <span class="remark-content">{{ orderInfo.remark }}</span>
      </div>
    </template>

    <template #action-area>
      <!-- 状态栏 -->
      <div
        v-if="showStatusBar"
        class="status-bar"
        :class="{ 'need-action': needAction }"
      >
        <span class="status-text">{{ statusBarText }}</span>
      </div>
    </template>
  </order-message-base>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { Message } from "@/types";
import { OrderStatus } from "@/types/order";
import { getOrderStatusText } from "@/services/api/order";
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

// 获取状态文本
const getStatusText = (status: string) => {
  return getOrderStatusText(status);
};

// 计算是否显示状态栏
const showStatusBar = computed(() => {
  if (!orderInfo.value) return false;
  return (
    orderInfo.value.status === "unconfirmed" &&
    orderInfo.value.lockStatus === "unlock"
  );
});

// 计算是否需要操作
const needAction = computed(() => {
  if (!orderInfo.value || !userStore.currentUser) return false;
  const isCurrentShop = orderInfo.value.shopId === userStore.currentUser.id;
  return (
    (orderInfo.value.lastEditedBy === "seller" && !isCurrentShop) ||
    (orderInfo.value.lastEditedBy === "buyer" && isCurrentShop)
  );
});

// 状态栏文本
const statusBarText = computed(() => {
  if (!orderInfo.value || !userStore.currentUser) return "";
  const isCurrentShop = orderInfo.value.shopId === userStore.currentUser.id;

  if (orderInfo.value.lastEditedBy === "seller") {
    return !isCurrentShop
      ? t("order.clickToConfirm")
      : t("order.waitingForReply");
  } else {
    return isCurrentShop
      ? t("order.clickToConfirm")
      : t("order.waitingForReply");
  }
});

onMounted(() => {
  orderMessageRef.value?.fetchOrderInfo();
});
</script>

<style lang="scss" scoped>
.order-status {
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

      &.confirmed,
      &.checkedOK,
      &.departed,
      &.pickedUp,
      &.paid {
        color: var(--el-color-success);
      }

      &.canceled,
      &.canceledBySeller,
      &.canceledByBuyer,
      &.checkedError {
        color: var(--el-color-danger);
      }
    }
  }
}

.order-remark {
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color-light);
  font-size: 14px;

  .remark-label {
    color: var(--el-text-color-regular);
    margin-right: 8px;
  }

  .remark-content {
    color: var(--el-text-color-secondary);
  }
}

.status-bar {
  padding: 12px;
  background-color: var(--el-color-info-light-9);
  text-align: center;
  font-size: 14px;
  color: var(--el-text-color-secondary);

  &.need-action {
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    cursor: pointer;

    &:hover {
      background-color: var(--el-color-primary-light-8);
    }
  }
}
</style>
