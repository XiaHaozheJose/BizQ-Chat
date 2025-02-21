<template>
  <div
    class="conversation-item"
    :class="{ selected: selected }"
    @click="$emit('click')"
  >
    <el-avatar
      :size="40"
      :shape="isShopUser ? 'square' : 'circle'"
      :src="getImageUrl(avatar, 'medium', isShopUser)"
    >
      <img :src="isShopUser ? DEFAULT_SHOP_AVATAR : DEFAULT_AVATAR" />
    </el-avatar>

    <div class="conversation-info">
      <div class="conversation-header">
        <span class="name">{{ name }}</span>
        <span class="time">{{ formattedTime }}</span>
      </div>
      <div class="conversation-preview">
        <span class="message">{{ lastMessagePreview }}</span>
        <el-badge
          v-if="conversation.unReadCount"
          :value="conversation.unReadCount"
          :max="99"
          class="unread-badge"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { MessageType, type Conversation } from "@/types";
import { formatTime } from "@/utils/time";
import { getImageUrl, DEFAULT_AVATAR, DEFAULT_SHOP_AVATAR } from "@/utils";
import { useUserStore } from "@/store/user";
import { useChatStore } from "@/store/chat";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  conversation: Conversation;
  selected?: boolean;
}>();

defineEmits<{
  (e: "click"): void;
}>();

const userStore = useUserStore();
const chatStore = useChatStore();
const { t } = useI18n();
// 获取对话的另一方用户ID
const otherUserId = computed(() => {
  let users = props.conversation.users.split("#$");
  //如果users长度>1, 如果不大于1则使用senderId 和 receiveId
  if (users.length > 1) {
    return users.filter((user) => user !== userStore.currentUser?.id)[0];
  }
  return props.conversation.senderId === userStore.currentUser?.id
    ? props.conversation.receiveId
    : props.conversation.senderId;
});

// 获取对话的另一方用户信息
const otherUser = computed(() => {
  return chatStore.users[otherUserId.value];
});

// 计算属性
const isShopUser = computed(() => {
  return otherUser.value?.isShop ?? false;
});

const avatar = computed(() => {
  return otherUser.value?.avatar ?? "";
});

const name = computed(() => {
  if (!otherUser.value) {
    console.warn("No user found for ID:", otherUserId.value);
    return otherUserId.value;
  }
  // 如果remark为空 或者空字符，则显示name，如果name为空，则显示otherUserId
  if (!otherUser.value.remark || otherUser.value.remark === "") {
    return otherUser.value.name ?? otherUserId.value;
  }
  return otherUser.value.remark;
});

const formattedTime = computed(() => {
  const timestamp = props.conversation.lastMessage?.timestamp;
  return timestamp ? formatTime(timestamp) : "";
});

const lastMessagePreview = computed(() => {
  const message = props.conversation.lastMessage;
  console.log("conversation Id", props.conversation.id);
  console.log("lastMessagePreview", message);
  if (!message) return "";
  let preview = "";
  switch (message.type) {
    case MessageType.TEXT:
      return message.content;
    case MessageType.IMAGE:
      preview = t("chat.imageMessage");
      break;
    case MessageType.PDF:
      preview = t("chat.pdfMessage");
      break;
    case MessageType.ORDER:
      preview = t("chat.orderMessage");
      break;
    case MessageType.PRE_ORDER:
      preview = t("chat.preOrderMessage");
      break;
    case MessageType.PAYMENT:
      preview = t("chat.paymentMessage");
      break;
    case MessageType.PRODUCT:
      preview = t("chat.productMessage");
      break;
    case MessageType.CARD:
      preview = t("chat.cardMessage");
      break;
    case MessageType.CONTACT:
      preview = t("chat.contactMessage");
      break;
    case MessageType.SYSTEM:
      preview = t("chat.systemMessage");
      break;
    case MessageType.LOCATION:
      preview = t("chat.locationMessage");
      break;
    case MessageType.AUDIO:
      preview = t("chat.audioMessage");
      break;
    case MessageType.INITIALIZE_PAYMENT:
      preview = t("chat.initializePaymentMessage");
      break;
    case MessageType.SHIPMENT:
      preview = t("chat.shipmentMessage");
      break;
    case MessageType.RETURN:
      preview = t("chat.returnMessage");
      break;
    case MessageType.OUT_OF_STOCK:
      preview = t("chat.outOfStockMessage");
      break;
    case MessageType.COUPON:
      preview = t("chat.couponMessage");
      break;
    case MessageType.VOUCHER:
      preview = t("chat.voucherMessage");
      break;
    default:
      preview = t("chat.message");
  }
  return "[" + preview + "]";
});
</script>

<style lang="scss" scoped>
@use "@/styles/mixins" as *;

.conversation-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: var(--el-fill-color-light);
  }

  &.selected {
    background-color: var(--el-color-primary-light-9);
  }

  .el-avatar {
    margin-right: 12px;
    border: 1px solid var(--el-border-color-lighter);
  }

  .conversation-info {
    flex: 1;
    min-width: 0;

    .conversation-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;

      .name {
        font-weight: 500;
        @include text-ellipsis;
      }

      .time {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    .conversation-preview {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .message {
        flex: 1;
        font-size: 13px;
        color: var(--el-text-color-secondary);
        @include text-ellipsis;
      }

      .unread-badge {
        margin-left: 8px;
      }
    }
  }
}
</style>
