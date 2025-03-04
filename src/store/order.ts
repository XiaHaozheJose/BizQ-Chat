import { defineStore } from "pinia";
import { ref } from "vue";
import { fetchOrders, cancelOrder, confirmOrder } from "@/services/api/order";
import { Order } from "@/types/order";
import { ElMessage } from "element-plus";

export const useOrderStore = defineStore("order", () => {
  const orders = ref<Order[]>([]);
  const loading = ref(false);
  const hasMore = ref(true);
  const currentPage = ref(1);
  const pageSize = ref(10);

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
      await confirmOrder(orderId); // 确保API中添加了这个方法
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
  };
});
