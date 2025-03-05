<template>
  <div class="order-detail-container">
    <admin-breadcrumb
      :items="['menu.ordersManage', 'menu.ordersManage.orderDetail']"
    />

    <a-spin :loading="loading">
      <div v-if="order" class="order-detail">
        <div class="order-header">
          <div class="order-status">
            <a-tag :color="getStatusColor(order.status)">{{
              getStatusLabel(order.status)
            }}</a-tag>
            <a-divider direction="vertical" />
            <a-tag :color="getStatusColor(order.status)">{{
              getPaymentStatusLabel(order.payStatus)
            }}</a-tag>
          </div>
          <div class="order-actions">
            <!-- 买家按钮 我的订单-->
            <template v-if="isBuyer">
              <a-button
                v-if="
                  order.payStatus === 'unpaid' &&
                  order.status !== 'unconfirmed' &&
                  order.status !== 'canceled'
                "
                type="primary"
                @click="handlePayment"
              >
                {{ $t("orderActions.pay") }}
              </a-button>
              <a-button
                v-if="order.status !== 'canceled'"
                @click="handleReorder"
              >
                {{ $t("orderActions.reorder") }}
              </a-button>
              <a-button
                v-if="['pending', 'done'].includes(order.status)"
                @click="handleReturn"
              >
                {{ $t("orderActions.return") }}
              </a-button>
              <a-button v-if="order.status === 'done'" @click="handleComment">
                {{ $t("orderActions.comment") }}
              </a-button>
              <a-button
                v-if="order.status === 'unconfirmed'"
                status="danger"
                @click="handleCancel"
              >
                {{ $t("orderActions.cancel") }}
              </a-button>
            </template>

            <!-- 卖家按钮 客户订单-->
            <template v-else>
              <a-button
                v-if="
                  order.payStatus === 'unpaid' &&
                  order.status !== 'unconfirmed' &&
                  order.status !== 'canceled'
                "
                type="primary"
                @click="handleInitiatePayment"
              >
                {{ $t("orderActions.initiatePayment") }}
              </a-button>
              <a-button
                v-if="order.status === 'unconfirmed'"
                @click="handleEdit"
              >
                {{ $t("orderActions.edit") }}
              </a-button>
              <a-button
                v-if="['confirmed', 'pending'].includes(order.status)"
                @click="handleOutOfStock"
              >
                {{ $t("orderActions.outOfStock") }}
              </a-button>
              <a-button
                v-if="order.status !== 'canceled' && canCancelOrder"
                status="danger"
                @click="handleCancel"
              >
                {{ $t("orderActions.cancel") }}
              </a-button>
              <a-button
                v-if="['confirmed', 'pending'].includes(order.status)"
                @click="handleCreateShipment"
              >
                {{ $t("orderActions.createShipment") }}
              </a-button>
            </template>
          </div>
        </div>

        <a-divider />

        <div class="order-info">
          <div class="info-item">
            <span class="label">{{ $t("order.orderNumber") }}:</span>
            <span class="value">{{ order.orderNumber }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ $t("order.orderTime") }}:</span>
            <span class="value">{{ formatDate(order.createdAt) }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ $t("order.paymentMethod") }}:</span>
            <span class="value">{{
              getPaymentMethodLabel(order.paymentMethod)
            }}</span>
          </div>
        </div>

        <a-divider />

        <PriceSummary
          :title="$t('order.priceSummary')"
          :product-price-summary="order.productPriceSummary"
          :subtotal="calculateSubtotal()"
          :shipping-cost="order.shipCostNoTax + order.shipCostTax"
          :retention-tax="order.retentionTax"
          :product-discount="order.productDiscount"
          :customer-discount="order.customerDiscount"
          :couponed-value="order.couponedValue"
          :more-discount="order.moreDiscount"
          :total="calculateTotal()"
        />

        <a-divider />

        <div class="address-section">
          <div class="address-box shipping-address">
            <h3>{{ $t("order.shippingAddress") }}</h3>
            <p>{{ order.address.recvName }}</p>
            <p>{{ order.address.phone }}</p>
            <p>{{ formatAddress(order.address) }}</p>
          </div>

          <div class="address-box invoice-address">
            <h3>{{ $t("order.invoiceAddress") }}</h3>
            <template v-if="order.invoiceAddress">
              <a-space>
                <p v-if="order.invoiceAddress.companyName">
                  {{ order.invoiceAddress.companyName }}
                </p>

                <p v-if="order.invoiceAddress.NIF">
                  {{ order.invoiceAddress.NIF }}
                </p>
              </a-space>
              <p>{{ order.invoiceAddress.phone }}</p>
              <p>{{ formatAddress(order.invoiceAddress) }}</p>
            </template>
            <p v-else>{{ $t("order.noInvoiceAddress") }}</p>
          </div>
        </div>

        <a-divider />
        <div class="order-products">
          <ProductList
            :order-details="order.orderDetails"
            :show-all="true"
            :order-status="order.status"
          />
        </div>

        <a-divider />

        <!-- 取消订单确认弹窗 -->
        <a-modal
          v-model:visible="cancelModalVisible"
          :ok-text="$t('common.confirm')"
          :cancel-text="$t('common.cancel')"
          @ok="confirmCancel"
          @cancel="cancelModalVisible = false"
        >
          <template #title>{{ $t("order.cancelConfirmTitle") }}</template>
          <p>
            {{
              $t("order.cancelConfirmContent", {
                orderNumber: order?.orderNumber,
              })
            }}
          </p>
        </a-modal>

        <EditOrderModal
          v-model:visible="editModalVisible"
          :order-details="editOrderDetails"
          :order-id="editOrderId"
          :is-seller="!isBuyer"
          :lock-status="editOrderLockStatus"
          @order-updated="handleOrderUpdated"
        />
        <InitiatePaymentModal
          v-model:visible="initiatePaymentModalVisible"
          :order-history-id="order.id"
          :used-coupon-detail="order.usedCouponDetail"
          :used-vouchers-detail="order.usedVouchersDetail"
          @payment-initiated="handlePaymentInitiated"
        />
        <OutOfStockModal
          :key="outOfStockModalKey"
          v-model:visible="outOfStockModalVisible"
          :order-details="order?.orderDetails || []"
          :shop-id="order?.shopId || ''"
          @out-of-stock-confirmed="handleOutOfStockConfirmed"
          @cancel-order="handleCancel"
        />
        <CreateShipmentModal
          :key="shipmentModalKey"
          v-model:visible="createShipmentModalVisible"
          :order="order"
          @shipment-created="handleShipmentCreated"
        />
      </div>
    </a-spin>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { Message } from "@arco-design/web-vue";
