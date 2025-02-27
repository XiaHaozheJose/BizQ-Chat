<template>
  <div class="publication-list-container">
    <el-scrollbar
      ref="scrollbarRef"
      class="publication-list"
      @scroll="handleScroll"
    >
      <div class="list-content">
        <publication-card
          v-for="publication in publications"
          :key="publication.id"
          :publication="publication"
        />

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <div class="loading-content">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>{{ t("common.loading") }}</span>
          </div>
        </div>

        <!-- 无更多数据 -->
        <div v-if="!hasMore && !loading" class="no-more">
          {{ t("common.noMore") }}
        </div>

        <!-- 初始加载骨架屏 -->
        <template v-if="!publications.length && loading">
          <div v-for="i in 3" :key="i" class="skeleton-card">
            <el-skeleton :rows="3" animated />
          </div>
        </template>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Loading } from "@element-plus/icons-vue";
import type { Publication } from "@/types";
import type { ScrollbarInstance } from "element-plus";
import PublicationCard from "./PublicationCard.vue";
import { throttle } from "@/utils";

const { t } = useI18n();
const scrollbarRef = ref<ScrollbarInstance>();

defineProps<{
  publications: Publication[];
  loading: boolean;
  hasMore: boolean;
}>();

const emit = defineEmits<{
  (e: "loadMore"): void;
}>();

// 处理滚动加载
const handleScroll = throttle(() => {
  const wrap = scrollbarRef.value?.wrap;
  if (!wrap) return;

  const { scrollHeight, scrollTop, clientHeight } = wrap;

  // 当距离底部小于50px时触发加载
  if (scrollHeight - scrollTop - clientHeight < 50) {
    emit("loadMore");
  }
}, 200);
</script>

<style lang="scss" scoped>
.publication-list-container {
  height: 100%;
  position: relative;
  padding: 0 10px;

  .publication-list {
    height: 100%;

    .list-content {
      padding: 10px 0;
      max-width: 680px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
  }

  .loading-container {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;

    .loading-content {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 20px;
      color: #fff;
      font-size: 14px;

      .el-icon {
        font-size: 16px;
      }
    }
  }

  .no-more {
    text-align: center;
    padding: 20px 0;
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }

  .skeleton-card {
    background: #fff;
    border-radius: 12px;
    padding: 16px;
    margin: 10px auto;
    width: 100%;
    max-width: 680px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
}

// 自定义滚动条样式
:deep(.el-scrollbar__bar) {
  &.is-horizontal {
    display: none;
  }

  &.is-vertical {
    width: 6px;

    .el-scrollbar__thumb {
      background: var(--el-scrollbar-bg-color);
      border-radius: 3px;
    }
  }
}
</style>
