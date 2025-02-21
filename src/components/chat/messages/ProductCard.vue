<template>
  <div class="product-card" @click="$emit('click')">
    <!-- 产品图片 -->
    <div class="product-image">
      <el-image
        :src="getImageUrl(product.pictures[0], 'medium')"
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

    <!-- 产品信息 -->
    <div class="product-info">
      <!-- 产品名称 -->
      <div class="product-name">{{ product.name }}</div>

      <!-- 价格信息 -->
      <div class="price-info">
        <template v-if="showPrice">
          <span class="price">€{{ formatPrice }}</span>
        </template>
        <template v-else>
          <span class="no-price">{{ t("product.requestPrice") }}</span>
        </template>
      </div>

      <!-- 状态标签 -->
      <div v-if="statusLabel" class="status-label">
        {{ statusLabel }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Picture, Warning } from "@element-plus/icons-vue";
import type { Product } from "@/types/product";
import { getImageUrl } from "@/utils";

const props = defineProps<{
  product: Product;
  showPrice?: boolean;
}>();

defineEmits<{
  (e: "click"): void;
}>();

const { t } = useI18n();

// 格式化价格
const formatPrice = computed(() => {
  const price = props.product.skus[0]?.priceInfo?.level1?.price;
  return price ? price.toFixed(2) : "0.00";
});

// 状态标签
const statusLabel = computed(() => {
  if (!props.product.isAvailable) {
    return t("product.unavailable");
  }
  if (props.product.needBook) {
    return t("product.preSale");
  }
  return "";
});
</script>

<style lang="scss" scoped>
.product-card {
  width: 120px;
  background: var(--el-bg-color);
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  position: relative;

  &:hover {
    background: var(--el-fill-color-light);
  }

  .product-image {
    width: 100%;
    height: 120px;
    overflow: hidden;

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

      .el-icon {
        font-size: 24px;
      }
    }

    .image-error {
      color: var(--el-color-danger);
    }
  }

  .product-info {
    padding: 8px;

    .product-name {
      font-size: 14px;
      line-height: 1.3;
      margin-bottom: 4px;
      color: var(--el-text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .price-info {
      margin-bottom: 4px;

      .price {
        color: var(--el-color-danger);
        font-size: 14px;
        font-weight: 500;
      }

      .no-price {
        color: var(--el-color-primary);
        font-size: 12px;
      }
    }

    .status-label {
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 2px 6px;
      background: var(--el-color-danger);
      color: white;
      font-size: 12px;
      border-radius: 2px;
    }
  }
}
</style>
