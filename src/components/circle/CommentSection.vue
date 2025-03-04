<template>
  <div class="comment-section">
    <!-- Add loading state -->
    <el-skeleton v-if="loading" :rows="3" animated />
    <template v-else>
      <!-- 评论输入框 -->
      <div class="comment-input">
        <div v-if="replyTo" class="reply-indicator">
          {{ t("comment.replyingTo") }} {{ replyTo.operator?.name }}
          <el-button text @click="cancelReply">{{
            t("common.cancel")
          }}</el-button>
        </div>
        <el-input
          v-model="commentText"
          :placeholder="
            replyTo ? t('comment.writeReply') : t('comment.writeComment')
          "
          text
          :maxlength="200"
          show-word-limit
          @keyup.enter="handleComment"
        >
          <template #append>
            <el-button @click="handleComment">{{ t("circle.send") }}</el-button>
          </template>
        </el-input>
      </div>

      <!-- 评论列表 -->
      <div class="comments-list" :class="{ 'in-modal': isModal }">
        <div
          v-for="comment in displayComments"
          :key="comment._id"
          class="comment-item"
        >
          <el-avatar
            :size="32"
            :shape="comment.operator?.logo ? 'square' : 'circle'"
            :src="
              getImageUrl(
                comment.operator?.headImg ?? comment.operator?.logo,
                'small'
              )
            "
          />
          <div class="comment-content">
            <div class="comment-header">
              <span class="comment-author">{{ comment.operator?.name }}</span>
              <span class="comment-time">{{
                formatTime(comment.createdAt || "")
              }}</span>
            </div>
            <p class="comment-text">{{ comment.content }}</p>
            <div class="comment-actions">
              <heart-icon
                :is-active="Boolean(comment.iLiked)"
                :count="comment.likeCount || 0"
                @click="handleLike(comment)"
              />
              <el-button text size="small" @click="startReply(comment)">
                {{ t("comment.reply") }}
              </el-button>
            </div>

            <!-- 回复列表 -->
            <div v-if="comment.replies?.length" class="replies-section">
              <div
                v-for="reply in comment.replies"
                :key="reply._id"
                class="reply-item"
              >
                <el-avatar
                  :size="24"
                  :shape="reply.operator?.logo ? 'square' : 'circle'"
                  :src="
                    getImageUrl(
                      reply.operator?.headImg ?? reply.operator?.logo,
                      'small'
                    )
                  "
                />
                <div class="reply-content">
                  <div class="reply-header">
                    <span class="reply-author">{{ reply.operator?.name }}</span>
                    <span class="reply-time">{{
                      formatTime(reply.createdAt || "")
                    }}</span>
                  </div>
                  <p class="reply-text">{{ reply.content }}</p>
                  <div class="reply-actions">
                    <heart-icon
                      :is-active="Boolean(reply.iLiked)"
                      :count="reply.likeCount || 0"
                      @click="handleLike(reply)"
                    />
                  </div>
                </div>
                <el-icon
                  v-if="isCommentOwner(reply)"
                  class="delete-comment"
                  @click="handleDeleteComment(reply)"
                >
                  <Close />
                </el-icon>
              </div>
            </div>
          </div>
          <el-icon
            v-if="isCommentOwner(comment)"
            class="delete-comment"
            @click="handleDeleteComment(comment)"
          >
            <Close />
          </el-icon>
        </div>
      </div>

      <!-- 查看更多按钮 -->
      <div v-if="!isModal && hasMoreComments" class="view-more">
        <el-button text @click="openCommentModal">
          {{ t("circle.expand") }}
        </el-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { Close } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { Comment } from "@/types/publications";
import { useUserStore } from "@/store/user";
import { usePublicationStore } from "@/store/publication";
import { getImageUrl } from "@/utils";
import { formatTime } from "@/utils/format";
import HeartIcon from "../icons/HeartIcon.vue";

const props = defineProps<{
  comments?: Comment[];
  publicationId: string;
  isModal?: boolean;
  commentCount: number;
}>();

const emit = defineEmits<{
  (e: "update:comments", comments: Comment[]): void;
  (e: "open-modal"): void;
}>();

const { t } = useI18n();
const userStore = useUserStore();

const commentText = ref("");
const replyTo = ref<Comment | null>(null);
const loading = ref(false);

// 计算要显示的评论
const displayComments = computed(() => {
  if (props.isModal) {
    return props.comments || [];
  }
  return (props.comments || []).slice(-3);
});

// 是否有更多评论
const hasMoreComments = computed(() => {
  return props.commentCount > 3;
});

// 判断是否是评论作者
const isCommentOwner = (comment: Comment) => {
  return comment.operatorId === userStore.currentUser?.id;
};

// 开始回复
const startReply = (comment: Comment) => {
  replyTo.value = comment;
  commentText.value = "";
};

// 取消回复
const cancelReply = () => {
  replyTo.value = null;
  commentText.value = "";
};

// 处理评论提交
const handleComment = async () => {
  if (!commentText.value.trim()) return;

  try {
    const response = await usePublicationStore().commentPublication({
      publicationId: props.publicationId,
      content: commentText.value,
      publicationActivityId: replyTo.value?._id,
    });

    commentText.value = "";
    replyTo.value = null;
    ElMessage.success(t("comment.commentSuccess"));
  } catch (error) {
    console.error("Failed to comment:", error);
    ElMessage.error(t("comment.commentFailed"));
  }
};

