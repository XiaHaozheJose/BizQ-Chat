<template>
  <message-base
    :message="message"
    :sender-avatar="senderAvatar"
    :is-shop="isShop"
  >
    <div class="contacts-wrapper">
      <div v-for="contact in contacts" :key="contact.id" class="contact-card">
        <el-avatar
          :size="40"
          :src="getImageUrl(contact.avatar, 'small', contact.isShop)"
          :shape="contact.isShop ? 'square' : 'circle'"
        />
        <div class="contact-info">
          <span class="name">{{ contact.name }}</span>
          <span v-if="contact.isShop" class="shop-tag">{{
            t("common.shop")
          }}</span>
        </div>
      </div>
    </div>
  </message-base>
</template>

<script setup lang="ts">
import { computed } from "vue";
import MessageBase from "./MessageBase.vue";
import type { Message } from "@/types";
import { useI18n } from "vue-i18n";
import { getImageUrl } from "@/utils";

const { t } = useI18n();

const props = defineProps<{
  message: Message;
  senderAvatar?: string;
  isShop?: boolean;
}>();

interface Contact {
  id: string;
  name: string;
  avatar: string;
  isShop: boolean;
}

// Parse contact JSON array from message content
const contacts = computed<Contact[]>(() => {
  try {
    return JSON.parse(props.message.content);
  } catch (error) {
    console.error("Failed to parse contact message content:", error);
    return [];
  }
});
</script>

<style lang="scss" scoped>
.contacts-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;

  .contact-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    background-color: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background-color: var(--el-fill-color-light);
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .name {
        font-weight: 500;
      }

      .shop-tag {
        font-size: 12px;
        color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
        padding: 2px 6px;
        border-radius: 4px;
        width: fit-content;
      }
    }
  }
}
</style>
