<template>
  <message-base
    :message="message"
    :sender-avatar="senderAvatar"
    :is-shop="isShop"
  >
    <p class="text">{{ message.content }}</p>
  </message-base>
</template>

<script setup lang="ts">
import MessageBase from "./MessageBase.vue";
import type { Message } from "@/types";

defineProps<{
  message: Message;
  senderAvatar?: string;
  isShop?: boolean;
}>();
</script>

<style lang="scss" scoped>
.text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}
</style>
