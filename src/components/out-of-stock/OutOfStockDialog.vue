<template>
  <el-dialog
    v-model="dialogVisible"
    :title="t('order.outOfStock')"
    width="800px"
    :close-on-click-modal="false"
  >
    <div v-loading="loading" class="dialog-content">
      <!-- 全部缺货按钮 -->
      <div class="toolbar">
        <el-button type="primary" @click="handleAllOutOfStock">
          {{ t("outOfStock.allOutOfStock") }}
        </el-button>
      </div>

      <!-- 商品选择表格 -->
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
          <div class="col-oos-quantity">{{ t("product.quantity") }}</div>
        </div>

        <!-- 表格内容 -->
        <div class="table-body">
          <template v-if="tableData.length === 0">
            <!-- 空状态 -->
            <div class="empty-state">
              {{ t("outOfStock.noProductsToSetOutOfStock") }}
            </div>
          </template>
          <template v-else>
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
              :class="{ selected: item.selected, expanded: item.expanded }"
            >
              <!-- 基本信息行 -->
              <div class="main-row" @click="handleRowClick(item, $event)">
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
                <div class="col-oos-quantity" @click.stop>
                  <div class="input-wrapper" @click.stop>
                    <el-input-number
                      :id="`input-${item.key}`"
                      v-model="item.outOfStockQuantity"
                      :min="0"
                      :max="item.remaining"
                      :disabled="!item.selected"
                      :controls="true"
                      :step="1"
                      @change="handleQuantityChange(item)"
                    />
                    <el-tooltip
                      v-if="item.outOfStockQuantity > item.remaining"
                      :content="t('outOfStock.exceedRemainingQuantity')"
                      placement="top"
                    >
                      <el-icon class="warning-icon"><Warning /></el-icon>
                    </el-tooltip>
                  </div>
                </div>
                <div class="col-actions" @click.stop>
                  <el-button text @click="toggleItemExpand(item)">
                    <el-icon>
                      <component :is="item.expanded ? ArrowLeft : ArrowRight" />
                    </el-icon>
                  </el-button>
                </div>
              </div>

              <!-- 展开的详情区域（原因和上传图片） -->
              <div
                v-if="item.selected && item.expanded"
                class="detail-row"
                @click.stop
              >
                <div class="detail-content">
                  <div class="reason-selection">
                    <div class="field-label">{{ t("outOfStock.reason") }}</div>
                    <el-select
                      v-model="item.reason"
                      class="reason-select"
                      @click.stop
                    >
                      <el-option
                        v-for="reason in reasons"
                        :key="reason"
                        :label="t(`outOfStock.reasons.${reason}`)"
                        :value="reason"
                      />
                    </el-select>
                  </div>
                  <div class="description-field">
                    <div class="field-label">
                      {{ t("outOfStock.description") }}
                    </div>
                    <el-input
                      v-model="item.description"
                      type="textarea"
                      :rows="3"
                      :placeholder="t('outOfStock.descriptionPlaceholder')"
                      @click.stop
                    />
                  </div>
                  <div class="upload-field">
                    <div class="field-label">
                      {{ t("outOfStock.uploadImages") }}
                    </div>
                    <el-upload
                      :file-list="item.fileList"
                      list-type="picture-card"
                      multiple
                      :limit="9"
                      :on-success="
                        (res: string) => handleUploadSuccess(res, item)
                      "
                      :on-remove="(file: any) => handleRemoveFile(file, item)"
                      :http-request="
                        (options: any) => uploadFile(options, item)
                      "
                      @click.stop
                    >
                      <el-icon><Plus /></el-icon>
                      <template #file="{ file }">
                        <img
                          class="el-upload-list__item-thumbnail"
                          :src="file.url"
                          alt=""
                        />
                        <span class="el-upload-list__item-actions">
                          <el-icon @click.stop="handlePreview(file)"
                            ><View
                          /></el-icon>
                          <el-icon @click.stop="handleRemoveFile(file, item)"
                            ><Close
                          /></el-icon>
                        </span>
                      </template>
                    </el-upload>
                  </div>
                </div>
              </div>
            </div>

            <!-- 已选商品摘要 -->
            <div v-if="selectedRows.length" class="selection-summary">
              <span>{{
                t("outOfStock.selectedProducts", { count: selectedRows.length })
              }}</span>
              <span>{{
                t("outOfStock.totalOutOfStock", {
                  count: totalOutOfStockQuantity,
                })
              }}</span>
            </div>
          </template>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">
          {{ t("common.cancel") }}
        </el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ t("common.confirm") }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Search,
  Picture,
  Warning,
  Plus,
  View,
  Close,
  ArrowRight,
  ArrowLeft,
} from "@element-plus/icons-vue";
import { uploadFiles } from "@/services/api/upload";
import { submitOutOfStock } from "@/services/api/out-of-stock";
import type {
  OutOfStockRequest,
  OutOfStockSkuRequest,
} from "@/types/shipments";
import type { Order, OrderDetail, OrderSku } from "@/types/order";
import { canShipSku, getShipmentCounts } from "@/utils";
import { getNormalImageUrl } from "@/utils";

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
  outOfStockQuantity: number;
  selected: boolean;
  expanded: boolean;
  reason: string;
  description: string;
  fileList: { name: string; url: string; raw?: File; response?: string }[];
}

