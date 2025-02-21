<template>
  <message-base
    :message="message"
    :sender-avatar="senderAvatar"
    :is-shop="isShop"
    :sender-name="senderName"
  >
    <div class="product-message" v-loading="loading">
      <!-- 产品列表 -->
      <div class="products-list">
        <el-scrollbar>
          <div class="products-container">
            <product-card
              v-for="product in productList"
              :key="product.id"
              :product="product"
              :show-price="!needApply"
              @click="handleProductClick(product)"
            />
          </div>
        </el-scrollbar>
      </div>

      <!-- 状态区域 -->
      <div class="status-area" v-if="needApply">
        <el-button type="primary" size="small" @click="handleApplyClick">
          {{ t("product.applyToView") }}
        </el-button>
      </div>
    </div>
  </message-base>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import type { Message } from "@/types";
import type { Product } from "@/types/product";
import { ProductMessageApplyStatus } from "@/types/product";
import MessageBase from "./MessageBase.vue";
import ProductCard from "./ProductCard.vue";
import { useProductStore } from "@/store/product";
import { parseProductMessageContent } from "@/utils/message";

const props = defineProps<{
  message: Message;
  senderAvatar?: string;
  isShop?: boolean;
  senderName?: string;
}>();

const { t } = useI18n();
const productStore = useProductStore();
const loading = ref(false);
const productList = ref<Product[]>([]);
const applyStatus = ref<ProductMessageApplyStatus>(
  ProductMessageApplyStatus.NONE_APPLY
);

// 是否需要申请查看
const needApply = computed(() => {
  return applyStatus.value === ProductMessageApplyStatus.NEED_APPLY;
});

// 获取产品信息
const fetchProductInfo = async () => {
  loading.value = true;
  try {
    const { productsIds } = parseProductMessageContent(props.message.content);
    productList.value = await productStore.fetchProducts(productsIds);
  } catch (error) {
    console.error("Failed to fetch product info:", error);
  } finally {
    loading.value = false;
  }
};

// 处理产品点击
const handleProductClick = (product: Product) => {
  if (needApply.value) {
    handleApplyClick();
    return;
  }
  // TODO: 实现产品详情查看逻辑
  console.log("View product:", product.id);
};

// 处理申请点击
const handleApplyClick = () => {
  // TODO: 实现申请查看逻辑
  console.log("Apply to view products");
};

onMounted(() => {
  fetchProductInfo();
});
</script>

<style lang="scss" scoped>
.product-message {
  min-width: 144px; // One product (120px) + padding (12px * 2)
  max-width: 300px; // 2.5 products (300px) + padding (12px * 2)
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;

  .products-list {
    padding: 12px;

    :deep(.el-scrollbar__wrap) {
      overflow-x: auto;
      overflow-y: hidden;
    }

    .products-container {
      display: flex;
      flex-direction: row;
      gap: 12px;
      // Set min-width to ensure all products are shown in scroll
      min-width: min-content;
    }
  }

  .status-area {
    padding: 12px;
    border-top: 1px solid var(--el-border-color-light);
    text-align: center;
  }
}
</style>
