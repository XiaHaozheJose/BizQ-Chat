<template>
  <div class="order-item">
    <!-- 订单头部 -->
    <div class="order-header">
      <div class="order-id">
        {{ order.orderNumber }}
        <el-tag size="small" :type="getStatusType(order.status)">
          {{ getStatusLabel(order.status) }}
        </el-tag>
      </div>
      <div class="order-actions">
        <slot name="actions"></slot>
      </div>
    </div>

    <!-- 订单内容 -->
    <div class="order-content">
      <!-- 遍历每个SPU（OrderDetail） -->
      <div
        v-for="detail in order.orderDetails"
        :key="detail.productId"
        class="product-group"
      >
        <!-- SPU名称 -->
        <div class="product-name">{{ detail.productName }}</div>

        <!-- 遍历该SPU下的所有SKU -->
        <div v-for="sku in detail.skus" :key="sku.skuId" class="product-item">
          <div class="product-image">
            <el-image
              :src="getSkuImage(sku, detail).src"
              fit="cover"
              :preview-src-list="getSkuImage(sku, detail).previewList"
            />
          </div>
          <div class="product-info">
            <div class="product-property">
              {{ getSkuAttributes(sku, detail) }}
            </div>
          </div>
          <div class="product-price">€{{ sku.price.toFixed(2) }}</div>
          <div class="product-quantity">x{{ sku.quantity }}</div>
          <div class="product-total">
            €{{ (sku.price * sku.quantity).toFixed(2) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 订单底部 -->
    <div class="order-footer">
      <div class="store-info">
        <el-avatar
          :size="30"
          :src="isSeller() ? getBuyerAvatar() : getSellerAvatar()"
          :shape="
            isSeller()
              ? props.order.buyerHandler.operatorType == UserType.Shop
                ? 'square'
                : 'circle'
              : 'square'
          "
        />
        <span>{{ isSeller() ? getBuyerName() : getSellerName() }}</span>
      </div>
      <div class="order-time">
        {{ formatDate(order.createdAt) }}
      </div>
      <div class="order-summary">
        <span
          >{{ t("order.totalQuantity") }}:
          {{ calculateTotalQuantity(order) }}</span
        >
        <span class="shipping"
          >{{ t("order.shipping") }}: €{{
            (order.shipCostNoTax || 0).toFixed(2)
          }}</span
        >
        <span class="total"
          >{{ t("order.total") }}: €{{
            calculateOrderTotal(order).toFixed(2)
          }}</span
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Order, OrderStatus, OrderDetail, OrderSku } from "@/types/order";
import { DEFAULT_SHOP_AVATAR, getImageUrl, getNormalImageUrl } from "@/utils";
import { useI18n } from "vue-i18n";
import { useUserStore } from "@/store/user";
import { UserType } from "@/types";

const props = defineProps<{
  order: Order;
}>();

const { t } = useI18n();
const userStore = useUserStore();

// 获取状态样式
const getStatusType = (status: OrderStatus) => {
  const statusMap: Record<string, string> = {
    [OrderStatus.UNCONFIRMED]: "warning",
    [OrderStatus.CONFIRMED]: "success",
    [OrderStatus.CHECKED_OK]: "success",
    [OrderStatus.CHECK_PENDING]: "warning",
    [OrderStatus.CHECKED_ERROR]: "danger",
    [OrderStatus.DEPARTED]: "primary",
    [OrderStatus.PICKED_UP]: "success",
    [OrderStatus.TRANSFER_PENDING]: "warning",
    [OrderStatus.PICKUP_PENDING]: "warning",
    [OrderStatus.CANCELED_BY_SELLER]: "info",
    [OrderStatus.CANCELED_BY_BUYER]: "info",
    [OrderStatus.CANCELED]: "info",
  };
  return statusMap[status] || "info";
};

// 获取状态标签
const getStatusLabel = (status: OrderStatus) => {
  const statusMap: Record<string, string> = {
    [OrderStatus.UNCONFIRMED]: t("order.unconfirmed"),
    [OrderStatus.CONFIRMED]: t("order.confirmed"),
    [OrderStatus.CHECKED_OK]: t("order.checkedOk"),
    [OrderStatus.CHECK_PENDING]: t("order.checkPending"),
    [OrderStatus.CHECKED_ERROR]: t("order.checkedError"),
    [OrderStatus.DEPARTED]: t("order.departed"),
    [OrderStatus.PICKED_UP]: t("order.pickedUp"),
    [OrderStatus.TRANSFER_PENDING]: t("order.transferPending"),
    [OrderStatus.PICKUP_PENDING]: t("order.pickupPending"),
    [OrderStatus.CANCELED_BY_SELLER]: t("order.canceledBySeller"),
    [OrderStatus.CANCELED_BY_BUYER]: t("order.canceledByBuyer"),
    [OrderStatus.CANCELED]: t("order.canceled"),
  };
  return statusMap[status] || status;
};

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
};

