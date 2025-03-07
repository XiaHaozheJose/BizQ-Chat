<template>
  <el-dialog
    v-model="dialogVisible"
    :title="t('order.createShipment')"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="dialog-content">
      <el-steps :active="currentStep + 1" finish-status="success">
        <el-step :title="t('shipment.selectProducts')" />
        <el-step :title="t('shipment.selectTransport')" />
        <el-step
          v-if="!isCustomerHandleTransport"
          :title="t('shipment.packageInfoTitle')"
        />
      </el-steps>

      <!-- 步骤内容 -->
      <div class="step-content">
        <!-- 选择商品 -->
        <product-selection
          v-if="currentStep === 0"
          :order="order"
          @update:selected-skus="handleSelectedSkusChange"
        />

        <!-- 选择运输方式 -->
        <transport-selection
          v-if="currentStep === 1"
          v-model="selectedTransportId"
          @select="handleTransportSelect"
        />

        <!-- 包裹信息 -->
        <package-info
          v-if="currentStep === 2 && !isCustomerHandleTransport"
          v-model="packageInfo"
        />
      </div>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">{{
          t("common.cancel")
        }}</el-button>
        <el-button v-if="currentStep > 0" @click="handlePrevious">{{
          t("common.previous")
        }}</el-button>
        <el-button type="primary" @click="handleNext">
          {{ getNextButtonText }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { createShipment } from "@/services/api/shipments";
import { getShopSettings } from "@/services/api/shop-setting";
import ProductSelection from "./ProductSelection.vue";
import TransportSelection from "./TransportSelection.vue";
import PackageInfo from "./PackageInfo.vue";
import type { Address } from "@/types/address";
import type {
  CreateShipmentRequest,
  ShipmentSku,
  ShipmentPackageInfo,
} from "@/types/shipments";
import type { Transport } from "@/types/transport";
import type { Order } from "@/types/order";
import type { ShopSettings } from "@/types/shop-setting";

const props = defineProps<{
  visible: boolean;
  order: Order | null;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "shipment-created"): void;
}>();

const { t } = useI18n();

// 对话框可见状态
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

// 当前步骤
const currentStep = ref(0);
// 加载状态
const loading = ref(false);
// 选中的商品SKUs
const selectedSkus = ref<ShipmentSku[]>([]);
// 选中的运输方式ID和对象
const selectedTransportId = ref("");
const selectedTransport = ref<Transport | null>(null);
// 包裹信息
const packageInfo = ref<ShipmentPackageInfo>({
  length: 0,
  width: 0,
  height: 0,
  weight: 0,
  count: 1,
});
// 发货地址ID
const senderAddressId = ref("");

// 是否是客户负责运输
const isCustomerHandleTransport = computed(() => {
  return selectedTransport.value?.isCustomerHandle === true;
});

// 下一步按钮文字
const getNextButtonText = computed(() => {
  if (
    currentStep.value === 2 ||
    (currentStep.value === 1 && isCustomerHandleTransport.value)
  ) {
    return t("common.confirm");
  }
  return t("common.next");
});

// 是否可以进行下一步
const canProceed = computed(() => {
  if (currentStep.value === 0) {
    // 第一步：必须选择至少一个商品
    return selectedSkus.value.length > 0;
  } else if (currentStep.value === 1) {
    // 第二步：必须选择一个运输方式
    return !!selectedTransportId.value;
  } else if (currentStep.value === 2) {
    // 第三步：包裹信息必须完整
    return (
      packageInfo.value.count > 0 &&
      packageInfo.value.length > 0 &&
      packageInfo.value.width > 0 &&
      packageInfo.value.height > 0 &&
      packageInfo.value.weight > 0
    );
  }
  return false;
});

// 初始化方法
const initialize = async () => {
  if (!props.order) return;

  loading.value = true;
  try {
    // 获取商店设置（发货地址）
    const response = await getShopSettings();
    if (response.shipmentSetting?.sendAddress) {
      senderAddressId.value = response.shipmentSetting.sendAddress.id;
    }
  } catch (error) {
    ElMessage.error(t("shipment.failedToLoadSettings"));
    console.error("Failed to load shop settings:", error);
  } finally {
    loading.value = false;
  }
};

// 处理运输方式选择
const handleTransportSelect = (transport: Transport) => {
  selectedTransport.value = transport;
};

// 处理下一步
const handleNext = async () => {
  if (currentStep.value === 0) {
    if (!selectedSkus.value.length) {
      ElMessage.warning(t("shipment.pleaseSelectProducts"));
      return;
    }
    currentStep.value++;
    return;
  }

  if (currentStep.value === 1) {
    if (!selectedTransport.value) {
      ElMessage.warning(t("shipment.pleaseSelectTransport"));
      return;
    }

    // 如果是客户负责运输，直接提交
    if (isCustomerHandleTransport.value) {
      await handleSubmit();
      return;
    }

    currentStep.value++;
    return;
  }

  if (currentStep.value === 2) {
    await handleSubmit();
  }
};

// 选择商品
const handleSelectedSkusChange = (skus: ShipmentSku[]) => {
  console.log("onSelectSkus", skus);
  selectedSkus.value = skus;
};

// 更新包裹信息
const updatePackageInfo = (info: ShipmentPackageInfo) => {
  packageInfo.value = info;
};

// 取消
const handleClose = () => {
  dialogVisible.value = false;
};

// 验证包裹信息
const validatePackageInfo = () => {
  if (!packageInfo.value) return false;
  const { count, weight, length, width, height } = packageInfo.value;
  return count > 0 && weight > 0 && length > 0 && width > 0 && height > 0;
};

// 处理上一步
const handlePrevious = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

// 提交创建发货
const handleSubmit = async () => {
  if (!isCustomerHandleTransport.value && !validatePackageInfo()) {
    ElMessage.warning(t("shipment.pleaseCompletePackageInfo"));
    return;
  }

  if (!props.order) {
    ElMessage.error(t("shipment.noOrderData"));
    return;
  }

  loading.value = true;
  try {
    const shipmentData: CreateShipmentRequest = {
      receiverAddress: props.order.address as Address,
      type: "shipment",
      senderAddressId: props.order.shopId, // 使用shopId作为发货地址ID
      shopId: props.order.shopId,
      skus: selectedSkus.value,
      transferId: isCustomerHandleTransport.value
        ? undefined
        : selectedTransport.value?.id,
      customerHandle: isCustomerHandleTransport.value,
      packageInfo: isCustomerHandleTransport.value
        ? undefined
        : packageInfo.value,
    };

    await createShipment(shipmentData);
    ElMessage.success(t("shipment.createSuccess"));
    emit("shipment-created");
    dialogVisible.value = false;
  } catch (error) {
    console.error("Failed to create shipment:", error);
    ElMessage.error(t("shipment.createFailed"));
  } finally {
    loading.value = false;
  }
};

// 监听对话框打开
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      currentStep.value = 0;
      selectedSkus.value = [];
      selectedTransportId.value = "";
      selectedTransport.value = null;
      packageInfo.value = {
        length: 0,
        width: 0,
        height: 0,
        weight: 0,
        count: 1,
      };
      initialize();
    }
  }
);
</script>

<style lang="scss" scoped>
.shipment-dialog-content {
  display: flex;
  flex-direction: column;
  min-height: 400px;

  .el-steps {
    margin-bottom: 20px;
  }

  .step-content {
    flex: 1;
    padding: 20px 0;
  }

  .step-body {
    min-height: 300px;
  }

  .step-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 20px;
    border-top: 1px solid var(--el-border-color-light);
  }
}
</style>
