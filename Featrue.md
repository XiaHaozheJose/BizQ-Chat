import axios from 'axios';
import { StripeAccountLinkResponse } from '@/types/shop-settings';

export const connectStripeAccount =
async (): Promise<StripeAccountLinkResponse> => {
const response = await axios.post<StripeAccountLinkResponse>(
'/payment/stripe'
);
return response.data;
};

import axios from 'axios';
import { TransportResponse, Transport, TransportRequestBody } from '@/types/transport';

export const getTransports = async (): Promise<TransportResponse> => {
const response = await axios.get<TransportResponse>('/transfers');
return response.data;
};

export const createTransport = async (transport: TransportRequestBody): Promise<Transport> => {
const response = await axios.post<Transport>('/transfers', transport);
return response.data;
};

export const updateTransport = async (transportId: string, transport: TransportRequestBody): Promise<Transport> => {
const response = await axios.patch<Transport>(`/transfers/${transportId}`, transport);
return response.data;
};

export const deleteTransport = async (transportId: string): Promise<void> => {
await axios.delete(`/transfers/${transportId}`);
};

import axios from 'axios';
import { OutOfStockRequest } from '@/types/requests/outOfStockRequest';

export const submitOutOfStock = async (requestBody: OutOfStockRequest): Promise<string> => {
const response = await axios.post('/shipments', requestBody);
return response.data;
};

import axios from 'axios';
import { OrdersResponse, Order, OrderSummary } from '../types/order';
import {
OrderPayRequest,
OrderSummaryRequest,
UpdateOrderSummaryRequest,
} from '../types/requests/orderRequests';

export const fetchOrders = async (params: any): Promise<OrdersResponse> => {
const response = await axios.get<OrdersResponse>('orders/', {
params,
});
return response.data;
};

export function cancelOrder(orderId: string) {
return axios.patch<{ orderHistoryId: string }>(`/orders/status/${orderId}`, {
status: 'canceled',
});
}

export const getOrderDetail = async ({
orderId,
orderNumber,
}: {
orderId?: string;
orderNumber?: string;
}): Promise<Order> => {
const params = new URLSearchParams();
params.append('paymentInfo', 'true');

let response;
if (orderNumber) {
params.append('orderNumber', orderNumber);
response = await axios.get<OrdersResponse>(`orders/?${params.toString()}`);
if (response.data.orderHistories.length === 0) {
throw new Error('Order not found');
}
return response.data.orderHistories[0];
}
if (orderId) {
response = await axios.get<Order>(`orders/${orderId}?${params.toString()}`);
return response.data;
}
throw new Error('Either orderId or orderNumber must be provided');
};

export const lockOrder = (orderId: string) => {
return axios.patch(`/orders/lock-status/${orderId}`, { lockStatus: 'lock' });
};

export const unlockOrder = (orderId: string) => {
return axios.patch(`/orders/lock-status/${orderId}`, {
lockStatus: 'unlock',
});
};

export const updateOrder = (
orderId: string,
data: { skus: Array<{ price: string; quantity: string; skuId: string }> }
) => {
return axios.patch<{ orderHistoryId: string }>(`/orders/${orderId}`, data);
};

export const getOrderSummary = (data: OrderSummaryRequest) => {
return axios.post<OrderSummary>('/order-summary', data);
};

export const updateOrderSummary = (data: UpdateOrderSummaryRequest) => {
return axios.post<OrderSummary>('/order-summary', data);
};

export const initiateOrderPay = (data: OrderPayRequest) => {
return axios.patch('/orders/order-pay', data);
};

import axios from 'axios';
import {
CreateShipmentRequest,
CreateShipmentResponse,
ShipmentsResponse,
Shipment,
} from '@/types/shipments';
import { EnumShipmentDetailStatus } from '@/types/enums';

