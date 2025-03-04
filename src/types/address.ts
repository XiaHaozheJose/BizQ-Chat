export interface Area {
  _id: string;
  isDeleted: boolean;
  name: string;
  type: string;
  parentId: string;
  areaCode: string;
}

export interface Address {
  _id: string;
  type: string;
  isDefault: boolean;
  isDefaultInvoice: boolean;
  isDeleted: boolean;
  remark: string;
  countryId: string;
  city: string;
  areaCode: string;
  street: string;
  provinceId: string;
  recvName: string;
  zipcode: string;
  phone: string;
  ownerType: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  NIF: string;
  companyName: string;
  country: Area;
  province: Area;
}
