<template>
  <div class="app-logo" :style="{ width: size + 'px', height: size + 'px' }">
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      class="logo-svg"
    >
      <!-- 背景圆形 -->
      <circle
        cx="50"
        cy="50"
        r="45"
        class="logo-circle"
      />
      
      <!-- 对话气泡 -->
      <path
        d="M35 30h30c5.5 0 10 4.5 10 10v15c0 5.5-4.5 10-10 10h-5l-10 10-10-10h-5c-5.5 0-10-4.5-10-10V40c0-5.5 4.5-10 10-10z"
        class="logo-bubble"
      />
      
      <!-- 小点装饰 -->
      <circle cx="40" cy="47.5" r="3.5" class="logo-dot" />
      <circle cx="50" cy="47.5" r="3.5" class="logo-dot" />
      <circle cx="60" cy="47.5" r="3.5" class="logo-dot" />
    </svg>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  size?: number
}>()
</script>

<style lang="scss" scoped>
.app-logo {
  display: inline-block;
  
  .logo-svg {
    width: 100%;
    height: 100%;
    animation: logoRotate 30s linear infinite;
  }
  
  .logo-circle {
    fill: url(#gradient);
    opacity: 0.1;
    animation: pulse 3s ease-in-out infinite;
  }
  
  .logo-bubble {
    fill: var(--el-color-primary);
    transform-origin: center;
    animation: bubble 3s ease-in-out infinite;
  }
  
  .logo-dot {
    fill: white;
    transform-origin: center;
    animation: dots 1.5s ease-in-out infinite;
    
    &:nth-child(3) {
      animation-delay: 0.2s;
    }
    
    &:nth-child(4) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes logoRotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes bubble {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.95);
  }
}

@keyframes dots {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.8);
  }
}
</style> 