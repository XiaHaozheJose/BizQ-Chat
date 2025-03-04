<template>
  <div class="comment-item">
    <div class="comment-header">
      <el-avatar
        :size="32"
        :src="comment.operator?.headImg || ''"
        :alt="comment.operator?.name || ''"
      />
      <div class="comment-info">
        <div class="comment-author">{{ comment.operator?.name }}</div>
        <div class="comment-time">
          {{ formatTime(comment.createdAt || "") }}
        </div>
      </div>
    </div>
    <div class="comment-content">{{ comment.content }}</div>
    <div class="comment-actions">
      <heart-icon
        :is-active="comment.iLiked || false"
        :count="comment.likeCount || 0"
        @click="handleLike"
      />
      <el-button
        v-if="canDelete"
        type="text"
        class="delete-btn"
        @click="handleDelete"
      >
        {{ t("common.delete") }}
      </el-button>
    </div>
    <div v-if="comment.replies?.length" class="comment-replies">
      <comment-item
        v-for="reply in comment.replies"
        :key="reply.id || reply._id"
        :comment="reply"
        :publication-id="publicationId"
        class="reply-item"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useUserStore } from "@/store/user";
import { usePublicationStore } from "@/store/publication";
import type { Comment } from "@/types";
import HeartIcon from "./icons/HeartIcon.vue";
import { formatTime } from "@/utils";

const props = defineProps<{
  comment: Comment;
  publicationId: string;
}>();

const { t } = useI18n();
const userStore = useUserStore();
const publicationStore = usePublicationStore();

const canDelete = computed(() => {
  return (
    props.comment.operatorId === userStore.currentUser?.id ||
    props.comment.operator?.id === userStore.currentUser?.id
  );
});

const handleLike = async () => {
  try {
    await publicationStore.likeComment({
      publicationActivityId: props.comment.id || props.comment._id || "",
      publicationId: props.publicationId,
    });
  } catch (error) {
    console.error("Failed to like comment:", error);
  }
};

const handleDelete = async () => {
  try {
    await publicationStore.deleteComment({
      publicationActivityId: props.comment.id || props.comment._id || "",
    });
  } catch (error) {
    console.error("Failed to delete comment:", error);
  }
};
</script>

<style lang="scss" scoped>
.comment-item {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &:last-child {
    border-bottom: none;
  }

  .comment-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;

    .comment-info {
      .comment-author {
        font-weight: 500;
        color: var(--el-text-color-primary);
      }

      .comment-time {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .comment-content {
    margin-bottom: 12px;
    color: var(--el-text-color-primary);
    line-height: 1.5;
  }

  .comment-actions {
    display: flex;
    align-items: center;
    gap: 16px;

    .delete-btn {
      color: var(--el-text-color-secondary);
      padding: 8px 16px;

      &:hover {
        color: var(--el-color-danger);
      }
    }
  }

  .comment-replies {
    margin-top: 16px;
    margin-left: 48px;
    border-left: 2px solid var(--el-border-color-lighter);

    .reply-item {
      padding-left: 16px;
    }
  }
}
</style>
