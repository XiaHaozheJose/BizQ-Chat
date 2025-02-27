import { Business, BusinessType } from ".";

export interface Coupon {
  _id?: string;
  deductionValue?: number;
  isDeleted?: boolean;
  useStatus?: string;
  shopType?: BusinessType;
  usedCount?: number;
  collectedCount?: number;
  minAmount2Use?: number;
  useExpiredDate?: string;
  remark?: string;
  type?: ContentTypeEnum;
  collectExpiredDate?: string;
  discountValue?: number;
  shop?: Business;
  source?: string;
  shopId?: string;
  location?: Location;
  number?: string;
  createdAt?: string;
  updatedAt?: string;
  id?: string;
}

export enum ContentTypeEnum {
  Coupon = "coupon",
  Voucher = "voucher",
}
