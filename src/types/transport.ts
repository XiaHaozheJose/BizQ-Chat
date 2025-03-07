import { UserType } from ".";

export enum TransferContractsType {
  SEUR = "SEUR",
  CORREOS = "CORREOS",
}

export enum TransportType {
  Platform = "contracts",
  Custom = "string",
}

export enum TransportUsedType {
  Send = "send",
  Return = "return",
}

export interface BaseContract {
  password?: string;
  username?: string;
}

export interface CorreosContract extends BaseContract {
  userCode?: string;
  customerNumber?: string;
  annexCode?: string;
  labellerCode?: string;
  contractNumber?: string;
}

export interface SeurContract extends BaseContract {
  sftpPassword?: string;
  nif?: string;
  franchise?: string;
  sftpUsername?: string;
  clientId?: string;
  sftpPath?: string;
  clientSecret?: string;
  sftpURL?: string;
  ccc?: string;
  seurid?: string;
  ci?: string;
  sftpPort?: string;
}

export interface Transport {
  _id?: string;
  isDeleted?: boolean;
  enabled?: boolean;
  usedFor?: TransportUsedType[];
  scrore?: number;
  ownerType?: UserType;
  ownerId?: string;
  transferType: TransportType;
  contractsType: TransferContractsType;
  contractsInfo: CorreosContract | SeurContract;
  name: string;
  phone: string;
  trackingUrl: string;
  officeLocationUrl: string;
  createdAt: string;
  pickupAtHome: {
    enabled: boolean;
    fee: number;
  };
  id: string;
  updatedAt: string;
  logo?: string;
  send2Office?: {
    enabled: boolean;
  };
  packageLimitation?: {
    locationTips?: string;
    length?: number;
    weight?: number;
    width?: number;
    height?: number;
  };
  isCustomerHandle?: boolean;
}

export interface TransportResponse {
  count: number;
  transfers: Transport[];
}

export interface TransportRequestBody {
  name: string;
  logo?: string;
  phone?: string;
  trackingUrl?: string;
  officeLocationUrl?: string;
  usedFor: TransportUsedType[];
  enabled: boolean;
  pickupAtHome: {
    enabled: boolean;
    fee?: number;
  };
  send2Office: {
    enabled: boolean;
  };
  packageLimitation: {
    locationTips?: string;
    length?: number;
    weight?: number;
    width?: number;
    height?: number;
  };
  transferType: TransportType;
  contractsType: TransferContractsType;
  contractsInfo: CorreosContract | SeurContract;
}
