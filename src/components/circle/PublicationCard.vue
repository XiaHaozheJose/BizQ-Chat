<template>
  <div class="publication-card">
    <el-skeleton v-if="loading" :rows="3" animated />
    <template v-else>
      <!-- 头部信息 -->
      <div class="card-header">
        <el-avatar
          :size="40"
          :src="getImageUrl(getOwnerAvatar, 'medium')"
          :shape="isShop ? 'square' : 'circle'"
        />
        <div class="author-info">
          <div class="name">{{ publication.owner?.name }}</div>
          <div class="meta">
            <span class="time">{{
              formatTime(publication.createdAt || "")
            }}</span>
            <span v-if="publication.distance" class="distance">
              {{ formatDistance(publication.distance) }}
            </span>
          </div>
        </div>
        <el-dropdown trigger="click" @command="handleCommand">
          <el-icon class="menu-icon"><MoreFilled /></el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="share">{{
                t("circle.share")
              }}</el-dropdown-item>
              <el-dropdown-item
                v-if="isOwner"
                command="delete"
                divided
                class="danger"
                >{{ t("circle.delete") }}</el-dropdown-item
              >
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- 内容区域 -->
      <div class="card-content">
        <!-- 文本内容 -->
        <div v-if="publication.contentText" class="text-content">
          <p
            v-if="!expanded && publication.contentText.length > 100"
            class="truncated"
          >
            {{ publication.contentText.slice(0, 100) }}...
            <span class="expand-btn" @click="expanded = true">{{
              t("circle.expand")
            }}</span>
          </p>
          <p v-else>
            {{ publication.contentText }}
            <span
              v-if="publication.contentText.length > 100"
              class="expand-btn"
              @click="expanded = false"
              >{{ t("circle.collapse") }}</span
            >
          </p>
        </div>

        <!-- 图片类型内容 -->
        <div
          v-if="
            publication.contentType === ContentTypeEnum.Graphic &&
            publication.contentArray?.length
          "
          class="image-grid"
          :class="getImageGridClass(publication.contentArray.length)"
        >
          <el-image
            v-for="(image, index) in publication.contentArray"
            :key="index"
            :src="getImageUrl(image, 'medium')"
            :preview-src-list="
              publication.contentArray.map((img) => getImageUrl(img, 'origin'))
            "
            fit="cover"
            lazy
            loading="lazy"
            @click="handleImageClick(index)"
          >
            <template #placeholder>
              <div class="image-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
            <template #error>
              <div class="image-error">
                <el-icon><Warning /></el-icon>
              </div>
            </template>
          </el-image>
        </div>

        <!-- 商品类型内容 -->
        <div
          v-if="
            publication.contentType === ContentTypeEnum.Product &&
            publication.products?.length
          "
          class="product-grid"
        >
          <div
            v-for="product in publication.products"
            :key="product.id"
            class="product-item"
          >
            <el-image
              :src="getImageUrl(product.pictures[0], 'medium')"
              fit="cover"
              class="product-image"
            >
              <template #placeholder>
                <div class="image-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div class="product-info">
              <div class="product-name">{{ product.name }}</div>
              <div class="product-price">
                <span class="currency">€</span>
                <span class="amount">{{ formatProductPrice(product) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 优惠券类型内容 -->
        <div
          v-if="
            publication.contentType === ContentTypeEnum.Coupon &&
            publication.coupons?.length
          "
          class="coupon-grid"
        >
          <div
            v-for="coupon in publication.coupons"
            :key="coupon._id"
            class="coupon-item"
          >
            <div class="coupon-content">
              <div class="coupon-amount">
                <span class="amount">{{ formatCouponAmount(coupon) }}</span>
                <span class="unit">{{ getCouponUnit(coupon) }}</span>
              </div>
              <div class="coupon-info">
                <div class="coupon-name">{{ coupon.remark }}</div>
                <div class="coupon-validity">
                  {{ t("coupon.validUntil") }}:
                  {{ formatCouponValidity(coupon.useExpiredDate) }}
                </div>
              </div>
            </div>
            <div class="coupon-footer">
              <el-tag size="small" :type="getCouponStatusType(coupon)">{{
                getCouponStatusText(coupon)
              }}</el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作区 -->
      <div class="card-footer">
        <heart-icon
          :is-active="isLiked"
          :count="publication.likeCount || 0"
          @click="handleLike"
        />
        <div class="action-item" @click="showComments = !showComments">
          <el-icon><ChatDotRound /></el-icon>
          <span>{{ publication.commentCount || 0 }}</span>
        </div>
        <div class="action-item" @click="handleShare">
          <el-icon><Share /></el-icon>
          <span>{{ t("circle.share") }}</span>
        </div>
      </div>

      <!-- 评论区域 -->
      <div v-show="showComments" class="comments-section">
        <div class="comments-list">
          <div
            v-for="comment in publication.comments"
            :key="comment._id"
            class="comment-item"
          >
            <el-avatar
              :size="32"
              :src="getImageUrl(comment.operator?.avatar, 'small')"
            />
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-author">{{ comment.operator?.name }}</span>
                <span class="comment-time">{{
                  formatTime(comment.createdAt || "")
                }}</span>
              </div>
              <p class="comment-text">{{ comment.content }}</p>
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

        <div class="comment-input">
          <el-input
            v-model="commentText"
            :placeholder="t('circle.writeComment')"
            type="text"
            :maxlength="200"
            show-word-limit
            @keyup.enter="handleComment"
          >
            <template #append>
              <el-button @click="handleComment">{{
                t("circle.send")
              }}</el-button>
            </template>
          </el-input>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  MoreFilled,
  ChatDotRound,
  Share,
  Picture,
  Warning,
  Close,
} from "@element-plus/icons-vue";
import HeartIcon from "@/components/icons/HeartIcon.vue";
import type { Publication, Comment } from "@/types/publications";
import type { Product } from "@/types/product";
import type { Coupon } from "@/types/cupons";
import { ContentTypeEnum } from "@/types/publications";
import { getImageUrl } from "@/utils";
import { formatTime, formatDistance } from "@/utils/format";
import { useUserStore } from "@/store/user";
import { usePublicationStore } from "@/store/publication";
import { ElMessage, ElMessageBox } from "element-plus";
import { UserType } from "@/types";

const props = defineProps<{
  publication: Publication;
}>();

const { t } = useI18n();
const userStore = useUserStore();
const publicationStore = usePublicationStore();

const loading = ref(false);
const expanded = ref(false);
const showComments = ref(false);
const commentText = ref("");

// 是否是发布者
const isOwner = computed(() => {
  return props.publication.ownerId === userStore.currentUser?.id;
});

// 获取发布者头像
const getOwnerAvatar = computed(() => {
  const owner = props.publication.owner;
  return owner?.headImg ?? owner?.logo;
});

// 获取是否是店铺
const isShop = computed(() => {
  return props.publication.ownerType === UserType.Shop;
});

// 是否已点赞
const isLiked = computed(() => {
  return !!props.publication.likes?.some(
    (like) => like.operatorId === userStore.currentUser?.id
  );
});

// 获取图片网格类名
const getImageGridClass = (count: number) => {
  if (count === 1) return "single";
  if (count === 2) return "double";
  if (count === 3) return "triple";
  if (count === 4) return "quad";
  return "grid";
};

// 处理图片点击
const handleImageClick = (index: number) => {
  // 已通过 el-image 的 preview-src-list 处理预览
};

// 处理点赞
const handleLike = async () => {
  try {
    // 直接调用API, 让store处理状态更新
    const response = await publicationStore.likePublication(
      props.publication.id!
    );
    // 如果返回的不是空对象,说明有错误
    if (response && Object.keys(response).length > 0) {
      throw new Error("Like operation failed");
    }
  } catch (error) {
    console.error("Failed to like publication:", error);
    ElMessage.error(t("circle.likeFailed"));
  }
};

// 处理评论
const handleComment = async () => {
  if (!commentText.value.trim()) return;

  try {
    loading.value = true;
    await publicationStore.commentPublication({
      publicationId: props.publication.id!,
      content: commentText.value,
    });
    commentText.value = "";
    ElMessage.success(t("circle.commentSuccess"));
  } catch (error) {
    console.error("Failed to comment:", error);
    ElMessage.error(t("circle.commentFailed"));
  } finally {
    loading.value = false;
  }
};

// 判断是否是评论作者
const isCommentOwner = (comment: Comment) => {
  return comment.operatorId === userStore.currentUser?.id;
};

// 删除评论
const handleDeleteComment = async (comment: Comment) => {
  try {
    await ElMessageBox.confirm(
      t("circle.deleteCommentConfirm"),
      t("common.warning"),
      {
        type: "warning",
      }
    );

    loading.value = true;
    await publicationStore.deleteComment({
      publicationActivityId: comment._id!,
    });
    ElMessage.success(t("circle.deleteCommentSuccess"));
  } catch (error) {
    if (error !== "cancel") {
      console.error("Failed to delete comment:", error);
      ElMessage.error(t("circle.deleteCommentFailed"));
    }
  } finally {
    loading.value = false;
  }
};

// 处理分享
const handleShare = () => {
  // TODO: 实现分享功能
  ElMessage.info(t("common.comingSoon"));
};

// 处理下拉菜单命令
const handleCommand = async (command: string) => {
  if (command === "delete") {
    try {
      await ElMessageBox.confirm(
        t("circle.deletePublicationConfirm"),
        t("common.warning"),
        {
          type: "warning",
        }
      );
      // TODO: 实现删除动态功能
      ElMessage.success(t("circle.deleteSuccess"));
    } catch (error) {
      if (error !== "cancel") {
        ElMessage.error(t("circle.deleteFailed"));
      }
    }
  } else if (command === "share") {
    handleShare();
  }
};

// 格式化商品价格
const formatProductPrice = (product: Product) => {
  const price = product.skus[0]?.priceInfo?.level1?.price;
  return price ? price.toFixed(2) : "0.00";
};

// 格式化优惠券金额
const formatCouponAmount = (coupon: Coupon) => {
  if (coupon.deductionValue) {
    return coupon.deductionValue;
  }
  if (coupon.discountValue) {
    return coupon.discountValue;
  }
  return 0;
};

// 获取优惠券单位
const getCouponUnit = (coupon: Coupon) => {
  if (coupon.deductionValue) {
    return "€";
  }
  if (coupon.discountValue) {
    return "%";
  }
  return "";
};

// 获取优惠券状态类型
const getCouponStatusType = (coupon: Coupon) => {
  const now = new Date();
  const expireDate = coupon.useExpiredDate
    ? new Date(coupon.useExpiredDate)
    : null;

  if (coupon.isDeleted) return "danger";
  if (expireDate && now > expireDate) return "danger";
  if (coupon.useStatus === "used") return "info";
  return "success";
};

// 获取优惠券状态文本
const getCouponStatusText = (coupon: Coupon) => {
  const now = new Date();
  const expireDate = coupon.useExpiredDate
    ? new Date(coupon.useExpiredDate)
    : null;

  if (coupon.isDeleted) return t("coupon.deleted");
  if (expireDate && now > expireDate) return t("coupon.expired");
  if (coupon.useStatus === "used") return t("coupon.used");
  return t("coupon.valid");
};

// 格式化优惠券状态文本
const formatCouponValidity = (date?: string) => {
  if (!date) return "";
  return formatTime(date);
};
</script>

<style lang="scss" scoped>
@use "@/styles/mixins" as *;
.publication-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  will-change: transform, box-shadow;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  }

  .card-header {
    display: flex;
    align-items: center;
    margin-bottom: 16px;

    .author-info {
      margin-left: 12px;
      flex: 1;

      .name {
        font-weight: 600;
        font-size: 15px;
        color: var(--el-text-color-primary);
      }

      .meta {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        margin-top: 2px;

        .distance {
          margin-left: 8px;
          &:before {
            content: "•";
            margin-right: 8px;
          }
        }
      }
    }

    .menu-icon {
      padding: 8px;
      cursor: pointer;
      border-radius: 50%;
      transition: all 0.2s ease;

      &:hover {
        background: var(--el-fill-color-light);
      }
    }
  }

  .card-content {
    margin-bottom: 16px;

    .text-content {
      font-size: 14px;
      line-height: 1.6;
      color: var(--el-text-color-primary);
      margin-bottom: 12px;

      .expand-btn {
        color: var(--el-color-primary);
        cursor: pointer;
        margin-left: 4px;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .image-grid {
      display: grid;
      gap: 4px;
      border-radius: 8px;
      overflow: hidden;

      &.single {
        grid-template-columns: 1fr;

        .el-image {
          aspect-ratio: 16/9;
          max-height: 400px;
        }
      }

      &.double {
        grid-template-columns: repeat(2, 1fr);

        .el-image {
          aspect-ratio: 1;
        }
      }

      &.triple {
        grid-template-columns: repeat(3, 1fr);

        .el-image {
          aspect-ratio: 1;
        }
      }

      &.quad {
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(2, 1fr);

        .el-image {
          aspect-ratio: 1;
        }
      }

      &.grid {
        grid-template-columns: repeat(3, 1fr);

        .el-image {
          aspect-ratio: 1;
        }
      }

      .el-image {
        width: 100%;
        height: 100%;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          opacity: 0.9;
        }
      }

      .image-placeholder,
      .image-error {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--el-fill-color-light);
        color: var(--el-text-color-secondary);

        .el-icon {
          font-size: 24px;
        }
      }
    }

    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 12px;

      .product-item {
        background: var(--el-bg-color);
        border-radius: 8px;
        overflow: hidden;
        transition: all 0.3s ease;
        border: 1px solid var(--el-border-color-lighter);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .product-image {
          width: 100%;
          aspect-ratio: 1;
        }

        .product-info {
          padding: 12px;

          .product-name {
            font-size: 14px;
            font-weight: 500;
            color: var(--el-text-color-primary);
            margin-bottom: 8px;
            @include text-ellipsis;
          }

          .product-price {
            color: var(--el-color-danger);
            font-weight: 600;

            .currency {
              font-size: 12px;
            }

            .amount {
              font-size: 16px;
            }
          }
        }
      }
    }

    .coupon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 16px;
      margin-top: 12px;

      .coupon-item {
        background: var(--el-bg-color);
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--el-border-color-lighter);
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .coupon-content {
          display: flex;
          padding: 16px;
          background: linear-gradient(
            135deg,
            var(--el-color-primary-light-9) 0%,
            var(--el-color-primary-light-8) 100%
          );

          .coupon-amount {
            display: flex;
            align-items: baseline;
            color: var(--el-color-primary);
            margin-right: 16px;
            flex-shrink: 0;

            .amount {
              font-size: 28px;
              font-weight: 600;
            }

            .unit {
              font-size: 14px;
              margin-left: 2px;
            }
          }

          .coupon-info {
            flex: 1;
            min-width: 0;

            .coupon-name {
              font-size: 16px;
              font-weight: 500;
              color: var(--el-text-color-primary);
              margin-bottom: 4px;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              word-break: break-word;
              line-height: 1.3;
            }

            .coupon-validity {
              font-size: 12px;
              color: var(--el-text-color-secondary);
            }
          }
        }

        .coupon-footer {
          padding: 8px 16px;
          border-top: 1px solid var(--el-border-color-lighter);
          display: flex;
          justify-content: flex-end;
        }
      }
    }
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 12px 0;
    border-top: 1px solid var(--el-border-color-lighter);
    margin: 0 -16px;
    padding: 0 16px;

    .action-item {
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
        color: var(--el-color-primary);
      }

      .el-icon {
        font-size: 16px;
      }
    }

    .like-button {
      position: relative;
      will-change: transform;

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
          animation: count-animation 0.3s
            cubic-bezier(0.175, 0.885, 0.32, 1.275);
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
  }

  .comments-section {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);

    .comments-list {
      max-height: 300px;
      overflow-y: auto;
      margin-bottom: 16px;

      .comment-item {
        display: flex;
        align-items: flex-start;
        padding: 8px 0;
        position: relative;

        &:not(:last-child) {
          border-bottom: 1px solid var(--el-border-color-lighter);
        }

        .comment-content {
          margin-left: 12px;
          flex: 1;

          .comment-header {
            display: flex;
            align-items: center;
            margin-bottom: 4px;

            .comment-author {
              font-weight: 500;
              font-size: 14px;
              color: var(--el-text-color-primary);
            }

            .comment-time {
              font-size: 12px;
              color: var(--el-text-color-secondary);
              margin-left: 8px;
            }
          }

          .comment-text {
            font-size: 14px;
            line-height: 1.5;
            color: var(--el-text-color-primary);
            margin: 0;
          }
        }

        .delete-comment {
          padding: 4px;
          cursor: pointer;
          color: var(--el-text-color-secondary);
          transition: all 0.2s ease;

          &:hover {
            color: var(--el-color-danger);
          }
        }
      }
    }

    .comment-input {
      .el-input {
        .el-input__wrapper {
          border-radius: 20px;
        }
      }
    }
  }
}

// 下拉菜单样式
:deep(.el-dropdown-menu__item) {
  &.danger {
    color: var(--el-color-danger);
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

@mixin text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
