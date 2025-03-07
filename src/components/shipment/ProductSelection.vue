<template>
  <div class="product-selection">
    <!-- 表头 -->
    <div class="table-header">
      <div class="col-select">
        <el-checkbox
          :indeterminate="isIndeterminate"
          v-model="checkAll"
          @change="handleCheckAllChange"
        />
      </div>
      <div class="col-product">{{ t("product.product") }}</div>
      <div class="col-sku">{{ t("product.sku") }}</div>
      <div class="col-quantity">{{ t("product.quantity") }}</div>
      <div class="col-shipped">{{ t("shipment.shipped") }}</div>
      <div class="col-remaining">{{ t("shipment.remaining") }}</div>
      <div class="col-ship-quantity">{{ t("shipment.toShip") }}</div>
    </div>

    <!-- 表格内容 -->
    <div class="table-body" v-loading="loading">
      <div v-if="loading" class="loading-state">
        <el-icon class="loading-icon" :size="24"><Loading /></el-icon>
      </div>
      <template v-else>
        <!-- 空状态 -->
        <div v-if="tableData.length === 0" class="empty-state">
          {{ t("shipment.noProductsToShip") }}
        </div>
        <div v-else>
          <!-- 搜索栏 -->
          <div class="search-bar">
            <el-input
              v-model="searchText"
              :placeholder="t('common.search')"
              clearable
              prefix-icon="Search"
            />
          </div>

          <!-- 商品列表 -->
          <div
            v-for="item in filteredTableData"
            :key="item.key"
            class="table-row"
            :class="{ selected: item.selected }"
            @click="handleRowClick(item)"
          >
            <div class="col-select">
              <el-checkbox
                v-model="item.selected"
                @change="handleItemCheckChange(item)"
                @click.stop
              />
            </div>
            <div class="col-product">
              <div class="product-info">
                <div class="product-image">
                  <el-image
                    :src="getImageUrl(item.image)"
                    fit="cover"
                    :preview-src-list="item.images.map(getImageUrl)"
                  >
                    <template #error>
                      <div class="image-error">
                        <el-icon><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                </div>
                <div class="product-name" :title="item.productName">
                  {{ item.productName }}
                </div>
              </div>
            </div>
            <div
              class="col-sku"
              :title="item.skuName || t('order.noSpecification')"
            >
              {{ item.skuName || t("order.noSpecification") }}
            </div>
            <div class="col-quantity">
              {{ item.quantity }}
            </div>
            <div class="col-shipped">
              {{ item.shipped }}
            </div>
            <div class="col-remaining">
              {{ item.remaining }}
            </div>
            <div class="col-ship-quantity" @click.stop>
              <div class="input-wrapper">
                <el-input-number
                  :id="`input-${item.key}`"
                  v-model="item.shipQuantity"
                  :min="item.remaining > 0 ? 1 : 0"
                  :max="9999"
                  :disabled="!item.selected"
                  :controls="true"
                  :step="1"
                  @change="handleQuantityChange(item)"
                />
                <el-tooltip
                  v-if="item.shipQuantity > item.remaining"
                  :content="t('shipment.exceedRemainingQuantity')"
                  placement="top"
                >
                  <el-icon class="warning-icon"><Warning /></el-icon>
                </el-tooltip>
              </div>
            </div>
          </div>

          <!-- 已选商品摘要 -->
          <div v-if="selectedRows.length" class="selection-summary">
            <span>{{
              t("shipment.selectedProducts", { count: selectedRows.length })
            }}</span>
            <span>{{
              t("shipment.totalToShip", { count: totalShipQuantity })
            }}</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { Search, Picture, Loading, Warning } from "@element-plus/icons-vue";
import { getOrderDetail } from "@/services/api/order";
import { canShipSku, getShipmentCounts } from "@/utils";
import { getNormalImageUrl } from "@/utils";
import type { ShipmentSku } from "@/types/shipments";
import type { Order, OrderDetail, OrderSku } from "@/types/order";

