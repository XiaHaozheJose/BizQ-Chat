<template>
  <message-base
    :message="message"
    :sender-avatar="senderAvatar"
    :is-shop="isShop"
    :sender-name="senderName"
  >
    <div class="order-message" v-loading="loading" @click="openOrderDetail">
      <!-- 订单号 -->
      <div class="order-header">
        <span class="order-number"
          >{{ t("order.orderNumber") }}: {{ orderInfo?.orderNumber }}</span
        >
        <slot name="header-extra"></slot>
      </div>

      <!-- 商品图片列表 -->
      <div class="products-list">
        <el-scrollbar>
          <div class="products-container">
            <div
              v-for="detail in orderInfo?.orderDetails"
              :key="detail.productId"
              class="product-item"
            >
              <el-image
                :src="getImageUrl(detail.productPictures[0])"
                fit="cover"
                loading="lazy"
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
          </div>
        </el-scrollbar>
      </div>

      <!-- 订单信息 -->
      <div class="order-info">
        <div class="info-row">
          <span class="price">€{{ formatPrice }}</span>
          <span class="quantity"
            >{{ orderInfo?.totalCount }} {{ t("order.pieces") }}</span
          >
        </div>
      </div>

      <!-- 状态区域插槽 -->
      <slot name="status-area"></slot>

      <!-- 底部操作区域插槽 -->
      <slot name="action-area"></slot>
    </div>
  </message-base>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import MessageBase from "./MessageBase.vue";
import type { Message } from "@/types";
import type { Order } from "@/types/order";
import { Picture, Warning } from "@element-plus/icons-vue";
import { getOrderDetail } from "@/services/api/order";
import { getImageUrl } from "@/utils";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
  message: Message;
  senderAvatar?: string;
  isShop?: boolean;
  senderName?: string;
}>();

const loading = ref(false);
const orderInfo = ref<Order | null>(null);

// 格式化价格显示
const formatPrice = computed(() => {
  if (!orderInfo.value) return "0.00";
  return orderInfo.value.amount.toFixed(2);
});

// 获取订单信息
const fetchOrderInfo = async () => {
  if (!props.message.content) return;

  loading.value = true;
  try {
    const data = await getOrderDetail({
      orderId: props.message.content,
    });
    orderInfo.value = data;
  } catch (error) {
    console.error("Failed to fetch order info:", error);
  } finally {
    loading.value = false;
  }
};

// 打开订单详情
const openOrderDetail = () => {
  if (!orderInfo.value?.id) return;
  const url = `https://m.dev.bizq.com/uc/order-detail?id=${orderInfo.value.id}`;
  // Use the correct API structure
  window.electronAPI?.navigation.navigate(url);
};

defineExpose({
  orderInfo,
  loading,
  fetchOrderInfo,
});
</script>

<style lang="scss" scoped>
.order-message {
  width: 300px;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;

  .order-header {
    padding: 12px;
    border-bottom: 1px solid var(--el-border-color-light);
    display: flex;
    justify-content: space-between;
    align-items: center;

    .order-number {
      font-size: 14px;
      color: var(--el-text-color-regular);
    }
  }

  .products-list {
    height: 100px;
    padding: 8px;
    border-bottom: 1px solid var(--el-border-color-light);

    .products-container {
      display: flex;
      gap: 8px;
      height: 100%;

      .product-item {
        width: 84px;
        height: 84px;
        flex-shrink: 0;
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid var(--el-border-color-light);

        .el-image {
          width: 100%;
          height: 100%;
        }

        .image-placeholder,
        .image-error {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--el-fill-color);
          color: var(--el-text-color-secondary);
        }

        .image-error {
          color: var(--el-color-danger);
        }
      }
    }
  }

  .order-info {
    padding: 12px;
    border-bottom: 1px solid var(--el-border-color-light);

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .price {
        font-size: 16px;
        font-weight: 500;
        color: var(--el-color-danger);
      }

      .quantity {
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}
</style>
