import { Business } from "./user";

export enum BondType {
  COUPON = "coupon",
  VOUCHER = "voucher",
}

export interface BondLocation {
  coordinates: [number, number];
}

export interface BondDetail {
  id: string;
  type: BondType;
  discountValue?: number;
  deductionValue?: number;
  collectExpiredDate: string;
  useExpiredDate: string;
  remark: string;
  minAmount2Use: number;
  isDeleted: boolean;
  usedCount: number;
  collectedCount: number;
  source: string;
  shopId: string;
  number: string;
  createdAt: string;
  updatedAt: string;
  shop: Business;
  location: BondLocation;
  shopType: string;
  useStatus: string;
}
