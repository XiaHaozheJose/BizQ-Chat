<template>
  <message-base
    :message="message"
    :sender-avatar="senderAvatar"
    :is-shop="isShop"
    :sender-name="senderName"
  >
    <div class="shipment-message" @click="handleClick">
      <div class="message-header">
        <div class="header-row">
          <span class="label">{{ getNumberLabel }}:</span>
          <span class="value">{{ content.number }}</span>
        </div>
        <div class="header-row">
          <span class="label">{{ t("shipment.date") }}:</span>
          <span class="value">{{ formatDate(content.timeStamp) }}</span>
        </div>
      </div>

      <div class="message-content">
        <div class="content-row">
          <span class="label">{{ t("shipment.quantity") }}:</span>
          <span class="value"
            >{{ content.quantity }} {{ t("order.pieces") }}</span
          >
        </div>
        <div class="content-row">
          <span class="label">{{ t("shipment.orderNumber") }}:</span>
          <span class="value">{{ content.orderNumbers.join(", ") }}</span>
        </div>
        <div class="status-row">
          <span class="status" :class="statusClass">{{ statusText }}</span>
        </div>
      </div>
    </div>
  </message-base>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/store/user";
import type { Message } from "@/types";
import type { ShipmentMessageContent } from "@/types/chat";
import { formatDate } from "@/utils/date";
import MessageBase from "./MessageBase.vue";

const props = defineProps<{
  message: Message;
  senderAvatar?: string;
  isShop?: boolean;
  senderName?: string;
}>();

const { t } = useI18n();
const userStore = useUserStore();

// 解析消息内容
const content = computed<ShipmentMessageContent>(() => {
  return typeof props.message.content === "string"
    ? JSON.parse(props.message.content)
    : props.message.content;
});

// 判断是否为创建者
const isCreator = computed(() => {
  return content.value.creatorId === userStore.currentUser?.id;
});

// 获取单号标签
const getNumberLabel = computed(() => {
  switch (content.value.type) {
    case "shipment":
      return t("shipment.shipmentNumber");
    case "return":
      return t("shipment.returnNumber");
    case "outOfStock":
      return t("shipment.outOfStockNumber");
    default:
      return t("shipment.number");
  }
});

// 获取状态文本
const statusText = computed(() => {
  const { type, status } = content.value;

  if (type === "outOfStock") {
    return t("shipment.outOfStock");
  }

  if (type === "return") {
    switch (status) {
      case "tobeReview":
        return isCreator.value
          ? t("shipment.waitingForReview")
          : t("shipment.pleaseReview");
      case "rejected":
        return isCreator.value
          ? `${t("shipment.rejected")}${content.value.remark || ""}`
          : t("shipment.rejected");
      case "approved":
        return t("shipment.approved");
      case "refunding":
        return isCreator.value
          ? t("shipment.refunding")
          : `${t("shipment.refunding")}${t("shipment.pleaseAttention")}`;
      default:
        return status;
    }
  }

  // 发货状态直接显示
  return t(`shipment.status.${status}`);
});

// 状态样式
const statusClass = computed(() => {
  const { type, status } = content.value;

  if (type === "outOfStock") {
    return "warning";
  }

  if (type === "return") {
    switch (status) {
      case "rejected":
        return "danger";
      case "approved":
      case "refunding":
        return "success";
      default:
        return "warning";
    }
  }

  // 发货状态样式
  switch (status) {
    case "completed":
      return "success";
    case "cancelled":
      return "danger";
    default:
      return "warning";
  }
});

// 处理点击事件
const handleClick = () => {
  const { type, id } = content.value;

  if (type === "shipment") {
    ElMessage.info(`${t("shipment.shipmentNumber")}: ${id}`);
  } else if (type === "return") {
    ElMessage.info(`${t("shipment.returnNumber")}: ${id}`);
  } else if (type === "outOfStock") {
    ElMessage.info(`${t("shipment.outOfStockNumber")}: ${id}`);
  }
};
</script>

<style lang="scss" scoped>
.shipment-message {
  padding: 12px;
  width: 300px;
  background: var(--el-bg-color);
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: var(--el-bg-color-page);
  }

  .message-header,
  .message-content {
    .header-row,
    .content-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        color: var(--el-text-color-secondary);
        font-size: 14px;
      }

      .value {
        color: var(--el-text-color-primary);
        font-size: 14px;
      }
    }
  }

  .message-header {
    padding-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .message-content {
    padding-top: 12px;

    .status-row {
      display: flex;
      justify-content: flex-end;
      margin-top: 12px;

      .status {
        padding: 2px 8px;
        border-radius: 2px;
        font-size: 12px;

        &.success {
          color: var(--el-color-success);
          background: var(--el-color-success-light-9);
        }

        &.warning {
          color: var(--el-color-warning);
          background: var(--el-color-warning-light-9);
        }

        &.danger {
          color: var(--el-color-danger);
          background: var(--el-color-danger-light-9);
        }
      }
    }
  }
}
</style>
