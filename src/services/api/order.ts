import type { Order, OrdersResponse, OrderStatusLabel } from "@/types/order";
import api from "./auth";

/**
 * 获取订单列表
 * @param params 查询参数
 * @returns 订单列表响应
 */
export const getOrders = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<OrdersResponse> => {
  const response = await api.get<OrdersResponse>("/orders", { params });
  return response.data;
};

/**
 * 获取订单详情
 * @param orderId 订单ID
 * @returns 订单详情响应
 */
export const getOrderDetail = async (params: {
  orderId?: string;
  orderNumber?: string;
}): Promise<Order> => {
  const queryParams = new URLSearchParams();
  queryParams.append("paymentInfo", "true");

  if (params.orderNumber) {
    queryParams.append("orderNumber", params.orderNumber);
    const response = await api.get<OrdersResponse>(
      `orders/?${queryParams.toString()}`
    );
    if (response.data.orderHistories.length === 0) {
      throw new Error("Order not found");
    }
    return response.data.orderHistories[0];
  }

  if (params.orderId) {
    const response = await api.get<Order>(
      `orders/${params.orderId}?${queryParams.toString()}`
    );
    return response.data;
  }

  throw new Error("Either orderId or orderNumber must be provided");
};

/**
 * 更新订单
 * @param orderId 订单ID
 * @param data 更新订单参数
 * @returns 订单响应
 */
export const updateOrder = (
  orderId: string,
  data: { skus: Array<{ price: string; quantity: string; skuId: string }> }
) => {
  return api.patch<{ orderHistoryId: string }>(`/orders/${orderId}`, data);
};

export type FetchOrderParams = {
  status?: OrderStatusLabel[];
  skip?: number;
  limit?: number;
  isActive?: boolean;
  buyerId?: string;
  shopId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
};
/**
 * 获取订单列表
 * @param params 查询参数
 * @returns 订单列表响应
 */
export const fetchOrders = async (
  params: FetchOrderParams
): Promise<OrdersResponse> => {
  const response = await api.get<OrdersResponse>("orders/", {
    params: {
      ...params,
      populates: ["buyerHandler", "orderDetails", "sellerHandler"],
    },
  });
  return response.data;
};

export const confirmOrder = (orderId: string) => {
  return api.patch<{ orderHistoryId: string }>(`/orders/status/${orderId}`, {
    status: "confirmed",
  });
};

export function cancelOrder(orderId: string) {
  return api.patch<{ orderHistoryId: string }>(`/orders/status/${orderId}`, {
    status: "canceled",
  });
}

export const lockOrder = (orderId: string) => {
  return api.patch(`/orders/lock-status/${orderId}`, { lockStatus: "lock" });
};

export const unlockOrder = (orderId: string) => {
  return api.patch(`/orders/lock-status/${orderId}`, {
    lockStatus: "unlock",
  });
};