// 删除评论
const handleDeleteComment = async (comment: Comment) => {
  try {
    await ElMessageBox.confirm(
      t("comment.deleteCommentConfirm"),
      t("common.attention"),
      {
        type: "warning",
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
      }
    );

    await usePublicationStore().deleteComment({
      publicationActivityId: comment._id!,
    });
    ElMessage.success(t("comment.deleteCommentSuccess"));
  } catch (error) {
    if (error !== "cancel") {
      console.error("Failed to delete comment:", error);
      ElMessage.error(t("comment.deleteCommentFailed"));
    }
  }
};

// 打开评论模态框
const openCommentModal = async () => {
  loading.value = true;
  try {
    await usePublicationStore().getComments(props.publicationId);
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    ElMessage.error(t("comment.fetchCommentsFailed"));
  } finally {
    loading.value = false;
  }
  emit("open-modal");
};

// 处理点赞
const handleLike = async (comment: Comment) => {
  try {
    await usePublicationStore().likeComment({
      publicationActivityId: comment._id!,
      publicationId: props.publicationId,
    });
  } catch (error) {
    console.error("Failed to like comment:", error);
    ElMessage.error(t("comment.likeFailed"));
  }
};
</script>

<style lang="scss" scoped>
@use "@/styles/mixins" as *;

.comment-section {
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .comment-input {
    position: relative;
    padding: 16px;
    background: var(--el-bg-color);
    border-radius: 8px 8px 0 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);

    .reply-indicator {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      margin-bottom: 8px;
      background: var(--el-color-primary-light-9);
      border-radius: 4px;
      font-size: 13px;
      color: var(--el-color-primary);
      transition: background 0.2s ease;

      .el-button {
        margin-left: auto;
        padding: 0 4px;
        font-size: 12px;
      }
    }

    .el-input {
      :deep(.el-input__wrapper) {
        // border-radius: 20px;
        background: var(--el-fill-color-blank);
        transition: all 0.3s ease;

        &:hover {
          box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
        }
      }
    }
  }

  .comments-list {
    position: relative;
    padding: 0 16px;

    &.in-modal {
      max-height: 60vh;
      padding-bottom: 16px;
    }

    .comment-item {
      display: flex;
      gap: 5px;
      padding: 16px 0;
      transition: background 0.3s ease;

      &:not(:last-child) {
        border-bottom: 1px solid var(--el-border-color-lighter);
      }

      &:hover {
        background: var(--el-fill-color-light);

        .delete-comment {
          opacity: 1;
        }
      }

      .el-avatar {
        flex-shrink: 0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
      }

      .comment-content {
        flex: 1;
        min-width: 0;

        .comment-header {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 6px;

          .comment-author {
            font-weight: 600;
            font-size: 14px;
            color: var(--el-text-color-primary);
            @include text-ellipsis;
          }

          .comment-time {
            flex-shrink: 0;
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }

        .comment-text {
          font-size: 14px;
          line-height: 1.6;
          color: var(--el-text-color-primary);
          white-space: pre-wrap;
          word-break: break-word;
        }
      }

      .delete-comment {
        opacity: 0;
        margin-left: 8px;
        transition: all 0.2s ease;
      }
    }
  }

  .replies-section {
    margin: 12px 0 0 44px;
    border-left: 1px solid var(--el-color-primary-light-7);

    .reply-item {
      display: flex;
      gap: 12px;
      // padding: 12px 0;
      position: relative;

      &::before {
        position: absolute;
        left: -24px;
        top: 24px;
        width: 16px;
        height: 1px;
        background: var(--el-border-color-lighter);
      }

      .el-avatar {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
      }

      .reply-content {
        flex: 1;
        min-width: 0;

        .reply-header {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 4px;

          .reply-author {
            font-weight: 500;
            font-size: 13px;
            color: var(--el-text-color-primary);
          }

          .reply-time {
            flex-shrink: 0;
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }

        .reply-text {
          font-size: 13px;
          line-height: 1.5;
          color: var(--el-text-color-primary);
          white-space: pre-wrap;
        }
      }
    }
  }

  .comment-actions,
  .reply-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 8px;

    .el-button {
      padding: 0;
      height: 28px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      transition: all 0.2s ease;

      &:hover {
        color: var(--el-color-primary);
        transform: translateY(-1px);
      }
    }

    .heart-icon {
      position: relative;
      top: -1px;
    }
  }

  .view-more {
    .el-button {
      width: 100%;
      padding: 12px;
      color: var(--el-text-color-secondary);
      transition: all 0.3s ease;

      &:hover {
        color: var(--el-color-primary);
        letter-spacing: 0.5px;
      }
    }
  }
}

// 动画增强
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.comment-item,
.reply-item {
  animation: fadeIn 0.4s ease forwards;
}

// 微交互增强
.heart-icon {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &:active {
    transform: scale(1.2);
  }
}

// 响应式调整
@media (max-width: 768px) {
  .comment-section {
    border-radius: 0;
    box-shadow: none;

    .comments-list {
      padding: 0 8px;

      .comment-item {
        padding: 12px 0;

        .comment-content {
          margin-left: 8px;
        }
      }
    }

    .replies-section {
      margin-left: 32px;
      padding-left: 12px;
    }
  }
}
</style>
