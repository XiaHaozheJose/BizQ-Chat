import { Business, User } from "./user";
import type { ApiResponse } from "./api";

//这个其实是产品详情
export interface OrderDetail {
  productId: string;
  productSerialNumber: string;
  productName: string;
  productPictures: string[];
  skus: OrderSku[];
  addedTime: string;
  isActive: boolean;
  alreadyCreated: boolean;
  shipmentIds: string[];
  toBuyQuantity: number;
}

// 订单SKU
export interface OrderSku {
  orderDetailId: string;
  skuId: string;
  invoiceInfo: {
    originalPriceNoTax: number;
    aditionalDiscount: boolean;
    taxPct: number;
    totalDiscPct: number;
    subtotal: number;
  };
  price: number;
  quantity: number;
  addedTime: string;
  isActive: boolean;
}

export interface PayLog {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// 订单
export interface Order {
  id: string;
  buyerHandler: User;
  sellerHandler: Business;
  orderNumber: string;
  status: OrderStatus;
  lockStatus: OrderLockStatus;
  isActive: boolean;
  lastEditedBy: "buyer" | "seller";
  payStatus: OrderPayStatus;
  amount: number;
  fakeAmount: number;
  real2pay: number;
  totalCount: number;
  shopId: string;
  shopName: string;
  shopLogo: string;
  orderDetails: OrderDetail[];
  createdAt: string;
  updatedAt: string;
  remark?: string;
  isPreOrder: boolean;
  checkStatusShowToSeller: boolean;
  payLogs: PayLog[];
  paidValue: number;
  expiredAt?: string;
}

export interface OrderResponse extends ApiResponse<Order> {}

export interface OrderListResponse
  extends ApiResponse<{
    orders: Order[];
    total: number;
  }> {}

export interface CreateOrderParams {
  shopId: string;
  orderDetails: {
    productId: string;
    skus: {
      skuId: string;
      quantity: number;
    }[];
  }[];
  remark?: string;
}

export interface UpdateOrderParams {
  status?: OrderStatus;
  remark?: string;
}

export enum OrderStatus {
  UNCONFIRMED = "unconfirmed",
  CONFIRMED = "confirmed",
  CHECKED_OK = "checkedOK",
  CHECK_PENDING = "checkPending",
  CHECKED_ERROR = "checkedError",
  DEPARTED = "departed",
  PICKED_UP = "pickedUp",
  TRANSFER_PENDING = "transferPending",
  PICKUP_PENDING = "pickUpPending",
  CANCELED_BY_SELLER = "canceledBySeller",
  CANCELED_BY_BUYER = "canceledByBuyer",
  CANCELED = "canceled",
}

export enum OrderLockStatus {
  LOCK = "lock",
  UNLOCK = "unlock",
}

export enum OrderPayStatus {
  PAID = "paid",
  UNPAID = "unpaid",
}

export interface OrderStatusInfo {
  status: OrderStatus;
  content: string;
}
