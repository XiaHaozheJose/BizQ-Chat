<template>
  <div class="emoji-picker">
    <div class="emoji-tabs">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="常用" name="frequently">
          <div class="emoji-grid">
            <button
              v-for="emoji in frequentlyUsedEmojis"
              :key="emoji"
              class="emoji-button"
              @click="selectEmoji(emoji)"
            >
              {{ emoji }}
            </button>
          </div>
        </el-tab-pane>
        <el-tab-pane label="表情" name="smileys">
          <div class="emoji-grid">
            <button
              v-for="emoji in smileyEmojis"
              :key="emoji"
              class="emoji-button"
              @click="selectEmoji(emoji)"
            >
              {{ emoji }}
            </button>
          </div>
        </el-tab-pane>
        <el-tab-pane label="手势" name="gestures">
          <div class="emoji-grid">
            <button
              v-for="emoji in gestureEmojis"
              :key="emoji"
              class="emoji-button"
              @click="selectEmoji(emoji)"
            >
              {{ emoji }}
            </button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits<{
  (e: "select", emoji: string): void;
}>();

const activeTab = ref("frequently");

// 常用表情
const frequentlyUsedEmojis = [
  "😊",
  "😂",
  "🤣",
  "❤️",
  "😍",
  "🙏",
  "👍",
  "😭",
  "😘",
  "🥰",
  "😅",
  "😉",
  "🤔",
  "😳",
  "🥺",
  "😎",
  "🤗",
  "😴",
  "😷",
  "🤒",
];

// 表情符号
const smileyEmojis = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "🤣",
  "😂",
  "🙂",
  "🙃",
  "😉",
  "😊",
  "😇",
  "🥰",
  "😍",
  "🤩",
  "😘",
  "😗",
  "😚",
  "😙",
  "😋",
  "😛",
  "😜",
  "🤪",
  "😝",
  "🤑",
  "🤗",
  "🤭",
  "🤫",
  "🤔",
  "🤐",
  "🤨",
  "😐",
  "😑",
  "😶",
  "😏",
  "😒",
  "🙄",
  "😬",
  "🤥",
];

// 手势表情
const gestureEmojis = [
  "👋",
  "🤚",
  "🖐️",
  "✋",
  "🖖",
  "👌",
  "🤌",
  "🤏",
  "✌️",
  "🤞",
  "🤟",
  "🤘",
  "🤙",
  "👈",
  "👉",
  "👆",
  "🖕",
  "👇",
  "☝️",
  "👍",
  "👎",
  "✊",
  "👊",
  "🤛",
  "🤜",
  "👏",
  "🙌",
  "👐",
  "🤲",
  "🤝",
];

const selectEmoji = (emoji: string) => {
  emit("select", emoji);
};
</script>

<style lang="scss" scoped>
.emoji-picker {
  width: 100%;
  height: 300px;
  background-color: var(--el-bg-color);

  .emoji-tabs {
    height: 100%;

    :deep(.el-tabs__content) {
      height: calc(100% - 40px);
      overflow-y: auto;
    }
  }

  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 4px;
    padding: 8px;

    .emoji-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      aspect-ratio: 1;
      font-size: 20px;
      background: none;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: var(--el-fill-color-light);
      }

      &:active {
        background-color: var(--el-fill-color);
      }
    }
  }
}
</style>
