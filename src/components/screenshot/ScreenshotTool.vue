<template>
  <div
    class="screenshot-tool"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
  >
    <!-- 遮罩层 -->
    <div class="mask" :style="maskStyle">
      <div v-if="isSelecting" class="selection-area" :style="selectionStyle">
        <!-- 控制点 -->
        <div
          v-for="point in controlPoints"
          :key="point"
          :class="['control-point', point]"
          @mousedown.stop="startResize(point, $event)"
        ></div>
      </div>
    </div>

    <!-- 工具栏 -->
    <screenshot-toolbar
      v-if="showToolbar"
      v-model="currentTool"
      :can-undo="canUndo"
      :x="toolbarX"
      :y="toolbarY"
      @undo="handleUndo"
      @finish="handleFinish"
      @cancel="handleCancel"
    />

    <!-- 绘图层 -->
    <screenshot-canvas
      v-if="showCanvas"
      ref="canvasRef"
      :tool="currentTool"
      :width="width"
      :height="height"
      @update:can-undo="updateCanUndo"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import type { PropType } from "vue";
import ScreenshotToolbar from "./ScreenshotToolbar.vue";
import ScreenshotCanvas from "./ScreenshotCanvas.vue";

// 定义props
const props = defineProps({
  sourceId: {
    type: String,
    required: true,
  },
  width: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
});

// 定义事件
const emit = defineEmits<{
  (e: "finish", imageData: string): void;
  (e: "cancel"): void;
}>();

// 状态变量
const isSelecting = ref(false);
const startX = ref(0);
const startY = ref(0);
const endX = ref(0);
const endY = ref(0);
const showToolbar = ref(false);
const showCanvas = ref(false);
const currentTool = ref<"rectangle" | "circle" | "brush" | "text">("rectangle");
const canUndo = ref(false);
const isResizing = ref(false);
const resizePoint = ref("");
const canvasRef = ref<InstanceType<typeof ScreenshotCanvas> | null>(null);

// 控制点列表
const controlPoints = [
  "top-left",
  "top-middle",
  "top-right",
  "middle-left",
  "middle-right",
  "bottom-left",
  "bottom-middle",
  "bottom-right",
];

// 计算样式
const selectionStyle = computed(() => {
  const left = Math.min(startX.value, endX.value);
  const top = Math.min(startY.value, endY.value);
  const width = Math.abs(endX.value - startX.value);
  const height = Math.abs(endY.value - startY.value);

  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
  };
});

const maskStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
}));

// 计算工具栏位置
const toolbarX = computed(() => {
  const left = Math.min(startX.value, endX.value);
  const width = Math.abs(endX.value - startX.value);
  return left + width / 2;
});

const toolbarY = computed(() => {
  const top = Math.min(startY.value, endY.value);
  return top - 50; // 工具栏显示在选区上方
});

// 鼠标事件处理
const handleMouseDown = (e: MouseEvent) => {
  if (isResizing.value || showCanvas.value) return;

  isSelecting.value = true;
  startX.value = e.clientX;
  startY.value = e.clientY;
  endX.value = e.clientX;
  endY.value = e.clientY;
  showToolbar.value = false;
  showCanvas.value = false;
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isSelecting.value && !isResizing.value) return;

  if (isResizing.value) {
    handleResize(e);
  } else {
    endX.value = e.clientX;
    endY.value = e.clientY;
  }
};

const handleMouseUp = () => {
  if (isResizing.value) {
    isResizing.value = false;
    resizePoint.value = "";
  } else if (isSelecting.value) {
    isSelecting.value = false;
    showToolbar.value = true;
    showCanvas.value = true;
  }
};

// 调整大小
const startResize = (point: string, e: MouseEvent) => {
  e.preventDefault();
  isResizing.value = true;
  resizePoint.value = point;
};

const handleResize = (e: MouseEvent) => {
  const point = resizePoint.value;
  if (!point) return;

  if (point.includes("top")) {
    startY.value = e.clientY;
  } else if (point.includes("bottom")) {
    endY.value = e.clientY;
  }

  if (point.includes("left")) {
    startX.value = e.clientX;
  } else if (point.includes("right")) {
    endX.value = e.clientX;
  }
};

// 工具栏操作
const handleUndo = () => {
  canvasRef.value?.undo();
};

const handleFinish = async () => {
  const imageData = canvasRef.value?.getImageData();
  if (imageData) {
    emit("finish", imageData);
  }
};

const handleCancel = () => {
  emit("cancel");
};

// 更新状态
const updateCanUndo = (value: boolean) => {
  canUndo.value = value;
};

// 初始化
onMounted(async () => {
  // TODO: 初始化截图
});
</script>

<style lang="scss" scoped>
.screenshot-tool {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  cursor: crosshair;
}

.mask {
  position: absolute;
  top: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.selection-area {
  position: absolute;
  border: 1px solid #409eff;
  background: transparent;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4);

  .control-point {
    position: absolute;
    width: 8px;
    height: 8px;
    background: #fff;
    border: 1px solid #409eff;

    &.top-left {
      top: -4px;
      left: -4px;
      cursor: nw-resize;
    }
    &.top-middle {
      top: -4px;
      left: 50%;
      transform: translateX(-50%);
      cursor: n-resize;
    }
    &.top-right {
      top: -4px;
      right: -4px;
      cursor: ne-resize;
    }
    &.middle-left {
      top: 50%;
      left: -4px;
      transform: translateY(-50%);
      cursor: w-resize;
    }
    &.middle-right {
      top: 50%;
      right: -4px;
      transform: translateY(-50%);
      cursor: e-resize;
    }
    &.bottom-left {
      bottom: -4px;
      left: -4px;
      cursor: sw-resize;
    }
    &.bottom-middle {
      bottom: -4px;
      left: 50%;
      transform: translateX(-50%);
      cursor: s-resize;
    }
    &.bottom-right {
      bottom: -4px;
      right: -4px;
      cursor: se-resize;
    }
  }
}
</style>