// 缺货理由选项
const reasons = [
  "betterPriceAvailable",
  "performanceOrQualityNotAdequate",
  "incompatibleOrNotUseful",
  "itemIsDamaged",
  "missedEstimatedDeliveryDate",
  "itemMissingOrOutStock",
  "belowMyExpectations",
  "wrongItems",
  "itemDefectiveOrDoesnotWork",
  "arrivedInAdditional",
  "tooBig",
  "tooSmall",
  "descriptionWasNotAccurate",
  "others",
];

const props = defineProps<{
  visible: boolean;
  order: Order | null;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "out-of-stock-completed"): void;
  (e: "cancel-order-requested"): void;
}>();

const { t } = useI18n();

// 对话框可见状态
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

// 搜索文本
const searchText = ref("");
// 加载状态
const loading = ref(false);
// 提交状态
const submitting = ref(false);
// 表格数据
const tableData = ref<TableRowData[]>([]);
// 选中的行
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

// 总缺货数量
const totalOutOfStockQuantity = computed(() => {
  return selectedRows.value.reduce(
    (sum, row) => sum + (row.outOfStockQuantity || 0),
    0
  );
});

// 是否有发货记录
const hasShippedItems = computed(() => {
  if (!props.order) return false;

  return props.order.orderDetails.some((detail) =>
    detail.skus.some((sku) => {
      const counts = getShipmentCounts(sku);
      return counts.shippedCount + counts.receivedCount > 0;
    })
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
            const shipped =
              shipmentCounts.shippedCount + shipmentCounts.receivedCount;
            const remaining =
              sku.quantity - shipped - shipmentCounts.outOfStockCount;

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
                outOfStockQuantity: 0,
                selected: false,
                expanded: false,
                reason: "itemMissingOrOutStock", // 默认理由
                description: "",
                fileList: [],
              });
            }
          }
        });
      });
    }

    tableData.value = rows;
  } catch (error) {
    console.error("Failed to process order products:", error);
    ElMessage.error(t("outOfStock.failedToLoadProducts"));
  } finally {
    loading.value = false;
  }
};

// 全选/取消全选
const handleCheckAllChange = (val: boolean) => {
  tableData.value.forEach((item) => {
    item.selected = val;
    if (val) {
      // 全选时，设置缺货数量为可用最大数量
      item.outOfStockQuantity = item.remaining;
      item.expanded = true; // 展开详情
    } else {
      // 取消全选时，重置缺货数量
      item.outOfStockQuantity = 0;
      item.expanded = false; // 收起详情
    }
  });

  updateSelectedRows();
};

// 单个商品选择状态变更
const handleItemCheckChange = (item: TableRowData) => {
  // 更新选中行
  updateSelectedRows();

  if (!item.selected) {
    // 取消选择时清空数据
    item.outOfStockQuantity = 0;
    item.expanded = false;
  } else {
    // 选中时设置默认值并展开详情 - 只有在初次选中且数量为0时才设置为最大值
    if (item.outOfStockQuantity === 0) {
      item.outOfStockQuantity = item.remaining;
    }
    item.expanded = true;
  }
};

// 数量变更
const handleQuantityChange = (item: TableRowData) => {
  // 确保数量为整数
  item.outOfStockQuantity = Math.floor(item.outOfStockQuantity);

  // 处理限制
  if (item.outOfStockQuantity > item.remaining) {
    ElMessage.warning(t("outOfStock.quantityExceeded"));
  }

  // 如果数量为0，取消选择
  if (item.outOfStockQuantity === 0 && item.selected) {
    item.selected = false;
    item.expanded = false;
    updateSelectedRows();
  } else if (item.outOfStockQuantity > 0 && !item.selected) {
    // 如果数量大于0但未选中，则选中
    item.selected = true;
    item.expanded = true;
    updateSelectedRows();
  }
};

// 切换行的展开状态
const toggleItemExpand = (item: TableRowData) => {
  item.expanded = !item.expanded;
};

// 处理全部缺货
const handleAllOutOfStock = async () => {
  if (!hasShippedItems.value) {
    // 订单没有任何发货记录，提示是否取消订单
    ElMessageBox.confirm(
      t("outOfStock.cancelOrderConfirmation"),
      t("common.warning"),
      {
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
        type: "warning",
      }
    )
      .then(() => {
        emit("cancel-order-requested");
        dialogVisible.value = false;
      })
      .catch(() => {
        // 用户取消操作，继续留在页面
      });
  } else {
    // 已有发货记录，全选所有SKU
    handleCheckAllChange(true);
  }
};

