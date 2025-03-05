import { OrderStatus, OrderDetail } from "@/types/order";
import { getNullAvatarUrl } from "./image";
import { formatDate } from "./date";

// 获取订单状态对应的Element Plus Tag类型
export const getStatusType = (status?: OrderStatus) => {
  switch (status) {
    case OrderStatus.UNCONFIRMED:
      return "warning";
    case OrderStatus.CONFIRMED:
      return "success";
    case OrderStatus.CANCELED:
      return "danger";
    default:
      return "info";
  }
};

// 获取订单状态标签key
export const getStatusKey = (status?: OrderStatus) => {
  switch (status) {
    case OrderStatus.UNCONFIRMED:
      return "order.unconfirmed";
    case OrderStatus.CONFIRMED:
      return "order.confirmed";
    case OrderStatus.PENDING:
      return "order.processing";
    case OrderStatus.DONE:
      return "order.reviewed";
    case OrderStatus.CANCELED:
      return "order.canceled";
    default:
      return "order.unknown";
  }
};

// 格式化日期
export { formatDate };

// 获取SKU图片
export const getSkuImage = (sku: any, detail: OrderDetail) => {
  // 优先使用SKU的图片
  const skuImage = sku.skuInfo?.pictures?.[0];
  // 如果SKU没有图片,使用SPU的第一张图片
  const spuImage = detail.productPictures?.[0];

  const imageUrl = skuImage || spuImage;

  return {
    src: getNullAvatarUrl(imageUrl, "small"),
    previewList: [getNullAvatarUrl(imageUrl, "origin")],
  };
};
