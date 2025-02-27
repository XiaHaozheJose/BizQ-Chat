<template>
  <div
    class="heart-icon-wrapper"
    :class="{ active: isActive }"
    @click="$emit('click')"
  >
    <el-icon class="like-icon" :class="{ 'is-liked': isActive }">
      <svg v-if="isActive" viewBox="0 0 24 24" class="heart-icon filled">
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
      </svg>
      <svg v-else viewBox="0 0 24 24" class="heart-icon">
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
      </svg>
    </el-icon>
    <span class="like-count" :class="{ 'is-liked': isActive }">
      <slot>{{ count }}</slot>
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isActive: boolean;
  count?: number;
}>();

defineEmits<{
  (e: "click"): void;
}>();
</script>

<style lang="scss" scoped>
.heart-icon-wrapper {
  position: relative;
  will-change: transform;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--el-text-color-regular);
  font-size: 14px;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &.active {
    color: var(--el-color-danger);
  }

  .like-icon {
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    will-change: transform;

    .heart-icon {
      width: 20px;
      height: 20px;
      fill: none;
      stroke: var(--el-text-color-regular);
      stroke-width: 2;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      will-change: transform, fill, stroke;

      &.filled {
        fill: var(--el-color-danger);
        stroke: var(--el-color-danger);
        transform-origin: center;
      }
    }

    &.is-liked {
      filter: drop-shadow(0 0 4px rgba(255, 45, 85, 0.4));

      .heart-icon {
        stroke: var(--el-color-danger);
      }
    }
  }

  .like-count {
    transition:
      transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275),
      color 0.3s ease;
    will-change: transform, color;
    margin-left: 4px;

    &.is-liked {
      color: var(--el-color-danger);
      animation: count-animation 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
  }

  &:active .like-icon {
    transform: scale(1.5);
  }

  &.active .like-icon {
    animation: like-animation 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  &:hover .heart-icon {
    transform: scale(1.1);
  }
}

@keyframes like-animation {
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.2) rotate(-5deg);
  }
  50% {
    transform: scale(1.5) rotate(5deg);
  }
  75% {
    transform: scale(1.2) rotate(-5deg);
  }
  100% {
    transform: scale(1) rotate(0);
  }
}

@keyframes count-animation {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px) scale(1.2);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}
</style>
