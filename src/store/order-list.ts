import { defineStore } from "pinia";
import { ref } from "vue";
import { OrderStatusLabel } from "@/types/order";

export const useOrderListStore = defineStore("orderList", () => {
  // 当前选中的状态tab
  const activeStatus = ref<OrderStatusLabel>(OrderStatusLabel.ALL);

  // 搜索文本
  const searchText = ref("");

  // 日期范围
  const dateRange = ref<[Date | null, Date | null]>([null, null]);

  // 重置所有状态
  const resetState = () => {
    activeStatus.value = OrderStatusLabel.ALL;
    searchText.value = "";
    dateRange.value = [null, null];
  };

  return {
    activeStatus,
    searchText,
    dateRange,
    resetState,
  };
});
