import { Address } from "./address";

export interface Factory {
  shopIds: any[];
  ownerId: string;
  createdAt: string;
  id: string;
}

export interface Banner {
  _id: string;
  picture: string;
}

export interface Industry {
  name: string;
  catId: string;
  esName: string;
  zhName: string;
}

export interface AmountSetting {
  enabled: boolean;
  value: number;
}

export interface TaxSetting {
  taxInclude: boolean;
  taxId: string;
  tax: string;
}

export interface PickUpExpiredTime {
  day: number;
  hour: number;
}

export interface StripeSettings {
  enabled: boolean;
  requested: boolean;
  chargesEnabled: boolean;
  accountId: string;
}

export interface RedsysSettings {
  secret: string;
  merchantCode: string;
  enabled: boolean;
  terminal: number;
}

export interface PaymentOption {
  enabled: boolean;
  timeLimitToPay: number;
}

export interface TransferOption extends PaymentOption {
  account?: string;
  address?: string;
  benifit?: string;
  swift?: string;
  name?: string;
}

export interface PaymentSetting {
  Stripe: StripeSettings;
  Redsys: RedsysSettings;
  timeLimitToPay: number;
  payInShop: PaymentOption;
  transfer: TransferOption;
  automaticPay: boolean;
  minBuyAmount: number;
}

export interface ReturnSetting {
  returnLimitDays: number;
  allowCustomerHandle: boolean;
  firstReturnForFree: boolean;
  returnAddressId: string;
  prodsNoNeedReturnWhenAmountLessThan: AmountSetting;
  returnNeed2BeAdmitWhenAmountGreaterThan: AmountSetting;
  returnAddress: Address;
}

export interface FlatRateDetail {
  areaId: string;
  cost: number;
}

export interface FlatRateSetting {
  details: FlatRateDetail[];
  others: number;
  enabled: boolean;
}

export interface RangeDetail {
  cost: number;
  end: number;
  start: number;
}

export interface ByRageSetting {
  details: RangeDetail[];
  others: number;
  isActivated: boolean;
}

export interface IncreaseDetail {
  additional: number;
  increase: number;
  cost: number;
  withIn: number;
  isActivated: boolean;
}

export interface ByDistanceSetting {
  range?: ByRageSetting;
  increased?: IncreaseDetail;
  enabledAreas: string[];
  enabled: boolean;
}

export interface ByPriceSetting {
  enabled: boolean;
  enabledAreas: string[];
  increased?: IncreaseDetail;
  range?: ByRageSetting;
}

export interface ByWeightSetting {
  enabled: boolean;
  range: {
    details: FlatRateDetail[];
  };
}
export interface NationalShipmentSetting {
  customerHandle: boolean;
  freeShipFrom: AmountSetting;
  flatRate: FlatRateSetting;
  byDistance: ByDistanceSetting;
  byPrice: ByPriceSetting;
  byWeight: ByWeightSetting;
}

export interface InternationalShipmentSetting {
  customerHandle: boolean;
  flatRate: { enabled: boolean };
  freeShipFrom: AmountSetting;
  byDistance: ByDistanceSetting;
  byWeight: ByWeightSetting;
  byPrice: ByPriceSetting;
}

export interface ShipmentSetting {
  customerHandle: boolean;
  customerPickupDeadlineDays: number;
  customerPickupDeadlineHours: number;
  sendAddress: Address;
  national: NationalShipmentSetting;
}

export interface ShopSettings {
  returnSetting: ReturnSetting;
  showOnUserPerfile: boolean;
  recvOrderInChat: boolean;
  searchKeyWords: string[];
  newProductDaysScope: number;
  currency: string;
  discountProductScope: number;
  stockControl: StockControlType;
  noticeMeWhenStockIsNegative: boolean;
  shopId: string;
  taxSetting: TaxSetting;
  pickUpExpiredTime: PickUpExpiredTime;
  paymentSetting: PaymentSetting;
  shipmentSetting: ShipmentSetting;
  socials: any[];
  createdAt: string;
  id: string;
}

export interface StripeAccountLinkResponse {
  object: string;
  created: number;
  expires_at: number;
  url: string;
}

export enum StockControlType {
  Unlimit = "unlimit",
  NotAllowedToBuy = "notAllowedToBuy",
  NeedBook = "needBook",
  Unavailable = "unavailable",
}
