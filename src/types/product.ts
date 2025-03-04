import { Business } from "./user";

// 价格等级信息
interface PriceLevel {
  price: number;
  originalPrice: number;
  discount: number;
  min2Buy: number;
  aditionalDiscount?: boolean;
}

// 价格信息
export interface PriceInfo {
  level1: PriceLevel;
}
// SKU信息
export interface Sku {
  name: string;
  productId: string;
  pictures: string[];
  isDeleted: boolean;
  order: number;
  isWarning: boolean;
  isAvailable: boolean;
  needBook: boolean;
  stock: number;
  stockControl: "unlimit" | "notAllowedToBuy" | "needBook" | "unavailable";
  priceInfo: PriceInfo;
  id: string;
  attribute: string;
  combinations: Array<{
    id: string;
    content: string;
    name: string;
  }>;
  sellAttrContIds: string[];
  score: number;
  createdAt: string;
  updatedAt: string;
}

// 产品信息
export interface Product {
  id: string;
  storageId: string;
  shopId: string;
  name: string;
  serialNumber: string;
  pictures: string[];
  isAvailable: boolean;
  needBook: boolean;
  isDeleted: boolean;
  priceInfo: PriceInfo;
  skus: Sku[];
  shop?: Business;
  createdAt: string;
  updatedAt: string;
}

// API响应类型
export interface ProductsResponse {
  count: number;
  currentPageHasMoreData: boolean;
  products: Product[];
}

// 产品消息的权限状态
export enum ProductMessageApplyStatus {
  NEED_APPLY = "needApply",
  NO_SHOW_PRICE = "noShowPrice",
  NONE_APPLY = "noneApply",
}
