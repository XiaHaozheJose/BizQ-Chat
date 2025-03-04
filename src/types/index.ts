// 用户类型枚举
export enum UserType {
  User = "user",
  Shop = "shop",
}

export enum ShopType {
  Wholesaler = "Wholesaler",
  Manufacturer = "Manufacturer",
  Retailer = "Retailer",
}

export enum EnumCouponType {
  Coupon = "coupon",
  Voucher = "voucher",
}

export enum EnumCouponSource {
  Collected = "collected",
  Generated = "generated",
}

export enum EnumCouponUseStatus {
  Used = "used",
  Unused = "idle",
  Occupied = "occupied",
}

export enum EnumLockStatus {
  Unlocked = "unlock",
  LockedBySeller = "lockedBySeller",
  LockedByBuyer = "lockedByBuyer",
}

export enum EnumPaymentStatus {
  Unpaid = "unpaid",
  Paid = "paid",
  SetAsPaid = "setAsPaid",
}

export enum EnumPaymentMethod {
  Transfer = "transfer",
  Redsys = "Redsys",
  PayInShop = "payInShop",
}

export enum EnumLastEditedType {
  Buyer = "buyer",
  Seller = "seller",
}

// 新增 ShipmentDetailStatus 枚举
export enum EnumShipmentDetailStatus {
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

export enum EnumShipmentDetailType {
  Shipment = "shipment",
  OutOfStock = "outofstock",
  Return = "return",
}

export enum EnumTransferContractsType {
  SEUR = "SEUR",
  CORREOS = "CORREOS",
}

export enum EnumTransportType {
  Platform = "contracts",
  Custom = "string",
}

export enum EnumTransportUsedType {
  Send = "send",
  Return = "return",
}

export enum EnumStockControl {
  Unlimit = "unlimit",
  NotAllowedToBuy = "notAllowedToBuy",
  NeedBook = "needBook",
  Unavailable = "unavailable",
}

export enum BusinessPublicStatus {
  PUBLIC = "public",
  PRIVATE = "private",
  NOSHOWPRICE = "noShowPrice",
}

export enum BusinessStatus {
  NORMAL = "normal",
  REVIEWING = "reviewing",
}

export enum EnumAddressType {
  Normal = "normal",
  Invoice = "invoice",
}

export enum EnumAreaType {
  Country = "country",
  Province = "province",
}

export enum CouponStatus {
  Idle = "idle",
  Used = "used",
  Expired = "expired",
  OKUPA = "okupa",
}

export enum CouponType {
  Coupon = "coupon",
  Voucher = "voucher",
}

export enum PublicationActivityType {
  Like = "like",
  Comment = "comment",
  Coupon = "coupon",
}

export enum PublicationContentType {
  Graphic = "graphic",
  Product = "product",
  Coupon = "coupon",
}

export enum PublicationPublicType {
  Public = "public",
  Private = "friend",
}

export enum AccessRequestStatus {
  Pending = "pending",
  Allowed = "allowed",
  Blocked = "blocked",
}

export enum AccessRequestMethod {
  Code = "code",
  Request = "request",
}

export enum AccessRequestType {
  Shop = "shop",
  PrivatePublication = "privatePublication",
}

export enum AccessCodeStatus {
  Active = "active",
  Expired = "expired",
}

// 商家类型枚举
export enum BusinessType {
  Retailer = "Retailer",
  Manufacturer = "Manufacturer",
  Wholesaler = "Wholesaler",
}

// 访问权限类型
export enum AccessType {
  Public = "public",
  Private = "private",
  NoShowPrice = "noShowPrice",
}

// 分页参数
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// 导出所有类型
export type {
  Contact,
  ContactGroup,
  CreateContactParams,
  UpdateContactParams,
  CreateGroupParams,
  UpdateGroupParams,
  ContactListResponse,
  ContactGroupListResponse,
  ContactResponse,
  ContactGroupResponse,
} from "./contact";

export type { Message, Conversation, ConversationUser } from "./chat";

export { UserStatus, MessageStatus, MessageType } from "./chat";

export type {
  ApiResponse,
  LoginParams,
  LoginResponse,
  UserInfo,
  ShopsListResponse,
  SwitchOperatorParams,
} from "./api";

export type { User, Business, IndustryContent, Permission, Role } from "./user";

export type {
  Coupon,
  ContentTypeEnum as CouponContentTypeEnum,
} from "./cupons";

export type {
  Publication,
  PublicationQueryParams,
  Comment,
  Like,
  PublicType,
  Language,
  Location,
  Payload,
  ContentTypeEnum as PublicationContentTypeEnum,
  LocationType,
  App,
} from "./publications";

export type {
  Order,
  OrderSku,
  OrderStatus,
  OrderLockStatus,
  OrderPayStatus,
  OrderDetail,
  PayLog,
  UpdateOrderParams,
  OrderStatusInfo,
} from "./order";
