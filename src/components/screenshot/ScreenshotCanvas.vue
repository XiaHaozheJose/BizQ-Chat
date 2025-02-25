<template>
  <canvas
    ref="canvasRef"
    class="screenshot-canvas"
    :class="{ active: isDrawing }"
    :width="width"
    :height="height"
    @mousedown="startDrawing"
    @mousemove="draw"
    @mouseup="endDrawing"
    @mouseleave="endDrawing"
  ></canvas>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from "vue";
import type { PropType } from "vue";

// 定义工具类型
type Tool = "rectangle" | "circle" | "brush" | "text";

// 定义props
const props = defineProps({
  tool: {
    type: String as PropType<Tool>,
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
  (e: "update:canUndo", value: boolean): void;
}>();

// 画布相关
const canvasRef = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);
const isDrawing = ref(false);
const startPoint = ref({ x: 0, y: 0 });
const history = ref<ImageData[]>([]);
const currentStep = ref(-1);

// 初始化画布
onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  ctx.value = canvas.getContext("2d");
  if (!ctx.value) return;

  // 设置默认样式
  ctx.value.strokeStyle = "#409eff";
  ctx.value.lineWidth = 2;
  ctx.value.lineCap = "round";
  ctx.value.lineJoin = "round";

  // 保存初始状态
  saveState();
});

// 监听工具变化
watch(() => props.tool, () => {
  if (!ctx.value) return;

  // 根据工具设置不同的样式
  switch (props.tool) {
    case "brush":
      ctx.value.lineWidth = 2;
      break;
    case "text":
      ctx.value.font = "16px Arial";
      break;
    default:
      ctx.value.lineWidth = 2;
  }
});

// 绘图相关方法
const startDrawing = (e: MouseEvent) => {
  if (!ctx.value) return;

  isDrawing.value = true;
  startPoint.value = {
    x: e.offsetX,
    y: e.offsetY,
  };

  if (props.tool === "brush") {
    ctx.value.beginPath();
    ctx.value.moveTo(startPoint.value.x, startPoint.value.y);
  }
};

const draw = (e: MouseEvent) => {
  if (!isDrawing.value || !ctx.value) return;

  const currentPoint = {
    x: e.offsetX,
    y: e.offsetY,
  };

  // 恢复到上一步
  restoreState();

  switch (props.tool) {
    case "rectangle":
      drawRectangle(currentPoint);
      break;
    case "circle":
      drawCircle(currentPoint);
      break;
    case "brush":
      drawBrush(currentPoint);
      break;
    case "text":
      // 文本输入在endDrawing中处理
      break;
  }
};

const endDrawing = (e: MouseEvent) => {
  if (!isDrawing.value) return;

  if (props.tool === "text") {
    const text = window.prompt("请输入文本：");
    if (text && ctx.value) {
      ctx.value.fillText(text, startPoint.value.x, startPoint.value.y);
      saveState();
    }
  } else if (isDrawing.value) {
    saveState();
  }

  isDrawing.value = false;
};

// 绘图工具实现
const drawRectangle = (currentPoint: { x: number; y: number }) => {
  if (!ctx.value) return;

  const width = currentPoint.x - startPoint.value.x;
  const height = currentPoint.y - startPoint.value.y;

  ctx.value.strokeRect(
    startPoint.value.x,
    startPoint.value.y,
    width,
    height
  );
};

const drawCircle = (currentPoint: { x: number; y: number }) => {
  if (!ctx.value) return;

  const radius = Math.sqrt(
    Math.pow(currentPoint.x - startPoint.value.x, 2) +
    Math.pow(currentPoint.y - startPoint.value.y, 2)
  );

  ctx.value.beginPath();
  ctx.value.arc(
    startPoint.value.x,
    startPoint.value.y,
    radius,
    0,
    Math.PI * 2
  );
  ctx.value.stroke();
};

const drawBrush = (currentPoint: { x: number; y: number }) => {
  if (!ctx.value) return;

  ctx.value.lineTo(currentPoint.x, currentPoint.y);
  ctx.value.stroke();
};

// 状态管理
const saveState = () => {
  if (!ctx.value || !canvasRef.value) return;

  // 删除当前步骤之后的历史记录
  history.value = history.value.slice(0, currentStep.value + 1);

  // 保存当前状态
  const imageData = ctx.value.getImageData(
    0,
    0,
    canvasRef.value.width,
    canvasRef.value.height
  );
  history.value.push(imageData);
  currentStep.value++;

  // 更新是否可以撤销
  emit("update:canUndo", currentStep.value > 0);
};

const restoreState = () => {
  if (!ctx.value || !canvasRef.value || currentStep.value < 0) return;

  const imageData = history.value[currentStep.value];
  ctx.value.putImageData(imageData, 0, 0);
};

// 撤销
const undo = () => {
  if (currentStep.value <= 0 || !ctx.value) return;

  currentStep.value--;
  restoreState();
  emit("update:canUndo", currentStep.value > 0);
};

// 导出方法
defineExpose({
  undo,
  getImageData: () => {
    return canvasRef.value?.toDataURL("image/png");
  },
});
</script>

<style lang="scss" scoped>
.screenshot-canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  pointer-events: none;

  &.active {
    pointer-events: auto;
 