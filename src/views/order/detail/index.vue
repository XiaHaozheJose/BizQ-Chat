<template>
  <div class="order-detail">
    <draggable-container with-border height="64px">
      <div class="container-content">
        <el-button
          class="back-button no-drag"
          @click="handleBack"
          size="large"
          type="primary"
          plain
        >
          <el-icon><ArrowLeft /></el-icon>
          {{ t("common.back") }}
        </el-button>

        <div class="action-buttons no-drag">
          <!-- 买家按钮 -->
          <template v-if="isBuyer">
            <el-button
              v-if="
                order?.payStatus === 'unpaid' &&
                !isOrderStatusIn(order?.status, [
                  OrderStatus.UNCONFIRMED,
                  OrderStatus.CANCELED,
                ])
              "
              type="primary"
              @click="handlePayment"
            >
              {{ t("common.pay") }}
            </el-button>
            <el-button
              v-if="!isOrderStatus(order?.status, OrderStatus.CANCELED)"
              @click="handleReorder"
            >
              {{ t("order.reorder") }}
            </el-button>
            <el-button
              v-if="
                isOrderStatusIn(order?.status, [
                  OrderStatus.PENDING,
                  OrderStatus.DONE,
                ])
              "
              @click="handleReturn"
            >
              {{ t("order.return") }}
            </el-button>
            <el-button
              v-if="isOrderStatus(order?.status, OrderStatus.DONE)"
              @click="handleComment"
            >
              {{ t("order.comment") }}
            </el-button>
            <el-button
              v-if="isOrderStatus(order?.status, OrderStatus.UNCONFIRMED)"
              type="danger"
              @click="handleCancel"
            >
              {{ t("common.cancel") }}
            </el-button>
          </template>

          <!-- 卖家按钮 -->
          <template v-else>
            <el-button
              v-if="
                order?.payStatus === 'unpaid' &&
                !isOrderStatusIn(order?.status, [
                  OrderStatus.UNCONFIRMED,
                  OrderStatus.CANCELED,
                ])
              "
              type="primary"
              @click="handleInitiatePayment"
            >
              {{ t("order.initiatePayment") }}
            </el-button>
            <el-button
              v-if="isOrderStatus(order?.status, OrderStatus.UNCONFIRMED)"
              @click="handleConfirm"
            >
              {{ t("common.confirm") }}
            </el-button>
            <el-button
              v-if="isOrderStatus(order?.status, OrderStatus.UNCONFIRMED)"
              @click="handleEdit"
            >
              {{ t("common.edit") }}
            </el-button>
            <el-button
              v-if="
                isOrderStatusIn(order?.status, [
                  OrderStatus.CONFIRMED,
                  OrderStatus.PENDING,
                ])
              "
              @click="handleCreateShipment"
            >
              {{ t("order.createShipment") }}
            </el-button>
            <el-button
              v-if="
                isOrderStatusIn(order?.status, [
                  OrderStatus.CONFIRMED,
                  OrderStatus.PENDING,
                ])
              "
              @click="handleOutOfStock"
            >
              {{ t("order.outOfStock") }}
            </el-button>
            <el-button
              v-if="
                !isOrderStatus(order?.status, OrderStatus.CANCELED) &&
                canCancelOrder
              "
              type="danger"
              @click="handleCancel"
            >
              {{ t("common.cancel") }}
            </el-button>
          </template>
        </div>
      </div>
    </draggable-container>

    <div class="order-info">
      <div class="info-header">
        <h2>{{ t("order.orderInfo") }}</h2>
        <div class="order-status">
          <el-tag :type="getStatusType(order?.status)">
            {{ t(getStatusKey(order?.status)) }}
          </el-tag>
        </div>
      </div>

      <el-descriptions :column="2" border>
        <el-descriptions-item :label="t('order.orderNumber')">
          {{ order?.orderNumber }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('order.orderTime')">
          {{ formatDateStr(order?.createdAt || "") }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('order.paymentStatus')">
          <el-tag :type="order?.payStatus === 'paid' ? 'success' : 'warning'">
            {{
              order?.payStatus === "paid" ? t("order.paid") : t("order.unpaid")
            }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('order.paymentMethod')">
          {{ order?.paymentMethod || t("common.undefined") }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 价格摘要 -->
    <div class="price-summary">
      <order-price-summary
        :title="t('order.priceSummary')"
        :product-price-summary="order?.productPriceSummary || []"
        :subtotal="calculateSubtotal()"
        :shipping-cost="(order?.shipCostNoTax || 0) + (order?.shipCostTax || 0)"
        :retention-tax="order?.retentionTax || 0"
        :product-discount="order?.productDiscount || 0"
        :customer-discount="order?.customerDiscount || 0"
        :more-discount="order?.moreDiscount || 0"
        :couponed-value="order?.couponedValue || 0"
        :total="
          isOrderStatus(order?.status, OrderStatus.UNCONFIRMED)
            ? order?.fakeAmount || 0
            : order?.real2pay || 0
        "
      />
    </div>

    <!-- 地址信息 -->
    <order-address-info
      :shipping-address="order?.address"
      :invoice-address="order?.invoiceAddress"
    />

    <order-product-list :order-details="order?.orderDetails || []" />

    <order-edit-dialog
      v-model:visible="editDialogVisible"
      :order-details="order?.orderDetails || []"
      :order-id="order?.id || ''"
      :is-seller="isSeller"
      :lock-status="order?.lockStatus || OrderLockStatus.Unlocked"
      @order-updated="handleOrderUpdated"
    />

    <initiate-payment-dialog
      v-model:visible="initiatePaymentVisible"
      :order-history-id="order?.id || ''"
      @payment-initiated="handlePaymentInitiated"
    />

    <create-shipment-dialog
      v-model:visible="createShipmentVisible"
      :order="order"
      @shipment-created="handleShipmentCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import { Order, OrderStatus, OrderLockStatus } from "@/types/order";
import { useOrderStore } from "@/store/order";
import { useUserStore } from "@/store/user";
import OrderEditDialog from "@/components/order/OrderEditDialog.vue";
import DraggableContainer from "@/components/base/DraggableContainer.vue";
import { ArrowLeft } from "@element-plus/icons-vue";
import { getStatusType, getStatusKey } from "@/utils";
import { formatDateStr } from "@/utils/date";
import OrderAddressInfo from "@/components/order/OrderAddressInfo.vue";
import OrderProductList from "@/components/order/OrderProductList.vue";
import OrderPriceSummary from "@/components/order/OrderPriceSummary.vue";
import InitiatePaymentDialog from "@/components/order/InitiatePaymentDialog.vue";
import CreateShipmentDialog from "@/components/shipment/CreateShipmentDialog.vue";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const orderStore = useOrderStore();
const userStore = useUserStore();

const order = ref<Order | null>(null);
const editDialogVisible = ref(false);
const isSeller = ref(false);
const initiatePaymentVisible = ref(false);
const createShipmentVisible = ref(false);

// 加载订单详情
const loadOrderDetail = async () => {
  try {
    const orderId = route.params.id as string;
    const orderDetail = await orderStore.getOrderDetail(orderId);
    order.value = orderDetail;
    isSeller.value =
      orderDetail.sellerHandler?.id === userStore.currentUser?.id;
  } catch (error) {
    ElMessage.error(t("order.loadFailed"));
    router.push("/order");
  }
};

// 处理确认订单
const handleConfirm = () => {
  ElMessageBox.confirm(
    t("dialog.confirm.confirmOrder.message"),
    t("dialog.tipTitle"),
    {
      confirmButtonText: t("common.confirm"),
      cancelButtonText: t("common.cancel"),
      type: "info",
    }
  ).then(async () => {
    try {
      await orderStore.confirmOrderHandler(order.value!.id);
      ElMessage.success(t("dialog.confirm.confirmOrder.success"));
      loadOrderDetail();
    } catch (error) {
      ElMessage.error(t("order.confirmFailed"));
    }
  });
};

// 处理编辑
const handleEdit = () => {
  editDialogVisible.value = true;
};

// 处理取消订单
const handleCancel = () => {
  ElMessageBox.confirm(
    t("dialog.confirm.deleteOrder.message"),
    t("dialog.warningTitle"),
    {
      confirmButtonText: t("common.confirm"),
      cancelButtonText: t("common.cancel"),
      type: "warning",
    }
  ).then(async () => {
    try {
      await orderStore.cancelOrderHandler(order.value!.id);
      ElMessage.success(t("dialog.confirm.deleteOrder.success"));
      loadOrderDetail();
    } catch (error) {
      ElMessage.error(t("order.cancelFailed"));
    }
  });
};

// 处理订单更新
const handleOrderUpdated = async (newOrderId: string) => {
  try {
    // 先更新路由，这样后续的操作都会使用新ID
    await router.replace({ params: { id: newOrderId } });
    // 获取最新订单数据
    const orderDetail = await orderStore.getOrderDetail(newOrderId);
    order.value = orderDetail;
    isSeller.value =
      orderDetail.sellerHandler?.id === userStore.currentUser?.id;
  } catch (error) {
    ElMessage.error(t("order.message.updateFailed"));
    router.push("/order");
  }
};

// 处理返回
const handleBack = () => {
  console.log(window.history.length);
  // 如果有上一页记录，则返回上一页
  if (window.history.length > 1) {
    router.back();
  } else {
    // 否则返回到订单列表
    const orderType = route.params.type || "my";
    router.push(`/order/${orderType}`);
  }
};

const isBuyer = computed(() => {
  return order.value?.buyerHandler?.id === userStore.currentUser?.id;
});

const canCancelOrder = computed(() => {
  if (!order.value) return false;
  return order.value.orderDetails.every((detail) =>
    detail.skus.every((sku) => !sku.shipmentsDetails?.length)
  );
});

// Add new methods for handling actions
const handlePayment = () => {
  // Implement payment logic
};

const handleReorder = () => {
  // Implement reorder logic
};

const handleReturn = () => {
  // Implement return logic
};

const handleComment = () => {
  // Implement comment logic
};

const handleInitiatePayment = () => {
  initiatePaymentVisible.value = true;
};

const handlePaymentInitiated = async () => {
  await loadOrderDetail();
};

const handleOutOfStock = () => {
  // Implement out of stock logic
};

const handleCreateShipment = () => {
  createShipmentVisible.value = true;
};

const handleShipmentCreated = async () => {
  await loadOrderDetail();
  ElMessage.success(t("order.shipmentCreatedSuccess"));
};

// Add type guard methods
const isOrderStatus = (
  status: OrderStatus | undefined,
  targetStatus: OrderStatus
): boolean => {
  return status === targetStatus;
};

const isOrderStatusIn = (
  status: OrderStatus | undefined,
  targetStatuses: OrderStatus[]
): boolean => {
  return status ? targetStatuses.includes(status) : false;
};

const calculateSubtotal = () => {
  if (!order.value?.orderDetails) return 0;
  return order.value.orderDetails.reduce((sum, detail) => {
    // Sum up subtotals from all SKUs
    const skuTotal = detail.skus.reduce((skuSum, sku) => {
      return skuSum + (sku.invoiceInfo?.subtotal || 0);
    }, 0);
    return sum + skuTotal;
  }, 0);
};

onMounted(() => {
  loadOrderDetail();
});
</script>

<style lang="scss" scoped>
.order-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
  overflow-y: auto;
  padding: 10px 12px;

  :deep(.draggable-container) {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: #fff;
    border-bottom: 1px solid var(--el-border-color-light);

    .container-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      height: 100%;
      width: 100%;
    }

    .back-button {
      height: 40px;
      padding: 0 16px;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;

      &:hover {
        color: var(--el-color-primary);
        background-color: var(--el-fill-color-light);
      }

      &:active {
        color: var(--el-color-primary-dark);
      }

      .el-icon {
        font-size: 16px;
      }
    }

    .action-buttons {
      display: flex;
      gap: 12px;
    }
  }

  .order-info,
  .price-summary,
  .address-box,
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
  }

  .order-info {
    .info-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      h2 {
        margin: 0;
      }
    }
  }
}
</style>
