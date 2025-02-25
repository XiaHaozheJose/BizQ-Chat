<template>
  <div class="screenshot-page">
    <screenshot-tool
      v-if="sourceId"
      :source-id="sourceId"
      :width="width"
      :height="height"
      @finish="handleFinish"
      @cancel="handleCancel"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import ScreenshotTool from "@/components/screenshot/ScreenshotTool.vue";

const sourceId = ref<string>("");
const width = ref(0);
const height = ref(0);

// 初始化截图
onMounted(async () => {
  const result = await window.electronAPI.screenshot.start();
  if (result) {
    sourceId.value = result.sourceId;
    width.value = result.width;
    height.value = result.height;
  } else {
    handleCancel();
  }
});

// 处理截图完成
const handleFinish = async (imageData: string) => {
  await window.electronAPI.screenshot.finish(imageData);
};

// 处理取消截图
const handleCancel = async () => {
  await window.electronAPI.screenshot.cancel();
};
</script>

<style lang="scss" scoped>
.screenshot-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: transparent;
}
</style>
