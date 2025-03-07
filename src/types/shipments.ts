// 新增 ShipmentDetailStatus 枚举
export enum ShipmentDetailStatus {
  TransferPending = "transferPending",
  Departed = "departed",
  Recved = "recved",
  TobeReview = "tobeReview",
  Rejected = "rejected",
  Approved = "approved",
  Refunding = "refunding",
  PickupPending = "pickupPending",
  Pickedup = "pickedup",
  Canceled = "canceled",
}

export enum ShipmentDetailType {
  Shipment = "shipment",
  OutOfStock = "outofstock",
  Return = "return",
}

import { OrderDetail } from "./order";
import { Address } from "./address";
import { Transport } from "./transport";
import { User, Business } from "./user";

export interface ShipmentSku {
  pictures: string[];
  _id: string;
  quantity: number;
  orderDetailId: string;
}

export interface ShipmentPackageInfo {
  length: number;
  weight: number;
  width: number;
  height: number;
  count: number;
}

export interface Shipment {
  id: string;
  buyer: User | Business;
  isDeleted: boolean;
  customerHandle: boolean;
  onlyAcceptVoucher: boolean;
  orderNumbers: string[];
  collected: boolean;
  manifested: boolean;
  status: ShipmentDetailStatus;
  pkgNumbers: string[];
  need2admit: boolean;
  need2return: boolean;
  type: string;
  creatorRole: string;
  creatorId: string;
  shipmentRef: string;
  packageInfo?: ShipmentPackageInfo;
  skus: ShipmentSku[];
  shopId: string;
  transferId?: string;
  receiverAddress: Address;
  senderAddressId: string;
  buyerId: string;
  rejectHistory: any[]; // 可以根据实际情况定义更具体的类型
  logs: {
    _id: string;
    type: string;
    operator: string;
    operatorTime: string;
  }[];
  createdAt: string;
  updatedAt: string;
  orderDetails: OrderDetail[];
  transfer?: Transport;
  shop: {
    _id: string;
    logo: string;
    name: string;
    id: string;
  };
  refunds: any[]; // 可以根据实际情况定义更具体的类型
}

export interface ShipmentsResponse {
  count: number;
  currentPageHasMoreData: boolean;
  shipments: Shipment[];
}

export interface CreateShipmentRequest {
  receiverAddress: Address;
  type: string;
  senderAddressId: string;
  skus: ShipmentSku[];
  packageInfo?: ShipmentPackageInfo;
  shopId: string;
  transferId?: string;
  customerHandle: boolean;
}

export interface CreateShipmentResponse {
  id: string;
}
