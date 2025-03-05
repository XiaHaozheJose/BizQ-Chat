import { defineStore } from "pinia";
import { ref } from "vue";
import {
  fetchOrders,
  cancelOrder,
  confirmOrder,
  getOrderDetail as apiGetOrderDetail,
} from "@/services/api/order";
import { Order } from "@/types/order";
import { ElMessage } from "element-plus";

export const useOrderStore = defineStore("order", () => {
  const orders = ref<Order[]>([]);
  const loading = ref(false);
  const hasMore = ref(true);
  const currentPage = ref(1);
  const pageSize = ref(10);

  // 获取订单详情
  const getOrderDetail = async (orderId: string) => {
    try {
      const orderDetail = await apiGetOrderDetail({ orderId });

      // 更新store中的订单列表 - 同时检查新旧ID
      const index = orders.value.findIndex(
        (order) => order.id === orderId || order.id === orderDetail.id
      );
      if (index !== -1) {
        orders.value[index] = orderDetail;
      }

      return orderDetail;
    } catch (error) {
      ElMessage.error("获取订单详情失败");
      console.error("Failed to get order detail:", error);
      throw error;
    }
  };

  // 更新单个订单
  const updateOrderInStore = async (orderId: string) => {
    try {
      // 获取最新的订单数据
      const updatedOrder = await apiGetOrderDetail({ orderId });

      // 在store中查找并更新订单
      const index = orders.value.findIndex(
        (order) => order.id === orderId || order.id === updatedOrder.id
      );
      if (index !== -1) {
        orders.value[index] = updatedOrder;
      }

      return updatedOrder;
    } catch (error) {
      console.error("Failed to update order in store:", error);
      throw error;
    }
  };

  const loadOrders = async (params: any = {}, refresh: boolean = false) => {
    if (loading.value) return;

    if (refresh) {
      currentPage.value = 1;
      orders.value = [];
      hasMore.value = true;
    }

    try {
      loading.value = true;

      // 构建查询参数
      const queryParams = {
        ...params,
        skip: (currentPage.value - 1) * pageSize.value,
        limit: pageSize.value,
        populates: ["orderDetails"],
      };

      const response = await fetchOrders(queryParams);

      if (refresh) {
        orders.value = response.orderHistories;
      } else {
        orders.value = [...orders.value, ...response.orderHistories];
      }

      hasMore.value = response.currentPageHasMoreData;
      currentPage.value += 1;
    } catch (error) {
      ElMessage.error("加载订单失败");
      console.error("Failed to load orders:", error);
    } finally {
      loading.value = false;
    }
  };

  const cancelOrderHandler = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      return true;
    } catch (error) {
      ElMessage.error("取消订单失败");
      console.error("Failed to cancel order:", error);
      return false;
    }
  };

  const confirmOrderHandler = async (orderId: string) => {
    try {
      await confirmOrder(orderId);
      return true;
    } catch (error) {
      ElMessage.error("确认订单失败");
      console.error("Failed to confirm order:", error);
      return false;
    }
  };

  return {
    orders,
    loading,
    hasMore,
    loadOrders,
    cancelOrderHandler,
    confirmOrderHandler,
    updateOrderInStore,
    getOrderDetail,
  };
});
