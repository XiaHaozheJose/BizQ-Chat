import type {
  OrderResponse,
  OrderListResponse,
  UpdateOrderParams,
  Order,
} from "@/types/order";
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
}): Promise<OrderListResponse> => {
  const response = await api.get<OrderListResponse>("/orders", { params });
  return response.data;
};

/**
 * 获取订单详情
 * @param orderId 订单ID
 * @returns 订单详情响应
 */
export const getOrderDetail = async (orderId: string): Promise<Order> => {
  const response = await api.get<Order>(`/orders/${orderId}?paymentInfo=true`);
  return response.data;
};

/**
 * 更新订单
 * @param orderId 订单ID
 * @param data 更新订单参数
 * @returns 订单响应
 */
export const updateOrder = async (
  orderId: string,
  data: UpdateOrderParams
): Promise<OrderResponse> => {
  const response = await api.patch<OrderResponse>(`/orders/${orderId}`, data);
  return response.data;
};

/**
 * 获取订单状态文本
 * @param status 订单状态
 * @returns 状态文本
 */
export const getOrderStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    unconfirmed: "待确认",
    confirmed: "已确认",
    checkedOK: "已审核",
    checkPending: "待审核",
    checkedError: "审核不通过",
    departed: "已发货",
    pickedUp: "已提货",
    transferPending: "待转运",
    pickUpPending: "待提货",
    canceledBySeller: "卖家已取消",
    canceledByBuyer: "买家已取消",
    canceled: "已取消",
  };
  return statusMap[status] || status;
};
