import { OrderInvoiceInfo, ProductPriceSummary } from "./order";
import { Sku } from "./product";

export interface OrderPayRequest {
  shipmentCost: number;
  orderHistoryId: string;
  payForShipment: boolean;
  payForRetentionTax: boolean;
  payForTax: boolean;
  moreDiscPct: number;
}

export interface OrderSummaryRequest {
  orderHistoryId: string;
  couponId?: string;
  voucherIds?: string[];
}

export interface UpdateOrderSummaryRequest {
  orderHistoryId: string;
  payForTax?: boolean;
  payForRetentionTax?: boolean;
  moreDiscPct?: number;
  shipmentCost?: number;
}

export interface OrderSummaryDetail {
  needBook: boolean;
  skuId: string;
  productId: string;
  productSerialNumber: string;
  productPictures: string[];
  productName: string;
  price: number;
  quantity: number;
  priceBefore: number | null;
  quantityBefore: number | null;
  skuInfo: Sku;
  invoiceInfo: OrderInvoiceInfo;
}

export interface OrderSummary {
  totalCount: number;
  customerDiscPct: number;
  totalCustomerDisc: number;
  orderDetails: OrderSummaryDetail[];
  taxBaseAmount: number;
  fakeAmount: number;
  payForRetentionTax: boolean;
  retentionTaxAmount: number;
  payForTax: boolean;
  productTaxAmount: number;
  totalProductDisc: number;
  moreDiscPct: number;
  totalMoreDisc: number;
  totalCouponedDisc: number;
  payForShipment: boolean;
  shipCostNoTax: number;
  shipCostTax: number;
  totalAmount: number;
  productPriceSummary: ProductPriceSummary[];
}
