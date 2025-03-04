<template>
  <el-dialog
    v-model="dialogVisible"
    :title="t('order.editOrder')"
    :width="900"
    @close="handleCancel"
  >
    <div v-if="hasData" class="order-edit-content">
      <!-- 表头 -->
      <div class="table-header">
        <div class="col-product">{{ t("product.productName") }}</div>
        <div class="col-price">{{ t("product.price") }}</div>
        <div class="col-quantity">{{ t("product.quantity") }}</div>
        <div class="col-subtotal">{{ t("order.subtotal") }}</div>
      </div>

      <!-- 产品列表 -->
      <div class="product-list">
        <div
          v-for="detail in localOrderDetails"
          :key="detail.productId"
          class="product-item"
        >
          <!-- SPU名称 -->
          <div class="product-name">{{ detail.productName }}</div>

          <!-- SKU列表 -->
          <div class="sku-list">
            <div v-for="sku in detail.skus" :key="sku.skuId" class="sku-item">
              <div class="col-product">
                <div class="product-info">
                  <div class="image-wrapper">
                    <el-image
                      :src="
                        sku.skuInfo?.pictures?.length
                          ? getNormalImageUrl(sku.skuInfo.pictures[0], 'small')
                          : getNormalImageUrl(
                              detail.productPictures[0],
                              'small'
                            )
                      "
                      :preview-src-list="[
                        sku.skuInfo?.pictures?.length
                          ? getNormalImageUrl(sku.skuInfo.pictures[0], 'origin')
                          : getNormalImageUrl(
                              detail.productPictures[0],
                              'origin'
                            ),
                      ]"
                      fit="cover"
                    />
                  </div>
                  <div class="sku-detail">
                    <div class="sku-name">
                      {{
                        sku.skuInfo?.name ||
                        sku.skuInfo?.attribute ||
                        t("order.noSpecification")
                      }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-price">
                <div class="price-container">
                  <el-input-number
                    v-if="isSeller"
                    v-model="sku.price"
                    :min="0"
                    :step="0.01"
                    :precision="2"
                    controls-position="right"
                    size="small"
                  />
                  <template v-else>€{{ sku.price.toFixed(2) }}</template>
                  <s
                    v-if="
                      sku.priceBefore !== null && sku.priceBefore !== sku.price
                    "
                    class="previous-value"
                  >
                    €{{ sku.priceBefore?.toFixed(2) }}
                  </s>
                </div>
              </div>
              <div class="col-quantity">
                <div class="quantity-container">
                  <el-input-number
                    v-model="sku.quantity"
                    :min="0"
                    :step="sku.skuInfo?.priceInfo?.level1?.min2Buy || 1"
                    :precision="0"
                    controls-position="right"
                    size="small"
                    @change="validateQuantity(sku)"
                  />
                  <s
                    v-if="
                      sku.quantityBefore !== null &&
                      sku.quantityBefore !== sku.quantity
                    "
                    class="previous-value"
                  >
                    {{ sku.quantityBefore }}
                  </s>
                </div>
              </div>
              <div class="col-subtotal">
                €{{ (sku.price * sku.quantity).toFixed(2) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="no-data">
      {{ t("common.noData") }}
    </div>

    <div v-if="!canEdit" class="lock-message">
      {{ lockMessage }}
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">{{ t("common.cancel") }}</el-button>
        <el-button type="primary" :loading="loading" @click="handleOk">
          {{ t("common.confirm") }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { OrderDetail, OrderSku, OrderLockStatus } from "@/types/order";
import { getNormalImageUrl } from "@/utils";
import { lockOrder, unlockOrder, updateOrder } from "@/services/api/order";

const props = defineProps<{
  visible: boolean;
  orderDetails: OrderDetail[];
  orderId: string;
  isSeller: boolean;
  lockStatus: OrderLockStatus;
}>();

const emit = defineEmits(["update:visible", "order-updated"]);

const { t } = useI18n();

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

const loading = ref(false);
const localOrderDetails = ref<OrderDetail[]>([]);
const canEdit = ref(true);
const lockMessage = ref("");

const checkLockStatus = () => {
  if (props.lockStatus === OrderLockStatus.Unlocked) {
    canEdit.value = true;
    return false;
  } else if (
    (props.isSeller && props.lockStatus === OrderLockStatus.LockedBySeller) ||
    (!props.isSeller && props.lockStatus === OrderLockStatus.LockedByBuyer)
  ) {
    canEdit.value = true;
    return true;
  } else {
    canEdit.value = false;
    lockMessage.value = props.isSeller
      ? t("order.lockedByBuyer")
      : t("order.lockedBySeller");
    return false;
  }
};

const validateQuantity = (record: OrderSku) => {
  const min2Buy = record.skuInfo?.priceInfo?.level1?.min2Buy || 1;
  let newQuantity = Math.round(record.quantity);
  newQuantity = Math.max(0, newQuantity);
  newQuantity = Math.ceil(newQuantity / min2Buy) * min2Buy;

  if (newQuantity !== record.quantity) {
    record.quantity = newQuantity;
    ElMessage.info(t("order.quantityAdjusted", { quantity: newQuantity }));
  }
};

const handleOk = async () => {
  if (!canEdit.value) return;

  let isValid = true;
  localOrderDetails.value.forEach((detail) => {
    detail.skus.forEach((sku) => {
      const min2Buy = sku.skuInfo?.priceInfo?.level1?.min2Buy || 1;
      if (sku.quantity < min2Buy) {
        isValid = false;
        ElMessage.error(
          t("order.invalidQuantity", {
            product: detail.productName,
            min: min2Buy,
          })
        );
      }
    });
  });

  if (!isValid) return;

  loading.value = true;
  try {
    const updatedSkus = localOrderDetails.value.flatMap((detail) =>
      detail.skus.map((sku) => ({
        price: sku.price.toString(),
        quantity: sku.quantity.toString(),
        skuId: sku.skuId,
      }))
    );

    await updateOrder(props.orderId, { skus: updatedSkus });
    ElMessage.success(t("order.updateSuccess"));
    emit("order-updated");
    dialogVisible.value = false;
  } catch (error) {
    ElMessage.error(t("order.updateFailed"));
  } finally {
    loading.value = false;
  }
};

const handleCancel = async () => {
  if (canEdit.value) {
    try {
      await unlockOrder(props.orderId);
    } catch (error) {
      ElMessage.error(t("order.unlockFailed"));
    }
  }
  dialogVisible.value = false;
};

const initLocalOrderDetails = () => {
  if (!props.orderDetails?.length) {
    localOrderDetails.value = [];
    return;
  }
  localOrderDetails.value = JSON.parse(JSON.stringify(props.orderDetails));
};

const initDialog = async () => {
  if (!props.orderDetails?.length || !props.orderId) {
    ElMessage.error(t("order.invalidData"));
    dialogVisible.value = false;
    return;
  }

  const alreadyLocked = checkLockStatus();
  if (canEdit.value && !alreadyLocked) {
    try {
      await lockOrder(props.orderId);
    } catch (error) {
      ElMessage.error(t("order.lockFailed"));
      dialogVisible.value = false;
      return;
    }
  }
  initLocalOrderDetails();
};

watch(
  [() => props.visible, () => props.orderDetails],
  async ([newVisible, newDetails]) => {
    if (newVisible && newDetails?.length) {
      await initDialog();
    }
  }
);

const hasData = computed(() => {
  return localOrderDetails.value && localOrderDetails.value.length > 0;
});

onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload);
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
});

const handleBeforeUnload = async () => {
  if (canEdit.value) {
    try {
      await unlockOrder(props.orderId);
    } catch (error) {
      console.error("Failed to unlock order on page unload:", error);
    }
  }
};
</script>

<style scoped lang="scss">
.order-edit-content {
  .table-header {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
    margin-bottom: 1px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .col-product {
    flex: 1;
    min-width: 300px;
  }

  .col-price,
  .col-quantity,
  .col-subtotal {
    width: 150px;
    text-align: center;
  }

  .product-list {
    .product-item {
      padding: 20px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      &:last-child {
        border-bottom: none;
      }

      .product-name {
        font-size: 16px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        margin-bottom: 16px;
      }
    }
  }

  .sku-list {
    .sku-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px dashed var(--el-border-color-lighter);

      &:last-child {
        border-bottom: none;
      }
    }
  }

  .product-info {
    display: flex;
    gap: 16px;
  }

  .image-wrapper {
    width: 80px;
    height: 80px;
    overflow: hidden;
    border-radius: 4px;
    border: 1px solid var(--el-border-color-lighter);

    :deep(.el-image) {
      width: 100%;
      height: 100%;
    }

    :deep(.el-image__inner) {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .sku-detail {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;

    .sku-name {
      color: var(--el-text-color-regular);
      font-size: 14px;
    }
  }

  .price-container,
  .quantity-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    :deep(.el-input-number) {
      width: 100px;
    }
  }

  .previous-value {
    font-size: 0.9em;
    color: var(--el-text-color-placeholder);
  }
}

.no-data {
  text-align: center;
  padding: 40px;
  color: var(--el-text-color-secondary);
}

.lock-message {
  text-align: center;
  padding: 20px;
  color: var(--el-color-danger);
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
