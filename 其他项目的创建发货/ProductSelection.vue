<template>
  <div
    v-for="order in convertedOrders"
    :key="order.orderNumber"
    class="product-selection"
  >
    <h3
      ><strong>{{ $t('order.orderNumber') }}:</strong>
      {{ order.orderNumber }}</h3
    >
    <div class="order-header">
      <div class="address-info">
        <p
          ><strong>{{ $t('order.shippingAddress') }}:</strong></p
        >
        <p>{{ order.address.recvName }}</p>
        <p>{{ order.address.phone }}</p>
        <p>{{ formatAddress(order.address) }}</p>
      </div>
    </div>

    <div
      v-for="detail in order.orderDetails"
      :key="detail.productId"
      class="product-section"
    >
      <div class="product-info">
        <a-image
          :src="imgSuffix(detail.productPictures[0], 'small')"
          :preview-src="imgSuffix(detail.productPictures[0], 'origin')"
          :alt="detail.productName"
          :width="60"
          :height="80"
          fit="cover"
        />
        <div class="product-details">
          <p style="font-weight: bold">{{ detail.productName }}</p>
          <p> {{ detail.productSerialNumber }}</p>
          <p>
            {{ $t('order.quantity') }}: {{ getSelectedSkuCount(detail) }} |
            {{ $t('order.total') }}:
            {{ formatPrice(getSelectedSkuAmount(detail)) }}
          </p>
        </div>
      </div>

      <div class="sku-list">
        <div v-for="sku in detail.skus" :key="sku.skuId" class="sku-item">
          <a-checkbox v-model="sku.selected" @change="handleSkuSelect(sku)">
            <div class="sku-info">
              <a-image
                :src="imgSuffix(sku.skuInfo.pictures[0], 'small')"
                :preview-src="imgSuffix(sku.skuInfo.pictures[0], 'origin')"
                :alt="sku.skuInfo.name"
                :width="60"
                :height="80"
                fit="cover"
              />
              <div class="sku-details">
                <span>{{ sku.skuInfo.name }}</span>
                <div class="sku-quantity">
                  <a-input-number
                    v-model="sku.selectedQuantity"
                    mode="button"
                    :style="{ width: '100px' }"
                    size="small"
                    :min="0"
                    :max="sku.quantity"
                    :precision="0"
                    :step="1"
                    @change="handleQuantityChange(sku)"
                  />
                  <span class="sku-price">{{ formatPrice(sku.price) }}</span>
                </div>
                <span class="sku-total">{{
                  formatPrice(sku.price * sku.selectedQuantity)
                }}</span>
                <div class="shipping-info">
                  <span class="available-quantity"
                    >{{ $t('shipment.availableQuantity') }}:
                    {{ getAvailableQuantity(sku) }}</span
                  >
                  <span class="shipped-quantity"
                    >{{ $t('shipment.shippedQuantity') }}:
                    {{ getShippedQuantity(sku) }}</span
                  >
                  <a-tooltip
                    v-if="isOverShipping(sku)"
                    :content="$t('shipment.overShippingWarning')"
                  >
                    <icon-exclamation-circle-fill class="warning-icon" />
                  </a-tooltip>
                </div>
              </div>
            </div>
          </a-checkbox>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, watch, reactive, computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { Message } from '@arco-design/web-vue';
  import { IconExclamationCircleFill } from '@arco-design/web-vue/es/icon';
  import { Order, OrderDetail, SelectedOrderSku } from '@/types/order';
  import { Address } from '@/types/address';
  import { imgSuffix, getShipmentCounts } from '@/utils';

  type ConvertedOrderDetail = Omit<OrderDetail, 'skus'> & {
    skus: SelectedOrderSku[];
  };
  type ConvertedOrder = Omit<Order, 'orderDetails'> & {
    orderDetails: ConvertedOrderDetail[];
  };
  const props = defineProps<{
    orders: Order[];
  }>();
  const emit = defineEmits(['sku-selected', 'update-selected-skus']);
  const { t } = useI18n();
  const selectedSkus = ref<SelectedOrderSku[]>([]);
  // 添加一个新的 ref 来存储转换后的订单详情
  const convertedOrders = ref<ConvertedOrder[]>([]);

  const formatPrice = (price: number): string => {
    return `€${price.toFixed(2)}`;
  };

  const formatAddress = (address: Address): string => {
    const parts = [
      address.street,
      address.city,
      address.province?.name,
      address.country?.name,
      address.zipcode,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const getSelectedSkuCount = (detail: ConvertedOrderDetail): number => {
    return detail.skus.reduce(
      (total, sku) => total + (sku.selected ? sku.selectedQuantity : 0),
      0
    );
  };

  const getSelectedSkuAmount = (detail: ConvertedOrderDetail): number => {
    return detail.skus.reduce(
      (total, sku) =>
        total + (sku.selected ? sku.price * sku.selectedQuantity : 0),
      0
    );
  };

  const getAvailableQuantity = (sku: SelectedOrderSku): number => {
    const { shippedCount, receivedCount, outOfStockCount } =
      getShipmentCounts(sku);
    return (sku.quantity || 0) - shippedCount - receivedCount - outOfStockCount;
  };

  const getShippedQuantity = (sku: SelectedOrderSku): number => {
    const { shippedCount, receivedCount } = getShipmentCounts(sku);
    return shippedCount + receivedCount;
  };

  const isOverShipping = (sku: SelectedOrderSku): boolean => {
    return sku.selectedQuantity > getAvailableQuantity(sku);
  };

  const handleSkuSelect = (sku: SelectedOrderSku) => {
    if (sku.selected) {
      sku.selectedQuantity = getAvailableQuantity(sku);
      const existingIndex = selectedSkus.value.findIndex(
        (s) => s.skuId === sku.skuId
      );
      if (existingIndex === -1) {
        selectedSkus.value.push(sku);
      } else {
        selectedSkus.value[existingIndex] = sku;
      }
    } else {
      sku.selectedQuantity = 0;
      selectedSkus.value = selectedSkus.value.filter(
        (s) => s.skuId !== sku.skuId
      );
    }
    emit('sku-selected', sku);
    emit('update-selected-skus', selectedSkus.value);
  };

  const handleQuantityChange = (sku: SelectedOrderSku) => {
    // 确保 selectedQuantity 始终是整数
    sku.selectedQuantity = Math.floor(sku.selectedQuantity);

    if (sku.selectedQuantity > 0 && !sku.selected) {
      sku.selected = true;
      const existingIndex = selectedSkus.value.findIndex(
        (s) => s.skuId === sku.skuId
      );
      if (existingIndex === -1) {
        selectedSkus.value.push(sku);
      } else {
        selectedSkus.value[existingIndex] = sku;
      }
    } else if (sku.selectedQuantity === 0 && sku.selected) {
      sku.selected = false;
      selectedSkus.value = selectedSkus.value.filter(
        (s) => s.skuId !== sku.skuId
      );
    }
    emit('sku-selected', sku);
    emit('update-selected-skus', selectedSkus.value);
  };

  const convertOrderDetails = (order: Order): ConvertedOrderDetail[] => {
    return order.orderDetails.map((detail) => ({
      ...detail,
      skus: detail.skus.map((sku) => ({
        ...sku,
        selected: false,
        selectedQuantity: 0,
      })),
    })) as ConvertedOrderDetail[];
  };

  watch(
    () => props.orders,
    (newOrders) => {
      convertedOrders.value = newOrders.map((order) => ({
        ...order,
        orderDetails: convertOrderDetails(order),
      }));
    },
    { deep: true, immediate: true } // 添加 deep 和 immediate 选项
  );
</script>

<style scoped>
  .product-selection {
    overflow-y: auto;
  }

  .order-header {
    margin-bottom: 20px;
    padding: 5px 10px;
    background-color: #f5f5f5;
    border-radius: 4px;
  }

  .order-header h3 {
    margin-bottom: 10px;
  }

  .address-info p {
    margin: 5px 0;
  }

  .product-section {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f9f9f9;
    border-radius: 4px;
  }

  .product-info {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
  }

  .product-details {
    flex: 1;
  }

  .product-details h4 {
    margin: 0 0 5px 0;
  }

  .product-details p {
    margin: 5px 0;
  }

  .sku-list {
    margin-top: 10px;
  }

  .sku-item {
    margin-top: 8px;
    padding: 8px;
    background-color: #ffffff;
    border-radius: 4px;
  }

  .sku-info {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 0.9em;
  }

  .sku-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .sku-price {
    color: #ff4d4f;
    margin-left: 10px;
  }

  .sku-quantity {
    display: flex;
    align-items: center;
    flex-direction: row;
  }

  .shipping-info {
    display: flex;
    font-size: 0.8em;
    color: #666;
    margin-top: 4px;
  }

  .available-quantity,
  .shipped-quantity {
    margin-right: 10px;
  }

  .warning-icon {
    color: #ff4d4f;
    font-size: 16px;
    vertical-align: middle;
  }
</style>