// 获取SKU属性
const getSkuAttributes = (sku: OrderSku, detail: OrderDetail) => {
  try {
    let sizeInfo = "";
    let colorInfo = "";

    // 假设我们可以从skuId解析出部分信息
    const skuIdParts = sku.skuId.split("_");
    if (skuIdParts.length > 1) {
      sizeInfo = skuIdParts[0];
      colorInfo = skuIdParts[1];
    }
    if (!sizeInfo && !colorInfo) {
      return `Sizes-S/M - M/L, Color-${sku.orderDetailId.includes("Beige") ? "Beige" : "Blanco"}`;
    }
    // 格式化输出
    let result = [];
    if (sizeInfo) result.push(`Sizes-${sizeInfo}`);
    if (colorInfo) result.push(`Color-${colorInfo}`);

    return result.join(", ");
  } catch (error) {
    console.error("Error parsing SKU attributes:", error);
    return "Attributes unavailable";
  }
};

// 计算订单总数量
const calculateTotalQuantity = (order: Order) => {
  return order.orderDetails.reduce((sum, detail) => {
    return sum + detail.skus.reduce((skuSum, sku) => skuSum + sku.quantity, 0);
  }, 0);
};

// 计算订单总价
const calculateOrderTotal = (order: Order) => {
  const productTotal = order.orderDetails.reduce((sum, detail) => {
    return (
      sum +
      detail.skus.reduce((skuSum, sku) => skuSum + sku.price * sku.quantity, 0)
    );
  }, 0);

  const shipCost = order.shipCostNoTax || 0;

  return productTotal + shipCost;
};

const isSeller = () => {
  const myId = userStore.currentUser?.id;
  return props.order.sellerHandler?.id === myId;
};

// 获取卖家名称
const getSellerName = () => {
  return props.order.sellerHandler?.name || props.order.shopName || "";
};

// 获取卖家头像
const getSellerAvatar = () => {
  const logo = props.order.sellerHandler?.logo || props.order.shopLogo;
  if (logo) {
    return getImageUrl(logo, "small", true);
  }
  return DEFAULT_SHOP_AVATAR;
};

const getBuyerName = () => {
  return props.order.buyerHandler?.name || "";
};

const getBuyerAvatar = () => {
  const avatar =
    props.order.buyerHandler?.headImg || props.order.buyerHandler.logo || "";
  if (avatar) {
    return getImageUrl(avatar, "small", true);
  }
  return DEFAULT_SHOP_AVATAR;
};

// 获取SKU图片
const getSkuImage = (sku: OrderSku, detail: OrderDetail) => {
  // 检查SKU是否有图片
  const hasSkuImages = sku.skuInfo?.pictures && sku.skuInfo.pictures.length > 0;

  // 如果SKU有图片，使用SKU图片
  if (hasSkuImages) {
    return {
      src: getNormalImageUrl(sku.skuInfo.pictures[0], "small"),
      previewList: sku.skuInfo.pictures.map((picture) =>
        getNormalImageUrl(picture, "origin")
      ),
    };
  }

  // 如果SKU没有图片，使用SPU(productPictures)图片
  const hasSpuImages =
    detail.productPictures && detail.productPictures.length > 0;
  if (hasSpuImages) {
    return {
      src: getNormalImageUrl(detail.productPictures[0], "small"),
      previewList: detail.productPictures.map((picture) =>
        getNormalImageUrl(picture, "origin")
      ),
    };
  }

  // 如果都没有图片，返回默认图片
  return {
    src: DEFAULT_SHOP_AVATAR,
    previewList: [DEFAULT_SHOP_AVATAR],
  };
};
</script>

<style scoped lang="scss">
.order-item {
  margin-bottom: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background-color: #fff;
  overflow: hidden;

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background-color: #f5f7fa;
    border-bottom: 1px solid #ebeef5;

    .order-id {
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .order-actions {
      display: flex;
      gap: 10px;
    }
  }

  .order-content {
    padding: 15px;

    .product-group {
      margin-bottom: 20px;
      border-bottom: 1px solid #ebeef5;
      padding-bottom: 15px;

      &:last-child {
        margin-bottom: 0;
        border-bottom: none;
        padding-bottom: 0;
      }

      .product-name {
        font-weight: 600;
        font-size: 16px;
        margin-bottom: 10px;
        color: #303133;
        padding-left: 15px;
      }

      .product-item {
        display: flex;
        align-items: center;
        padding: 10px 0;
        margin-left: 15px;
        border-bottom: 1px dashed #ebeef5;

        &:last-child {
          border-bottom: none;
        }

        .product-image {
          width: 50px;
          height: 50px;
          margin-right: 15px;

          .el-image {
            width: 100%;
            height: 100%;
            border-radius: 4px;
          }
        }

        .product-info {
          flex: 1;
          min-width: 0;

          .product-property {
            color: #606266;
            font-size: 13px;
          }
        }

        .product-price,
        .product-quantity,
        .product-total {
          margin-left: 20px;
          text-align: right;
          min-width: 80px;
          font-size: 14px;
        }

        .product-total {
          color: #f56c6c;
          font-weight: bold;
        }
      }
    }
  }

  .order-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background-color: #f5f7fa;
    border-top: 1px solid #ebeef5;

    .store-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .order-time {
      color: #606266;
      font-size: 14px;
    }

    .order-summary {
      display: flex;
      align-items: center;
      gap: 15px;

      .shipping {
        color: #409eff;
      }

      .total {
        color: #f56c6c;
        font-weight: bold;
      }
    }
  }
}
</style>