import { getOrderDetail, cancelOrder } from "@/api/orders";
import {
  EnumOrderStatus,
  EnumPaymentMethod,
  EnumPaymentStatus,
  EnumLockStatus,
} from "@/types/enums";
import { Order, OrderDetail } from "@/types/order";
import { Address } from "@/types/address";
import ProductList from "./ProductList.vue";
import EditOrderModal from "@/components/modal/edit-order/EditOrderModal.vue";
import InitiatePaymentModal from "@/components/modal/initialPayment/InitiatePaymentModal.vue";
import PriceSummary from "@/components/modal/summary-info/PriceSummary.vue";
import { useUserStore } from "@/store";
import OutOfStockModal from "@/components/modal/out-of-stock/OutOfStockModal.vue";
import CreateShipmentModal from "@/components/modal/create-shipment/CreateShipmentModal.vue";

const { t } = useI18n();
const route = useRoute();
const userStore = useUserStore();

const order = ref<Order | null>(null);
const loading = ref(true);
const cancelModalVisible = ref(false);
const editModalVisible = ref(false);
const editOrderDetails = ref<OrderDetail[]>([]);
const editOrderId = ref("");
const editOrderLockStatus = ref<EnumLockStatus>(EnumLockStatus.Unlocked);
const initiatePaymentModalVisible = ref(false);
const outOfStockModalVisible = ref(false);
const createShipmentModalVisible = ref(false);
const shipmentModalKey = ref(0);
const outOfStockModalKey = ref(0);

const getStatusColor = (status: EnumOrderStatus) => {
  const statusColorMap: Record<EnumOrderStatus, string> = {
    [EnumOrderStatus.Unconfirmed]: "blue",
    [EnumOrderStatus.Confirmed]: "orange",
    [EnumOrderStatus.Pending]: "green",
    [EnumOrderStatus.Done]: "cyan",
    [EnumOrderStatus.Canceled]: "red",
  };
  return statusColorMap[status] || "default";
};

const getStatusLabel = (status: EnumOrderStatus) => {
  return t(`orderStatus.${status}`);
};

const getPaymentStatusLabel = (status: EnumPaymentStatus) => {
  return t(`orderStatus.paymentStatus.${status}`);
};

const getPaymentMethodLabel = (method: EnumPaymentMethod) => {
  return t(`paymentMethod.${method}`);
};

// 完成初始化支付
const handlePaymentInitiated = (paymentDetails: any) => {
  // 处理完成初始化支付后的逻辑
};

