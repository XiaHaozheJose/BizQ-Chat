import { Address } from "./address";
import { Coupon } from "./cupons";
import { Sku } from "./product";
import { ShipmentDetailStatus, ShipmentDetailType } from "./shipments";
import { Business, User } from "./user";

export interface OrdersResponse {
  count: number;
  currentPageHasMoreData: boolean;
  orderHistories: Order[];
}

export enum OrderLastEditedBy {
  Buyer = "buyer",
  Seller = "seller",
}

export enum OrderLockStatus {
  Unlocked = "unlock",
  LockedBySeller = "lockedBySeller",
  LockedByBuyer = "lockedByBuyer",
}

export enum OrderPayStatus {
  PAID = "paid",
  UNPAID = "unpaid",
  SETPAID = "setAsPaid",
}

export interface OrderStatusInfo {
  status: OrderStatus;
  content: string;
}

export interface Policy {
  send: string;
  return: string;
}

export enum PaymentMethod {
  Transfer = "transfer",
  Redsys = "Redsys",
  PayInShop = "payInShop",
}

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

export interface OrderInvoiceInfo {
  originalPriceNoTax: number;
  aditionalDiscount: boolean;
  taxPct: number;
  totalDiscPct: number;
  subtotal: number;
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
  productId: string;
  price: number;
  quantity: number;
  priceBefore: number | null;
  quantityBefore: number | null;
  skuInfo: Sku;
  addedTime: string;
  isActive: boolean;
  alreadyCreated: boolean;
  shipmentIds: string[];
  shipmentsDetails: ShipmentDetail[]; // 更新这里
}

// 新增 ShipmentDetail 接口
export interface ShipmentDetail {
  _id: string;
  id: string;
  status: ShipmentDetailStatus;
  type: ShipmentDetailType;
  skus: Sku[];
}

export interface PayLog {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPriceSummary {
  id: string;
  taxBase: number;
  taxPct: number;
  subtotal: number;
}

// 订单
export interface Order {
  id: string;
  sellerHandler: Business;
  buyerHandler: User;
  allow2useCoupon: boolean;
  fakeAmount: number;
  couponedValue: number;
  usedVouchers: string[];
  usedCoupon: string;
  usedCouponDetail: Coupon;
  amount: number;
  totalCount: number;
  payForShipment: boolean;
  customerDiscount: number;
  productDiscount: number;
  moreDiscPct: number;
  moreDiscount: number;
  payForRetentionTax: boolean;
  payForTax: boolean;
  packagePictures: string[];
  checkStatusShowToSeller: boolean;
  status: OrderStatus;
  lockStatus: OrderLockStatus;
  isActive: boolean;
  isPreOrder: boolean;
  payStatus: OrderPayStatus;
  imported: boolean;
  sellerStartedPayment: boolean;
  voucherPaidShipCosPct: number;
  address: Address;
  invoiceAddress: Address | null;
  shopId: string;
  shopName: string;
  shopLogo: string;
  lastEditedBy: OrderLastEditedBy;
  paymentMethod: PaymentMethod;
  productPriceSummary: ProductPriceSummary[];
  orderNumber: string;
  real2pay?: number;
  customerDiscPct: number;
  retentionTax: number;
  shipCostNoTax: number;
  shipCostTax: number;
  policies: Policy;
  policy?: Policy;
  createdAt: string;
  updatedAt: string;
  usedVouchersDetail: Coupon[];
  orderDetails: OrderDetail[];
  payLogs: PayLog[];
  paidValue: number;
  expiredAt?: string;
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

export enum OrderStatusLabel {
  ALL = "all",
  UNCONFIRMED = "unconfirmed",
  CONFIRMED = "confirmed",
  PENDING = "pending",
  DONE = "done",
  CANCELED = "canceled",
}
