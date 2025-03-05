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