// 定义表格行数据接口
interface TableRowData {
  key: string;
  orderDetailId: string;
  productId: string;
  productName: string;
  skuId: string;
  skuName?: string;
  image: string;
  images: string[];
  quantity: number;
  shipped: number;
  remaining: number;
  shipQuantity: number;
  selected: boolean;
}

const props = defineProps<{
  order: Order | null;
}>();

const emit = defineEmits<{
  (e: "update:selectedSkus", skus: ShipmentSku[]): void;
}>();

const { t } = useI18n();
const loading = ref(false);
const searchText = ref("");
const tableData = ref<TableRowData[]>([]);
const selectedRows = ref<TableRowData[]>([]);

// 获取图片URL
const getImageUrl = (url: string) => {
  return getNormalImageUrl(url, "small") || "/images/product-placeholder.png";
};

// 全选状态
const checkAll = computed({
  get: () => {
    return (
      tableData.value.length > 0 &&
      tableData.value.every((item) => item.selected)
    );
  },
  set: (val: boolean) => {
    handleCheckAllChange(val);
  },
});

// 部分选中状态
const isIndeterminate = computed(() => {
  return (
    selectedRows.value.length > 0 &&
    selectedRows.value.length < tableData.value.length
  );
});

// 过滤后的表格数据
const filteredTableData = computed(() => {
  if (!searchText.value) return tableData.value;

  const search = searchText.value.toLowerCase();
  return tableData.value.filter(
    (item) =>
      item.productName.toLowerCase().includes(search) ||
      (item.skuName && item.skuName.toLowerCase().includes(search))
  );
});

// 已选择的SKUs
const selectedSkus = computed(() => {
  return selectedRows.value
    .filter((row) => row.shipQuantity > 0)
    .map((row) => ({
      orderDetailId: row.orderDetailId,
      _id: row.skuId, // 按照API要求格式化
      pictures: row.images,
      quantity: row.shipQuantity,
    }));
});

// 总发货数量
const totalShipQuantity = computed(() => {
  return selectedRows.value.reduce(
    (sum, row) => sum + (row.shipQuantity || 0),
    0
  );
});

// 加载订单商品数据
const loadOrderProducts = async () => {
  if (!props.order) return;

  loading.value = true;
  try {
    // 处理订单数据，转换为表格数据
    const rows: TableRowData[] = [];

    if (props.order.orderDetails) {
      props.order.orderDetails.forEach((detail) => {
        detail.skus.forEach((sku) => {
          if (canShipSku(sku)) {
            const shipmentCounts = getShipmentCounts(sku);
            const shipped = shipmentCounts?.shippedCount || 0;
            const remaining = sku.quantity - shipped;

            if (remaining > 0) {
              rows.push({
                key: `${detail.productId}_${sku.skuId}`,
                orderDetailId: sku.orderDetailId,
                productId: detail.productId,
                productName: detail.productName,
                skuId: sku.skuId,
                skuName: sku.skuInfo?.name || sku.skuInfo?.attribute,
                image:
                  sku.skuInfo?.pictures?.[0] || detail.productPictures?.[0],
                images: sku.skuInfo?.pictures || detail.productPictures,
                quantity: sku.quantity,
                shipped: shipped,
                remaining: remaining,
                shipQuantity: 0,
                selected: false,
              });
            }
          }
        });
      });
    }

    tableData.value = rows;
  } catch (error) {
    console.error("Failed to process order products:", error);
    ElMessage.error(t("shipment.failedToLoadProducts"));
  } finally {
    loading.value = false;
  }
};

// 全选/取消全选
const handleCheckAllChange = (val: boolean) => {
  tableData.value.forEach((item) => {
    item.selected = val;
    if (val) {
      // 全选时，设置为可发送的最大数量
      item.shipQuantity = item.remaining;
    } else {
      // 取消全选时，重置发货数量
      item.shipQuantity = 0;
    }
  });

  updateSelectedRows();
  emitSelectedSkus();
};

