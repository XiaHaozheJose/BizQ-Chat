<template>
  <div class="product-list">
    <h2>{{ t("order.productList") }}</h2>
    <div
      v-for="detail in orderDetails"
      :key="detail.productId"
      class="product-group"
    >
      <div class="product-name">{{ detail.productName }}</div>
      <div v-for="sku in detail.skus" :key="sku.skuId" class="product-item">
        <div class="product-image">
          <el-image
            :src="getSkuImage(sku, detail).src"
            :preview-src-list="getSkuImage(sku, detail).previewList"
            fit="cover"
          />
        </div>
        <div class="product-info">
          <div class="sku-info">
            <div class="sku-name">
              {{
                sku.skuInfo?.name ||
                sku.skuInfo?.attribute ||
                t("order.noSpecification")
              }}
            </div>
            <template v-if="sku.shipmentsDetails?.length">
              <order-shipment-info
                :shipments-details="sku.shipmentsDetails"
                :order-detail-id="sku.orderDetailId"
              />
            </template>
            <div v-if="isSkuOutOfStock(sku)" class="stock-status">
              <el-tag size="small" type="danger">
                {{ t("order.outOfStock") }}
              </el-tag>
            </div>
          </div>
          <div class="price-info">
            <!-- 删除线 priceBefore -->
            <span class="price">€{{ sku.price.toFixed(2) }}</span>
            <span class="price-before" v-if="sku.priceBefore !== sku.price">
              <del>€{{ sku.priceBefore?.toFixed(2) }}</del>
            </span>
            <!-- 删除线 quantityBefore -->
            <span class="quantity">x{{ sku.quantity }}</span>
            <span
              class="quantity-before"
              v-if="sku.quantityBefore !== sku.quantity"
            >
              <del>x{{ sku.quantityBefore }}</del>
            </span>
            <span class="subtotal"
              >€{{ (sku.price * sku.quantity).toFixed(2) }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { OrderDetail } from "@/types/order";
import { getSkuImage } from "@/utils";
import OrderShipmentInfo from "./OrderShipmentInfo.vue";

const { t } = useI18n();

defineProps<{
  orderDetails: OrderDetail[];
}>();

const isSkuOutOfStock = (sku: any): boolean => {
  return sku.status === "outOfStock" || sku.availability === "outOfStock";
};
</script>

<style lang="scss" scoped>
.product-list {
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow-light);
  padding: 16px;

  h2 {
    margin: 0 0 16px;
    font-size: 16px;
    color: var(--el-text-color-primary);
    font-weight: 600;
  }

  .product-group {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    .product-name {
      font-weight: 600;
      margin-bottom: 8px;
    }

    .product-item {
      display: flex;
      padding: 8px;
      border-bottom: 1px dashed var(--el-border-color-lighter);

      &:last-child {
        border-bottom: none;
      }

      .product-image {
        width: 80px;
        height: 80px;
        margin-right: 16px;

        .el-image {
          width: 100%;
          height: 100%;
          border-radius: 4px;
        }
      }

      .product-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        .sku-info {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .stock-status {
            margin-top: 4px;
          }
        }

        .price-info {
          display: flex;
          align-items: center;
          gap: 16px;

          .price {
            color: var(--el-color-danger);
          }

          .quantity {
            color: var(--el-text-color-secondary);
          }

          .subtotal {
            color: var(--el-color-danger);
            font-weight: bold;
          }
        }
      }
    }
  }
}
</style>