// 更新选中行
const updateSelectedRows = () => {
  selectedRows.value = tableData.value.filter((item) => item.selected);
};

// 处理预览
const handlePreview = (file: any) => {
  if (file.url) {
    window.open(file.url, "_blank");
  }
};

// 处理文件上传
const uploadFile = async (options: any, item: TableRowData) => {
  const { file, onSuccess, onError, onProgress } = options;

  try {
    const formData = new FormData();
    formData.append("files", file);

    const urls = await uploadFiles([file]);

    if (urls && urls.length > 0) {
      const url = urls[0];
      onSuccess(url);
    } else {
      onError(new Error("Upload failed"));
    }
  } catch (error) {
    onError(error);
    ElMessage.error(t("common.uploadFailed"));
  }
};

// 处理上传成功
const handleUploadSuccess = (response: string, item: TableRowData) => {
  item.fileList.push({
    name: new Date().getTime().toString(),
    url: getNormalImageUrl(response) || "",
    response: response, // 保存原始返回值用于提交
  });
};

// 处理移除文件
const handleRemoveFile = (file: any, item: TableRowData) => {
  const index = item.fileList.findIndex((f) => f.url === file.url);
  if (index !== -1) {
    item.fileList.splice(index, 1);
  }
};

// 处理提交
const handleSubmit = async () => {
  // 验证选择
  if (selectedRows.value.length === 0) {
    ElMessage.warning(t("outOfStock.pleaseSelectProducts"));
    return;
  }

  // 验证数据
  const invalidItems = selectedRows.value.filter(
    (item) =>
      !item.reason ||
      item.outOfStockQuantity <= 0 ||
      item.outOfStockQuantity > item.remaining
  );

  if (invalidItems.length > 0) {
    ElMessage.warning(t("outOfStock.invalidItemsFound"));
    return;
  }

  submitting.value = true;
  try {
    const skus: OutOfStockSkuRequest[] = selectedRows.value.map((item) => ({
      quantity: item.outOfStockQuantity,
      _id: item.skuId,
      reason: item.reason,
      description: item.description,
      pictures: item.fileList
        .map((file) => file.response || "")
        .filter(Boolean),
      orderDetailId: item.orderDetailId,
    }));

    const requestBody: OutOfStockRequest = {
      packageInfo: {},
      type: "outofstock",
      shopId: props.order?.shopId || "",
      skus: skus,
    };

    await submitOutOfStock(requestBody);
    ElMessage.success(t("outOfStock.submitSuccess"));
    emit("out-of-stock-completed");
    dialogVisible.value = false;
  } catch (error) {
    console.error("Failed to submit out of stock:", error);
    ElMessage.error(t("outOfStock.submitError"));
  } finally {
    submitting.value = false;
  }
};

// 处理行点击
const handleRowClick = (item: TableRowData, event: MouseEvent) => {
  // 防止点击到控件区域时仍然触发行点击
  const target = event.target as HTMLElement;
  const isInputNumberArea = target.closest(".col-oos-quantity");
  if (isInputNumberArea) {
    return;
  }

  // 只处理选择/取消选择逻辑，不处理展开/折叠
  item.selected = !item.selected;
  handleItemCheckChange(item);
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

// 组件挂载时加载数据
onMounted(() => {
  if (props.order) {
    loadOrderProducts();
  }
});
</script>

<style lang="scss" scoped>
.dialog-content {
  display: flex;
  flex-direction: column;
  max-height: 70vh;
  overflow-y: auto;
}

.toolbar {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}

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
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: background-color 0.3s;

  &:last-child {
    border-bottom: none;
  }

  &.selected {
    background-color: var(--el-fill-color-lighter);
  }
}

.main-row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;

  &:hover {
    background-color: var(--el-fill-color-lighter);
  }
}

.detail-row {
  padding: 0 16px 16px 48px;
  background-color: var(--el-fill-color-light);
  border-top: 1px dashed var(--el-border-color);
}

.detail-content {
  padding: 16px;
  background-color: white;
  border-radius: 4px;
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

.col-oos-quantity {
  width: 160px;
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
    :deep(.el-input__inner) {
      text-align: center;
    }
  }

  .warning-icon {
    color: var(--el-color-danger);
    font-size: 16px;
    cursor: pointer;
  }
}

.col-actions {
  width: 40px;
  text-align: center;
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

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--el-text-color-secondary);
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

.field-label {
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.reason-selection,
.description-field,
.upload-field {
  margin-bottom: 16px;
}

.reason-select {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