// 单个商品选择状态变更
const handleItemCheckChange = (item: TableRowData) => {
  // 立即更新选中行
  updateSelectedRows();

  // 如果取消选择，将发货数量重置为0
  if (!item.selected) {
    item.shipQuantity = 0;
  } else {
    // 如果选中，设置为可发送的最大数量
    item.shipQuantity = item.remaining;
  }

  emitSelectedSkus();
};

// 数量变更
const handleQuantityChange = (item: TableRowData) => {
  // 超出数量时添加警告样式
  const inputWrapper = document.querySelector(
    `#input-${item.key} .el-input__wrapper`
  );
  if (inputWrapper) {
    if (item.shipQuantity > item.remaining) {
      inputWrapper.classList.add("is-exceed");
    } else {
      inputWrapper.classList.remove("is-exceed");
    }
  }

  emitSelectedSkus();
};

// 更新已选择行
const updateSelectedRows = () => {
  selectedRows.value = tableData.value.filter((item) => item.selected);
};

// 发送已选择的SKUs
const emitSelectedSkus = () => {
  emit("update:selectedSkus", selectedSkus.value);
};

// 监听订单变更
watch(
  () => props.order,
  () => {
    if (props.order) {
      loadOrderProducts();
    }
  },
  { immediate: true }
);

// 监听已选SKUs变化
watch(
  selectedSkus,
  () => {
    emitSelectedSkus();
  },
  { deep: true }
);

// 组件挂载时加载数据
onMounted(() => {
  if (props.order) {
    loadOrderProducts();
  }
});

// 处理行点击
const handleRowClick = (item: TableRowData) => {
  item.selected = !item.selected;
  handleItemCheckChange(item);
};
</script>

<style lang="scss" scoped>
.product-selection {
  width: 100%;
}

.table-header {
  display: flex;
  align-items: center;
  background-color: var(--el-fill-color-light);
  padding: 12px 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  border-radius: 4px 4px 0 0;
}

.table-body {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 0 0 4px 4px;
  overflow: hidden;
  min-height: 300px;
}

.table-row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: background-color 0.3s;
  cursor: pointer;

  &:hover {
    background-color: var(--el-fill-color-lighter);
  }

  &:last-child {
    border-bottom: none;
  }

  &.selected {
    background-color: var(--el-fill-color-lighter);
  }
}

.col-select {
  width: 48px;
  padding: 0 8px;
}

.col-product {
  flex: 1.5;
  min-width: 200px;
  max-width: 300px;
  overflow: hidden;
  padding: 0 8px;
}

.col-sku {
  flex: 1;
  min-width: 120px;
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 8px;
}

.col-quantity,
.col-shipped,
.col-remaining {
  width: 80px;
  text-align: center;
  padding: 0 8px;
}

.col-ship-quantity {
  width: 120px;
  text-align: center;
  padding: 0 8px;
  position: relative;

  .input-wrapper {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .el-input-number {
    width: 100%;

    :deep(.el-input__wrapper) {
      padding: 0 8px;
    }

    :deep(.el-input__wrapper.is-exceed) {
      border-color: var(--el-color-warning);
    }
  }

  .warning-icon {
    color: var(--el-color-danger);
    font-size: 16px;
    cursor: pointer;
  }
}

.product-info {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  overflow: hidden;
}

.product-image {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);

  .el-image {
    width: 100%;
    height: 100%;
  }
}

.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}

.product-name {
  font-size: 14px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-bar {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  .el-input {
    max-width: 300px;
  }
}

.loading-state,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--el-text-color-secondary);
}

.loading-icon {
  animation: rotating 2s linear infinite;
}

.selection-summary {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: var(--el-fill-color-light);
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-top: 1px;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