const fetchOrderDetail = async (orderId?: string) => {
  loading.value = true;
  try {
    const id = orderId || (route.params.orderId as string);
    const orderNumber = route.query.orderNumber as string;
    const orderData = await getOrderDetail({ orderId: id, orderNumber });
    order.value = orderData;
  } catch (error) {
    Message.error(t("error.fetchOrderDetailFailed"));
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

const formatAddress = (address: Address) => {
  const parts = [
    address.street,
    address.city,
    address.province?.name ?? "",
    address.country?.name ?? "",
    address.zipcode,
  ].filter(Boolean);
  return parts.join(", ");
};

const calculateSubtotal = () => {
  if (!order.value) return 0;
  return (
    order.value.amount -
    (order.value.shipCostNoTax + order.value.shipCostTax) -
    order.value.retentionTax
  );
};

const isBuyer = computed(() => {
  return order.value?.buyerHandler.id === userStore.userInfo.id;
});

const canCancelOrder = computed(() => {
  if (!order.value) return false;
  return order.value.orderDetails.every((detail) =>
    detail.skus.every(
      (sku) => !sku.shipmentsDetails || sku.shipmentsDetails.length === 0
    )
  );
});

const handlePayment = () => {
  // 实现支付逻辑
};

const handleInitiatePayment = () => {
  if (order.value) {
    initiatePaymentModalVisible.value = true;
  } else {
    Message.error(t("error.orderNotFound"));
  }
};

const handleReorder = () => {
  // 实现重新下单逻辑
};

const handleReturn = () => {
  // 实现退货逻辑
};

const handleComment = () => {
  // 实现评论逻辑
};

const handleCancel = () => {
  cancelModalVisible.value = true;
};

const confirmCancel = async () => {
  if (order.value) {
    try {
      const response = await cancelOrder(order.value.id);
      Message.success(t("order.cancelSuccess"));

      // 使用返回的 orderHistoryId 获取最新的订单详情
      if (response.data && response.data.orderHistoryId) {
        await fetchOrderDetail(response.data.orderHistoryId);
      } else {
        // 如果没有返回 orderHistoryId，则使用原来的订单 ID
        await fetchOrderDetail(order.value.id);
      }
    } catch (error) {
      Message.error(t("order.cancelFailed"));
    } finally {
      cancelModalVisible.value = false;
    }
  }
};

const handleEdit = () => {
  if (order.value) {
    editOrderDetails.value = JSON.parse(
      JSON.stringify(order.value.orderDetails)
    );
    editOrderId.value = order.value.id;
    editOrderLockStatus.value = order.value.lockStatus;

    if (order.value.lockStatus === EnumLockStatus.Unlocked) {
      editModalVisible.value = true;
    } else if (
      (order.value.lockStatus === EnumLockStatus.LockedBySeller &&
        !isBuyer.value) ||
      (order.value.lockStatus === EnumLockStatus.LockedByBuyer && isBuyer.value)
    ) {
      editModalVisible.value = true;
    } else {
      Message.warning(
        isBuyer.value ? t("order.lockedBySeller") : t("order.lockedByBuyer")
      );
    }
  } else {
    Message.error(t("error.orderNotFound"));
  }
};

const handleOrderUpdated = async (orderHistoryId: string) => {
  editModalVisible.value = false;
  await fetchOrderDetail(orderHistoryId);
};

const handleOutOfStock = () => {
  outOfStockModalKey.value += 1;
  outOfStockModalVisible.value = true;
};

const handleOutOfStockConfirmed = async (shipmentId: string) => {
  // 保存 shipmentId 并更新订单
  // 这里可能需要调用一个 API 来更新订单状态
  await fetchOrderDetail();
};

// 添加一个新的计算函数来处理 total
const calculateTotal = () => {
  return order.value?.real2pay ?? 0;
};

const handleCreateShipment = () => {
  // 在打开 modal 时更新 key
  shipmentModalKey.value += 1;
  createShipmentModalVisible.value = true;
};

const handleShipmentCreated = async () => {
  createShipmentModalVisible.value = false;
  await fetchOrderDetail();
  Message.success(t("error.shipment.createSuccess"));
};

onMounted(() => {
  fetchOrderDetail();
});
</script>

<style scoped>
.order-detail-container {
  padding: 20px;
  background-color: white;
  min-height: calc(100vh - 60px); /* 假设顶部导航栏高度为60px */
  display: flex;
  flex-direction: column;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.order-status {
  display: flex;
  align-items: center;
}

.order-actions {
  display: flex;
  gap: 10px;
}

.order-info,
.address-section {
  font-size: 0.9em; /* 减小字体大小 */
}

.info-item,
.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px; /* 稍减小行间距 */
}

.label {
  font-weight: bold;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.total {
  font-size: 1.1em; /* 相对于新的基础字体大小 */
  font-weight: bold;
}

.address-section {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.address-box {
  flex: 1;
  border: 1px solid #f7f7f7;
  padding: 12px; /* 稍微减小内边距 */
  border-radius: 4px;
}

.shipping-address,
.invoice-address {
  background-color: #ffffff;
}

h3 {
  margin-bottom: 8px;
  font-weight: bold;
  font-size: 1em; /* 相对于新的基础字体大小 */
}

p {
  margin-bottom: 4px; /* 稍微减小段落间距 */
}

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
  color: #ff4d4f; /* 使用红色显示折扣金额 */
}
</style>
