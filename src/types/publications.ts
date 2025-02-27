import { Business, BusinessType, Coupon, User, UserType } from ".";
import { Product } from "./product";

export interface PublicationQueryParams {
  limit: number;
  skip: number;
  showInPlatform: boolean;
  onlyPublication: boolean;
  publicType: PublicType;
  shopType: BusinessType[];
  followed?: boolean;
  following?: boolean;
  catIds?: string[];
  lat?: number;
  lon?: number;
  sort?: string[];
}

export interface Publications {
  count?: number;
  currentPageHasMoreData?: boolean;
  publications?: Publication[];
  hasMoreData?: boolean;
}

export interface Publication {
  likeCount?: number;
  commentCount?: number;
  isDeleted?: boolean;
  isBanned?: boolean;
  publicType?: PublicType;
  contentType?: ContentTypeEnum;
  contentArray?: string[];
  languages?: Language[];
  catIds?: string[];
  shopType?: BusinessType;
  showInPlatform?: boolean;
  products?: Product[];
  coupons?: Coupon[];
  contentText?: string;
  ownerId?: string;
  ownerType?: UserType;
  owner?: User;
  city?: string;
  createdAt?: string;
  updatedAt?: string;
  distance?: number;
  likes?: Like[];
  comments?: Comment[];
  couponIdsArr?: string[];
  id?: string;
}
export interface Comment {
  operator?: User;
  _id?: string;
  isDeleted?: boolean;
  content?: string;
  type?: string;
  publicationId?: string;
  operatorType?: UserType;
  operatorId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Banner {
  _id?: string;
  picture?: string;
}

export interface IndustriesDetail {
  catId?: string;
  name?: string;
  esName?: string;
  zhName?: string;
  _id?: string;
}

export enum Language {
  En = "en",
  Es = "es",
  Zh = "zh",
}

export interface Location {
  coordinates?: number[];
  _id?: string;
  type?: LocationType;
}

export enum LocationType {
  Point = "Point",
}

export interface Payload {
  app?: App;
  areaCode?: string;
  phone?: string;
  web?: App;
  lastLoginTimeStamp?: number;
}

export interface App {
  lastLoginTimeStamp?: number;
}

export enum ContentTypeEnum {
  Coupon = "coupon",
  Graphic = "graphic",
  Product = "product",
}

export interface Factory {
  shopIds?: string[];
  ownerId?: string;
  createdAt?: string;
  id?: string;
}

export interface Like {
  operator?: Business;
  _id?: string;
  isDeleted?: boolean;
  type?: string;
  publicationId?: string;
  operatorType?: UserType;
  operatorId?: string;
  publicationActivityId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export enum PublicationActivityType {
  Like = "like",
  Comment = "comment",
}

export enum PublicType {
  Public = "public",
}
