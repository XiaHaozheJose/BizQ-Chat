<template>
  <div
    class="contact-item"
    :class="{ selected: selected }"
    @click="$emit('click')"
  >
    <el-checkbox
      v-if="selected !== undefined"
      v-model="isSelected"
      @change="$emit('select')"
      @click.stop
    />
    <el-avatar :size="40" :src="contact.image" :icon="getIcon" />
    <div class="contact-info">
      <div class="name">{{ contact.name }}</div>
      <div v-if="contact.remark" class="remark">{{ contact.remark }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { User, ChatDotRound } from "@element-plus/icons-vue";
import type { Contact } from "@/types";

const props = defineProps<{
  contact: Contact;
  selected?: boolean;
  iconType?: "new-friend" | "official" | "enterprise" | "default";
}>();

defineEmits<{
  (e: "click"): void;
  (e: "select"): void;
}>();

const isSelected = computed({
  get: () => props.selected,
  set: () => {}, // 通过父组件控制
});

const getIcon = computed(() => {
  switch (props.iconType) {
    case "new-friend":
      return User;
    case "official":
      return ChatDotRound;
    case "enterprise":
      return User;
    default:
      return User;
  }
});
</script>

<style lang="scss" scoped>
@use "@/styles/mixins" as *;

.contact-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background-color: var(--el-bg-color-overlay);
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: var(--el-fill-color-light);
  }

  &.selected {
    background-color: var(--el-color-primary-light-9);
  }

  .el-checkbox {
    margin-right: 12px;
  }

  .el-avatar {
    margin-right: 12px;
  }

  .contact-info {
    flex: 1;
    min-width: 0;

    .name {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      @include text-ellipsis;
    }

    .remark {
      margin-top: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      @include text-ellipsis;
    }
  }
}
</style>
