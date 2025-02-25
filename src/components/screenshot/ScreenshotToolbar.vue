<template>
  <div class="screenshot-toolbar" :style="position">
    <el-button-group class="tool-group">
      <el-button
        v-for="tool in drawingTools"
        :key="tool.name"
        :class="{ active: modelValue === tool.name }"
        @click="$emit('update:modelValue', tool.name)"
      >
        <el-icon><component :is="tool.icon" /></el-icon>
      </el-button>
    </el-button-group>

    <el-button-group class="action-group">
      <el-button @click="$emit('undo')" :disabled="!canUndo">
        <el-icon><Back /></el-icon>
      </el-button>
      <el-button @click="$emit('finish')">
        <el-icon><Check /></el-icon>
      </el-button>
      <el-button @click="$emit('cancel')">
        <el-icon><Close /></el-icon>
      </el-button>
    </el-button-group>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import type { PropType } from "vue";

// 定义工具类型
type Tool = "rectangle" | "circle" | "brush" | "text";

// 定义props
const props = defineProps({
  modelValue: {
    type: String as PropType<Tool>,
    required: true,
  },
  canUndo: {
    type: Boolean,
    default: false,
  },
  x: {
    type: Number,
    required: true,
  },
  y: {
    type: Number,
    required: true,
  },
});

// 定义事件
defineEmits<{
  (e: "update:modelValue", value: Tool): void;
  (e: "undo"): void;
  (e: "finish"): void;
  (e: "cancel"): void;
}>();

// 工具列表
const drawingTools = [
  { name: "rectangle" as const, icon: "Rectangle" },
  { name: "circle" as const, icon: "CirclePlus" },
  { name: "brush" as const, icon: "Edit" },
  { name: "text" as const, icon: "TextWidth" },
];

// 计算工具栏位置
const position = computed(() => ({
  transform: `translate(${props.x}px, ${props.y}px)`,
}));
</script>

<style lang="scss" scoped>
.screenshot-toolbar {
  position: fixed;
  display: flex;
  gap: 8px;
  padding: 4px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .el-button {
    padding: 8px;

    &.active {
      background: #ecf5ff;
      color: #409eff;
    }
  }
}
</style>
