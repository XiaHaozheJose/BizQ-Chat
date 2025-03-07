<template>
  <div class="price-summary-box">
    <h3>{{ title }}</h3>
    <div
      v-for="(summary, index) in productPriceSummary"
      :key="index"
      class="summary-group"
    >
      <div class="summary-item">
        <span class="label">{{ t("order.vatBase") }}:</span>
        <span class="value">{{ formatPrice(summary.taxBase) }}</span>
      </div>
      <div class="summary-item">
        <span class="label">{{ t("order.vat") }} ({{ summary.taxPct }}%):</span>
        <span class="value">{{
          formatPrice((summary.taxBase * summary.taxPct) / 100)
        }}</span>
      </div>
      <div class="summary-item">
        <span class="label">{{ t("order.subtotal") }}:</span>
        <span class="value">{{ formatPrice(summary.subtotal) }}</span>
      </div>
    </div>

    <div class="order-summary">
      <div class="summary-item">
        <span class="label">{{ t("order.subtotal") }}:</span>
        <span class="value">{{ formatPrice(subtotal) }}</span>
      </div>
      <div class="summary-item">
        <span class="label">{{ t("order.shipping") }}:</span>
        <span class="value">{{ formatPrice(shippingCost) }}</span>
      </div>
      <div v-if="retentionTax > 0" class="summary-item">
        <span class="label">{{ t("order.retentionTax") }}:</span>
        <span class="value">{{ formatPrice(retentionTax) }}</span>
      </div>
      <div
        v-if="productDiscount > 0 || customerDiscount > 0 || moreDiscount > 0"
        class="summary-item discount"
      >
        <span class="label">{{ t("order.discount") }}:</span>
        <span class="value"
          >-{{
            formatPrice(productDiscount + customerDiscount + moreDiscount)
          }}</span
        >
      </div>
      <div v-if="couponedValue > 0" class="summary-item discount">
        <span class="label">{{ t("order.couponDiscount") }}:</span>
        <span class="value">-{{ formatPrice(couponedValue) }}</span>
      </div>

      <div class="summary-item total">
        <span class="label">{{ t("order.total") }}:</span>
        <span class="value">{{ formatPrice(total) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { ProductPriceSummary } from "@/types/order";

const { t } = useI18n();

const props = defineProps<{
  title: string;
  productPriceSummary: ProductPriceSummary[];
  subtotal: number;
  shippingCost: number;
  retentionTax: number;
  productDiscount: number;
  customerDiscount: number;
  moreDiscount: number;
  couponedValue: number;
  total: number;
}>();

const formatPrice = (price: number) => `€${price.toFixed(2)}`;
</script>

<style scoped>
.price-summary-box {
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
}

.price-summary-box h3 {
  margin-bottom: 10px;
  font-size: 1em;
  font-weight: bold;
}

.summary-group {
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #f0f0f0;
}

.summary-group:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9em;
}

.summary-item .label {
  color: #666;
}

.summary-item .value {
  font-weight: bold;
}

.order-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-summary .summary-item.total {
  font-size: 1.1em;
  font-weight: bold;
  margin-top: 8px;
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
}

.summary-item.discount .value {
  color: #ff4d4f;
}
</style>