// 创建发货单
export const createShipment = async (
data: CreateShipmentRequest
): Promise<CreateShipmentResponse> => {
const response = await axios.post<CreateShipmentResponse>(
'/shipments/',
data
);
return response.data;
};

// 获取发货单列表
export const fetchShipments = async (
params: any
): Promise<ShipmentsResponse> => {
const response = await axios.get<ShipmentsResponse>('shipments/', {
params,
});
return response.data;
};

// 获取发货单详情
export const getShipmentDetail = async (
shipmentId: string
): Promise<Shipment> => {
const response = await axios.get<{ shipment: Shipment }>(
`shipments/${shipmentId}`
);
return response.data.shipment;
};

// 更新发货单状态
export const updateShipmentStatus = async (
shipmentId: string,
status: EnumShipmentDetailStatus
): Promise<void> => {
await axios.patch(`/shipments/${shipmentId}/status`, { status });
};

// 取消发货单
export const cancelShipment = async (shipmentId: string): Promise<void> => {
await axios.delete(`/shipments/${shipmentId}`);
};

import axios from 'axios';
import { ShopSettings, ReturnSetting, ShipmentSetting, NationalShipmentSetting, PickUpExpiredTime } from '@/types/shop-settings';

export const getShopSettings = async (): Promise<ShopSettings> => {
const response = await axios.get<ShopSettings>('/shopSettings/');
return response.data;
};

export const updateShopSettings = async (
data: Partial<ShopSettings>
): Promise<ShopSettings> => {
const response = await axios.patch<ShopSettings>('/shopSettings', data);
return response.data;
};

export const getReturnSettings = async (): Promise<ReturnSetting> => {
const response = await axios.get<{ returnSetting: ReturnSetting }>('/shopSettings', {
params: {
properties: ['returnSetting']
}
});
return response.data.returnSetting;
};

export const updateReturnSettings = async (settings: ReturnSetting): Promise<ReturnSetting> => {
const response = await axios.patch('/shopSettings', { returnSetting: settings });
return response.data;
};

export const updateShipmentSettings = async (settings: ShipmentSetting, pickupExpiredTime: PickUpExpiredTime): Promise<void> => {
await axios.patch('/shopSettings', { shipmentSetting: settings, pickUpExpiredTime: pickupExpiredTime });
};

export const updateNationalShippingFeeSettings = async (feeSettings: NationalShipmentSetting): Promise<void> => {
await axios.patch<void>('/shopSettings', {shipmentSetting: {national: feeSettings}})
}

export interface OrderPayRequest {
shipmentCost: number;
orderHistoryId: string;
payForShipment: boolean;
payForRetentionTax: boolean;
payForTax: boolean;
moreDiscPct: number;
}

export interface OrderSummaryRequest {
orderHistoryId: string;
couponId?: string;
voucherIds?: string[];
}

export interface UpdateOrderSummaryRequest {
orderHistoryId: string;
payForTax?: boolean;
payForRetentionTax?: boolean;
moreDiscPct?: number;
shipmentCost?: number;
}

export interface OutOfStockSkuRequest {
quantity: number;
\_id: string;
reason: string;
description: string;
pictures: string[];
orderDetailId: string;
}

export interface OutOfStockRequest {
packageInfo: Record<string, unknown>;
type: 'outofstock';
shopId: string;
skus: OutOfStockSkuRequest[];
}

import { EnumShipmentDetailStatus } from './enums';
import { OrderDetail } from './order';
import { Address } from './address';
import { Transport } from './transport';
import { User, Business } from './user';

export interface ShipmentSku {
pictures: string[];
\_id: string;
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
status: EnumShipmentDetailStatus;
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
\_id: string;
type: string;
operator: string;
operatorTime: string;
}[];
createdAt: string;
updatedAt: string;
orderDetails: OrderDetail[];
transfer?: Transport;
shop: {
\_id: string;
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
// Define the response structure here
// This will depend on what your API returns after creating a shipment
id: string;
// ... other fields
}
