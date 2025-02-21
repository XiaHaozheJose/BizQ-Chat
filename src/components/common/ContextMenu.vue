<template>
  <Teleport to="body">
    <div
      v-show="contextMenuStore.visible"
      class="context-menu"
      :style="{
        left: contextMenuStore.position.x + 'px',
        top: contextMenuStore.position.y + 'px',
      }"
    >
      <!-- 语音消息特殊菜单 -->
      <template v-if="isAudioMessage">
        <div
          v-if="!hasVoiceText"
          class="menu-item"
          @click="handleCommand('transcribe')"
        >
          {{ t("chat.transcribe") }}
        </div>
        <div v-else class="menu-item" @click="handleCommand('toggleVoiceText')">
          {{ showVoiceText ? t("chat.collapseText") : t("chat.expandText") }}
        </div>
      </template>

      <!-- 通用菜单项 -->
      <div class="menu-item" @click="handleCommand('quote')">
        {{ t("chat.quote") }}
      </div>
      <div class="menu-item" @click="handleCommand('copy')">
        {{ t("common.copy") }}
      </div>
      <div class="menu-item" @click="handleCommand('delete')">
        {{ t("common.delete") }}
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { onMounted, onUnmounted } from "vue";
import { useContextMenuStore } from "@/store/contextMenu";
import { useI18n } from "vue-i18n";
import { MessageType } from "@/types";

const { t } = useI18n();
const contextMenuStore = useContextMenuStore();

// 是否是语音消息
const isAudioMessage = computed(() => {
  return contextMenuStore.currentMessage?.type === MessageType.AUDIO;
});

// 是否有语音转写文本
const hasVoiceText = computed(() => {
  return !!contextMenuStore.currentMessage?.voiceText;
});

// 是否显示语音转写文本
const showVoiceText = computed(() => {
  return contextMenuStore.showVoiceText;
});

// 处理菜单命令
const handleCommand = (command: string) => {
  const message = contextMenuStore.currentMessage;
  if (!message) return;

  switch (command) {
    case "transcribe":
      // 触发转写事件
      window.dispatchEvent(
        new CustomEvent("message-transcribe", { detail: message })
      );
      contextMenuStore.hide();
      break;
    case "toggleVoiceText":
      window.dispatchEvent(
        new CustomEvent("toggle-voice-text", { detail: message })
      );
      contextMenuStore.hide();
      break;
    case "quote":
      window.dispatchEvent(
        new CustomEvent("message-quote", { detail: message })
      );
      contextMenuStore.hide();
      break;
    case "copy":
      const textToCopy = message.voiceText || message.content;
      navigator.clipboard.writeText(textToCopy);
      contextMenuStore.hide();
      break;
    case "delete":
      window.dispatchEvent(
        new CustomEvent("message-delete", { detail: message })
      );
      contextMenuStore.hide();
      break;
  }
};

// 点击其他地方关闭菜单
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest(".context-menu")) {
    contextMenuStore.hide();
  }
};

// 处理全局右键点击
const handleGlobalContextMenu = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  // 如果点击不是在消息气泡上，则隐藏菜单
  if (!target.closest(".message-bubble")) {
    contextMenuStore.hide();
  }
};

onMounted(() => {
  window.addEventListener("click", handleClickOutside);
  window.addEventListener("contextmenu", handleGlobalContextMenu);
  window.addEventListener("scroll", () => contextMenuStore.hide(), true);
});

onUnmounted(() => {
  window.removeEventListener("click", handleClickOutside);
  window.removeEventListener("contextmenu", handleGlobalContextMenu);
  window.removeEventListener("scroll", () => contextMenuStore.hide());
});
</script>

<style lang="scss" scoped>
.context-menu {
  position: fixed;
  z-index: 9999;
  background: var(--el-bg-color);
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 4px 0;
  min-width: 120px;

  .menu-item {
    padding: 8px 8px;
    cursor: pointer;
    font-size: 14px;
    color: var(--el-text-color-primary);
    transition: background-color 0.3s;

    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }
}
</style>
