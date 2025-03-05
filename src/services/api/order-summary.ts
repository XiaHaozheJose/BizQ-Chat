import api from "@/services/api/auth";
import {
  OrderPayRequest,
  OrderSummary,
  OrderSummaryRequest,
  UpdateOrderSummaryRequest,
} from "@/types/order-summary";

export const getOrderSummary = (data: OrderSummaryRequest) => {
  return api.post<OrderSummary>("/order-summary", data);
};

export const updateOrderSummary = (data: UpdateOrderSummaryRequest) => {
  return api.post<OrderSummary>("/order-summary", data);
};

export const initiateOrderPay = (data: OrderPayRequest) => {
  return api.patch("/orders/order-pay", data);
};
