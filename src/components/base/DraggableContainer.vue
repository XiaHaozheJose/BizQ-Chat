<template>
  <div
    class="draggable-container"
    :class="{
      'with-system-buttons': hasSystemButtons,
      'with-border': withBorder,
    }"
    :style="{
      padding: padding,
      height: height,
    }"
  >
    <slot name="before" />
    <slot />
    <slot name="after" />
  </div>
</template>

<script setup lang="ts">
defineProps({
  // Whether to include space for system buttons
  hasSystemButtons: {
    type: Boolean,
    default: false,
  },
  // Whether to add a bottom border
  withBorder: {
    type: Boolean,
    default: false,
  },
  // Custom padding
  padding: {
    type: String,
    default: "16px",
  },
  // Custom height
  height: {
    type: String,
    default: "auto",
  },
});
</script>

<style lang="scss" scoped>
.draggable-container {
  position: relative;
  -webkit-app-region: drag;
  background-color: var(--el-bg-color);

  // System buttons area
  &.with-system-buttons {
    &::before {
      content: "";
      display: block;
      width: 100%;
      height: 32px;
      -webkit-app-region: drag;
    }
  }

  // Optional bottom border
  &.with-border {
    border-bottom: 1px solid var(--el-border-color-light);
  }

  :deep(.no-drag) {
    -webkit-app-region: no-drag;
  }
}
</style>
