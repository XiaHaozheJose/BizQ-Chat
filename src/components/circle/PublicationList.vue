<template>
  <div class="publication-list-container">
    <div ref="scrollbarRef" class="publication-list" @scroll="onScroll">
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
        <div
          v-if="!hasMore && !loading && publications.length > 0"
          class="no-more"
        >
          {{ t("common.noMore") }}
        </div>

        <!-- 初始加载骨架屏 -->
        <template v-if="!publications.length && loading">
          <div v-for="i in 3" :key="i" class="skeleton-card">
            <el-skeleton :rows="3" animated />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { Loading } from "@element-plus/icons-vue";
import type { Publication } from "@/types";
import PublicationCard from "./PublicationCard.vue";
import { throttle } from "@/utils";

const { t } = useI18n();
const scrollbarRef = ref<HTMLElement>();

const props = defineProps<{
  publications: Publication[];
  loading: boolean;
  hasMore: boolean;
}>();

const emit = defineEmits<{
  (e: "loadMore"): void;
}>();

// 检查是否应该加载更多
const shouldLoadMore = (element: HTMLElement) => {
  const { scrollHeight, scrollTop, clientHeight } = element;
  // 当滚动到底部或接近底部时触发
  return scrollHeight - scrollTop - clientHeight <= 100;
};

// 处理滚动加载
const handleScroll = throttle(() => {
  const wrap = scrollbarRef.value;
  if (!wrap || props.loading || !props.hasMore) return;

  if (shouldLoadMore(wrap)) {
    emit("loadMore");
  }
}, 100); // 降低节流时间以提高响应性

// 处理触底检测
const handleScrollEnd = () => {
  const wrap = scrollbarRef.value;
  if (!wrap || props.loading || !props.hasMore) return;

  // 如果已经滚动到底部，立即触发加载
  if (shouldLoadMore(wrap)) {
    emit("loadMore");
  }
};

// 监听滚动结束
let scrollTimeout: NodeJS.Timeout;
const onScroll = () => {
  handleScroll();

  // 清除之前的定时器
  clearTimeout(scrollTimeout);

  // 设置新的定时器，检测滚动是否结束
  scrollTimeout = setTimeout(() => {
    handleScrollEnd();
  }, 150);
};

onMounted(() => {
  // 初始检查是否需要加载更多
  setTimeout(() => {
    handleScrollEnd();
  }, 500);
});

onUnmounted(() => {
  clearTimeout(scrollTimeout);
});
</script>

<style lang="scss" scoped>
.publication-list-container {
  height: 100%;
  position: relative;
  padding: 0 10px;
  overflow: hidden;

  .publication-list {
    height: 100%;
    overflow: auto;

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
    background: rgba(0, 0, 0, 0.6);
    border-radius: 20px;
    padding: 8px 16px;

    .loading-content {
      display: flex;
      align-items: center;
      gap: 8px;
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

// Override Element Plus tab content padding
:deep(.el-tabs--border-card > .el-tabs__content) {
  padding: 0;
}
</style>
