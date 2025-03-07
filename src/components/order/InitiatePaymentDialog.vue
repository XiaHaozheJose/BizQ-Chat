<template>
  <el-dialog
    v-model="dialogVisible"
    :title="t('order.initiatePayment')"
    width="520px"
    :close-on-click-modal="false"
  >
    <div v-loading="loading" class="order-summary">
      <div v-if="orderSummary">
        <order-price-summary
          :title="t('order.priceSummary')"
          :product-price-summary="orderSummary.productPriceSummary"
          :subtotal="orderSummary.taxBaseAmount"
          :shipping-cost="calculateShippingCost()"
          :retention-tax="calculateRetentionTax()"
          :product-discount="orderSummary.totalProductDisc"
          :customer-discount="orderSummary.totalCustomerDisc"
          :more-discount="orderSummary.totalMoreDisc"
          :couponed-value="orderSummary.totalCouponedDisc"
          :total="calculateTotal()"
        />

        <div class="additional-options">
          <el-row>
            <el-col :span="24">
              <el-checkbox v-model="additionalOptions.reTax">
                {{ t("order.includeRetentionTax") }}
              </el-checkbox>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="24">
              <el-checkbox v-model="additionalOptions.vat">
                {{ t("order.includeVat") }}
              </el-checkbox>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="24">
              <el-checkbox v-model="additionalOptions.customShipping">
                {{ t("order.customShipping") }}
              </el-checkbox>
              <el-input-number
                v-if="additionalOptions.customShipping"
                v-model="customShippingCost"
                :min="0"
                :step="0.01"
                :precision="2"
                :controls="false"
                style="width: 120px; margin-left: 10px"
                @blur="handleShippingCostBlur"
              />
              <span v-if="additionalOptions.customShipping"> € </span>
            </el-col>
          </el-row>
        </div>

        <div class="extra-discount">
          <span>{{ t("order.extraDiscount") }}</span>
          <el-input-number
            v-model="orderSummary.moreDiscPct"
            :min="0"
            :max="100"
            :step="0.01"
            :precision="2"
            :controls="false"
            style="width: 120px"
            @blur="handleDiscountBlur"
          />
          <span>%</span>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">{{ t("common.cancel") }}</el-button>
        <el-button type="primary" :loading="loading" @click="handleConfirm">
          {{ t("common.confirm") }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import OrderPriceSummary from "./OrderPriceSummary.vue";
import {
  OrderPayRequest,
  OrderSummary,
  UpdateOrderSummaryRequest,
} from "@/types/order-summary";
import {
  getOrderSummary,
  updateOrderSummary,
  initiateOrderPay,
} from "@/services/api/order-summary";

const props = defineProps<{
  visible: boolean;
  orderHistoryId: string;
}>();

const emit = defineEmits<{
  (e: "update:visible", visible: boolean): void;
  (e: "payment-initiated"): void;
}>();

const { t } = useI18n();

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

const loading = ref(false);
const orderSummary = ref<OrderSummary | null>(null);
const customShippingCost = ref(0);
const additionalOptions = ref({
  reTax: false,
  vat: true,
  customShipping: false,
});

// 计算运费
const calculateShippingCost = () => {
  if (!orderSummary.value) return 0;
  return additionalOptions.value.customShipping
    ? customShippingCost.value
    : orderSummary.value.shipCostNoTax + orderSummary.value.shipCostTax;
};

// 计算预提税
const calculateRetentionTax = () => {
  if (!orderSummary.value) return 0;
  return additionalOptions.value.reTax
    ? orderSummary.value.retentionTaxAmount
    : 0;
};

// 计算总价
const calculateTotal = () => {
  if (!orderSummary.value) return 0;

  let total = orderSummary.value.totalAmount;

  // 处理税费
  if (!additionalOptions.value.vat) {
    total -= orderSummary.value.productTaxAmount;
  }

  // 处理预提税
  if (!additionalOptions.value.reTax) {
    total -= orderSummary.value.retentionTaxAmount;
  }

  // 处理运费
  const originalShipping =
    orderSummary.value.shipCostNoTax + orderSummary.value.shipCostTax;
  if (additionalOptions.value.customShipping) {
    total = total - originalShipping + customShippingCost.value;
  }

  // 处理额外折扣
  total *= 1 - orderSummary.value.moreDiscPct / 100;

  return Math.max(total, 0);
};

// 更新计算
const updateCalculations = async () => {
  if (!orderSummary.value) return;

  try {
    const data: UpdateOrderSummaryRequest = {
      orderHistoryId: props.orderHistoryId,
      payForTax: additionalOptions.value.vat,
      payForRetentionTax: additionalOptions.value.reTax,
      moreDiscPct: orderSummary.value.moreDiscPct,
    };

    if (additionalOptions.value.customShipping) {
      data.shipmentCost = customShippingCost.value;
    }

    loading.value = true;
    const response = await updateOrderSummary(data);
    // 确保完全更新orderSummary的所有字段
    if (response.data) {
      orderSummary.value = response.data;
    }
  } catch (error) {
    ElMessage.error(t("order.updateSummaryFailed"));
  } finally {
    loading.value = false;
  }
};

// 获取订单摘要
const fetchOrderSummary = async () => {
  loading.value = true;
  try {
    const response = await getOrderSummary({
      orderHistoryId: props.orderHistoryId,
    });
    orderSummary.value = response.data;
    additionalOptions.value.vat = orderSummary.value.payForTax;
    additionalOptions.value.reTax = orderSummary.value.payForRetentionTax;
  } catch (error) {
    ElMessage.error(t("order.fetchSummaryFailed"));
  } finally {
    loading.value = false;
  }
};

// 处理确认
const handleConfirm = async () => {
  if (!orderSummary.value) return;

  const payRequest: OrderPayRequest = {
    orderHistoryId: props.orderHistoryId,
    shipmentCost: additionalOptions.value.customShipping
      ? customShippingCost.value
      : orderSummary.value.shipCostNoTax + orderSummary.value.shipCostTax,
    payForShipment: true,
    payForRetentionTax: additionalOptions.value.reTax,
    payForTax: additionalOptions.value.vat,
    moreDiscPct: orderSummary.value.moreDiscPct,
  };

  try {
    await initiateOrderPay(payRequest);
    ElMessage.success(t("order.paymentInitiated"));
    emit("payment-initiated");
    dialogVisible.value = false;
  } catch (error) {
    ElMessage.error(t("order.initiatePaymentFailed"));
  }
};

// 处理取消
const handleCancel = () => {
  dialogVisible.value = false;
};

// 监听对话框显示状态
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      fetchOrderSummary();
      customShippingCost.value = 0;
      additionalOptions.value = {
        reTax: false,
        vat: true,
        customShipping: false,
      };
    }
  }
);

// 监听选项变化
watch(
  [() => additionalOptions.value.reTax, () => additionalOptions.value.vat],
  () => {
    updateCalculations();
  }
);

// 监听自定义运费
watch([() => additionalOptions.value.customShipping], ([newCustomShipping]) => {
  // 只在切换自定义运费选项时更新
  updateCalculations();
});

// 处理运费输入完成
const handleShippingCostBlur = () => {
  if (additionalOptions.value.customShipping) {
    updateCalculations();
  }
};

// 处理额外折扣输入完成
const handleDiscountBlur = () => {
  if (orderSummary.value) {
    updateCalculations();
  }
};
</script>

<style scoped lang="scss">
.order-summary {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.additional-options {
  margin-top: 20px;

  .el-row {
    margin-bottom: 10px;
  }
}

.extra-discount {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding: 10px 0;
  border-top: 1px solid var(--el-border-color-lighter);

  span:first-child {
    flex-grow: 1;
  }

  .el-input-number {
    margin: 0 10px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
