<template>
  <div class="circle-view">
    <!-- 头部区域 -->
    <div class="header-container">
      <draggable-container with-border height="64px">
        <el-input
          v-model="searchText"
          :placeholder="t('common.search')"
          :prefix-icon="IconSearch"
          clearable
          class="no-drag"
        />
        <el-button
          type="primary"
          :icon="Plus"
          class="no-drag publish-btn"
          @click="handlePublish"
        >
          {{ t("circle.publish") }}
        </el-button>
      </draggable-container>
      <el-tabs
        v-model="activeTab"
        type="border-card"
        class="circle-tabs"
        @tab-click="handleTabChange"
      >
        <el-tab-pane :label="t('circle.nearbyCircle')" name="nearby" />
        <el-tab-pane :label="t('circle.publicCircle')" name="public" />
        <el-tab-pane :label="t('circle.followedCircle')" name="followed" />
      </el-tabs>
    </div>

    <!-- 内容区域 -->
    <div class="content-container">
      <div class="tab-content">
        <publication-list
          :publications="publicationStore.publications"
          :loading="publicationStore.loading"
          :has-more="publicationStore.hasMore"
          @load-more="loadMore"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Search as IconSearch, Plus } from "@element-plus/icons-vue";
import { usePublicationStore } from "@/store/publication";
import PublicationList from "@/components/circle/PublicationList.vue";
import DraggableContainer from "@/components/base/DraggableContainer.vue";

const { t } = useI18n();
const publicationStore = usePublicationStore();
const activeTab = ref<"nearby" | "public" | "followed">("public");
const searchText = ref("");

const handleTabChange = async () => {
  await publicationStore.loadPublications(activeTab.value, true);
};

const loadMore = () => {
  publicationStore.loadPublications(activeTab.value);
};

const handlePublish = () => {
  // TODO: 实现发布功能
  console.log("Publish clicked");
};

// 监听搜索文本变化
watch(searchText, (newValue) => {
  // TODO: 实现搜索功能
  console.log("Search text changed:", newValue);
});

onMounted(() => {
  handleTabChange();
});
</script>

<style lang="scss" scoped>
.circle-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);

  .header-container {
    border-bottom: 1px solid var(--el-border-color-light);

    :deep(.draggable-container) {
      display: flex;
      align-items: center;
      padding: 0 20px;
      border-bottom: none;

      .el-input {
        flex: 1;
        margin-right: 16px;
        max-width: 800px;
      }

      .publish-btn {
        min-width: 100px;
      }
    }

    .circle-tabs {
      .el-tabs__header {
        margin: 0;
      }

      .el-tabs--border-card > .el-tabs__content {
        padding: 0px;
      }
      .el-tabs__nav-wrap {
        &::after {
          display: none;
        }
      }

      .el-tabs__nav {
        border: none;
      }
    }
  }

  .content-container {
    flex: 1;
    overflow: hidden;
    padding: 0;

    .tab-content {
      height: 100%;
    }
  }
}
</style>
