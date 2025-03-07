<template>
  <a-modal
    :visible="visible"
    :title="$t('shipment.title')"
    @cancel="handleCancel"
  >
    <a-spin :loading="loading" style="width: 100%">
      <a-steps :current="currentStep + 1">
        <a-step :title="$t('shipment.title')" />
        <a-step v-if="currentStep >= 1" :title="$t('shipment.transport')" />
        <a-step
          v-if="currentStep >= 2 && selectedTransfer !== 'customerHandle'"
          :title="$t('shipment.packageInfo.title')"
        />
      </a-steps>

      <div v-if="currentStep === 0" class="step-content">
        <ProductSelection
          :orders="filteredOrders"
          @sku-selected="handleSkuSelected"
          @update-selected-skus="updateSelectedSkus"
        />
        <a-button
          v-if="hasMoreOrders"
          :loading="loadingMoreOrders"
          @click="loadMoreOrders"
        >
          {{ $t('common.loadMore') }}
        </a-button>
      </div>

      <div v-if="currentStep === 1" class="step-content">
        <TransportSelection
          :transports="transports"
          :customer-handle="!!shopSettings?.shipmentSetting.customerHandle"
          @transport-selected="handleTransportSelected"
        />
      </div>

      <div
        v-if="currentStep === 2 && selectedTransfer !== 'customerHandle'"
        class="step-content"
      >
        <PackageInfo v-model="packageInfo" />
      </div>
    </a-spin>
    <template #footer>
      <a-space>
        <a-button v-if="currentStep > 0" @click="handlePrevious">
          {{ $t('common.previous') }}
        </a-button>
        <a-button type="primary" @click="handleOk">
          {{ getOkText }}
        </a-button>
        <a-button @click="handleCancel">
          {{ $t('common.cancel') }}
        </a-button>
      </a-space>
    </template>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { Message } from '@arco-design/web-vue';
  import { getShopSettings } from '@/api/shop-settings';
  import { createShipment } from '@/api/shipments';
  import { fetchOrders } from '@/api/orders';
  import {
    Order,
    SelectedOrderSku,
    OrderSku,
    ShipmentDetail,
  } from '@/types/order';
  import { ShopSettings } from '@/types/shop-settings';
  import { Transport } from '@/types/transport';
  import ProductSelection from './ProductSelection.vue';
  import TransportSelection from './TransportSelection.vue';
  import PackageInfo from './PackageInfo.vue';
  import { getTransports } from '@/api/transports';
  import { CreateShipmentRequest } from '@/types/shipments';
  import { canShipOrder } from '@/utils';

  const props = defineProps<{
    visible: boolean;
    order: Order;
  }>();
  const emit = defineEmits(['update:visible', 'shipment-created']);
  const { t } = useI18n();
  const loading = ref(false);
  const currentStep = ref(0);
  const shopSettings = ref<ShopSettings | null>(null);
  const transports = ref<Transport[]>([]);
  const selectedSkus = ref<SelectedOrderSku[]>([]);
  const selectedTransfer = ref<string | null>(null);
  const packageInfo = ref({
    count: 1,
    weight: 0,
    height: 0,
    width: 0,
    length: 0,
  });
  const orders = ref<Order[]>([]);
  const filteredOrders = ref<Order[]>([]);
  const page = ref(1);
  const pageSize = ref(10);
  const hasMoreOrders = ref(true);
  const loadingMoreOrders = ref(false);

  const selectedTransport = ref<string | null>(null);

  // 创建一个深拷贝的 order 对象

  const clonedOrder = ref<Order>(JSON.parse(JSON.stringify(props.order)));

  const resetModal = () => {
    currentStep.value = 0;
    selectedSkus.value = [];
    selectedTransfer.value = null;
    packageInfo.value = {
      count: 1,
      weight: 0,
      height: 0,
      width: 0,
      length: 0,
    };
    clonedOrder.value = JSON.parse(JSON.stringify(props.order));
    orders.value = [clonedOrder.value];
    filteredOrders.value = [clonedOrder.value];
    page.value = 1;
    hasMoreOrders.value = true;
  };

  const getOkText = computed(() => {
    if (
      currentStep.value === 2 ||
      (currentStep.value === 1 && selectedTransfer.value === 'customerHandle')
    ) {
      return t('common.confirm');
    }
    return t('common.next');
  });

  const fetchShopSettings = async () => {
    try {
      const response = await getShopSettings();
      shopSettings.value = response;
    } catch (error) {
      Message.error(t('error.fetchShopSettingsFailed'));
    }
  };

  const fetchTransports = async () => {
    try {
      const response = await getTransports();
      transports.value = response.transfers;
    } catch (error) {
      Message.error(t('error.fetchTransportsFailed'));
    }
  };

  const handleSkuSelected = (sku: SelectedOrderSku) => {
    const index = selectedSkus.value.findIndex((s) => s.skuId === sku.skuId);
    if (index === -1) {
      selectedSkus.value.push(sku);
    } else {
      selectedSkus.value[index] = sku;
    }
  };

  const updateSelectedSkus = (skus: SelectedOrderSku[]) => {
    selectedSkus.value = skus;
  };

  const handleTransportSelected = (transportId: string) => {
    selectedTransport.value = transportId;
  };

  const handleCancel = () => {
    emit('update:visible', false);
    resetModal();
  };

  const handlePrevious = () => {
    if (currentStep.value > 0) {
      currentStep.value--;
    }
  };

  const isPackageInfoValid = () => {
    return (
      packageInfo.value.count > 0 &&
      packageInfo.value.weight > 0 &&
      packageInfo.value.height > 0 &&
      packageInfo.value.width > 0 &&
      packageInfo.value.length > 0
    );
  };

  const handleOk = async () => {
    if (currentStep.value === 0) {
      if (selectedSkus.value.length === 0) {
        Message.warning(t('shipment.pleaseSelectProducts'));
        return;
      }
      currentStep.value++;
      return;
    }

    if (currentStep.value === 1) {
      if (!selectedTransport.value ) {
        Message.warning(t('shipment.pleaseSelectTransport'));
        return;
      }
      if (selectedTransport.value !== 'customerHandle') {
        currentStep.value++;
        return;
      }
    }

    if (
      currentStep.value === 2 &&
      selectedTransport.value !== 'customerHandle'
    ) {
      if (!isPackageInfoValid()) {
        Message.warning(t('shipment.pleaseCompletePackageInfo'));
        return;
      }
    }

    try {
      loading.value = true;
      const shipmentData: CreateShipmentRequest = {
        receiverAddress: clonedOrder.value.address,
        type: 'shipment',
        senderAddressId:
          shopSettings.value?.shipmentSetting.sendAddress.id ?? '',
        skus: selectedSkus.value.map((sku) => ({
          quantity: sku.selectedQuantity,
          _id: sku.skuId,
          orderDetailId: sku.orderDetailId,
          pictures: sku.skuInfo.pictures || [],
        })),
        packageInfo:
          selectedTransport.value !== 'customerHandle'
            ? packageInfo.value
            : undefined,
        shopId: clonedOrder.value.shopId,
        transferId:
          selectedTransport.value !== 'customerHandle'
            ? selectedTransport.value ?? undefined
            : undefined,
        customerHandle: selectedTransport.value === 'customerHandle',
      };

      await createShipment(shipmentData);
      emit('shipment-created');
      handleCancel();
    } catch (error) {
      Message.error(t('error.shipment.createFailed'));
    } finally {
      loading.value = false;
    }
  };

  const filterOrder = (order: Order): boolean => {
    if (order.id === props.order.id) {
      return false;
    }
    return canShipOrder(order.orderDetails);
  };

  const loadMoreOrders = async () => {
    if (loadingMoreOrders.value) return;

    loadingMoreOrders.value = true;
    try {
      const response = await fetchOrders({
        status: ['confirmed', 'pending'],
        populates: ['orderDetails'],
        shopId: '603cf3420f53540011c88c0f',
        skip: page.value * pageSize.value,
        limit: pageSize.value,
      });

      const newFilteredOrders = response.orderHistories
        .filter(filterOrder)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

      filteredOrders.value = [...filteredOrders.value, ...newFilteredOrders];
      page.value++;
      hasMoreOrders.value = response.currentPageHasMoreData;
    } catch (error) {
      Message.error(t('error.fetchOrdersFailed'));
    } finally {
      loadingMoreOrders.value = false;
    }
  };

  onMounted(async () => {
    resetModal();
    await Promise.all([fetchShopSettings(), fetchTransports()]);
  });
</script>

<style scoped>
  .step-content {
    margin-top: 24px;
    margin-bottom: 24px;
  }
</style>
