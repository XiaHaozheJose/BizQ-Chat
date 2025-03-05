<template>
  <div class="order-view">
    <!-- 头部区域 -->
    <div class="header-container">
      <!-- 搜索区域 - 直接使用draggable-container，不要外层包装 -->
      <draggable-container with-border height="64px">
        <el-input
          v-model="searchText"
          :placeholder="t('common.search')"
          :prefix-icon="Search"
          clearable
          class="no-drag"
        />
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="-"
          :start-placeholder="t('common.startDate')"
          :end-placeholder="t('common.endDate')"
          class="date-picker no-drag"
        />
        <el-button
          type="primary"
          @click="handleSearch"
          class="no-drag search-btn"
        >
          搜索
        </el-button>
      </draggable-container>

      <!-- 标签页 -->
      <el-tabs
        v-model="activeStatus"
        @tab-click="handleTabChange"
        class="order-tabs"
      >
        <el-tab-pane
          v-for="tab in orderTabs"
          :key="tab.name"
          :label="tab.label"
          :name="tab.name"
        />
      </el-tabs>
    </div>

    <!-- 内容区域 -->
    <div class="content-container">
      <order-list
        :orders="orders"
        :loading="loading"
        :has-more="hasMore"
        @load-more="loadMore"
        @action="handleOrderAction"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, defineProps, computed } from "vue";
import OrderList from "@/components/order/OrderList.vue";
import { useOrderStore } from "@/store/order";
import { useUserStore } from "@/store/user";
import { storeToRefs } from "pinia";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRouter } from "vue-router";
import { Order, OrderStatusLabel } from "@/types/order";
import DraggableContainer from "@/components/base/DraggableContainer.vue";
import { useI18n } from "vue-i18n";
import { Search } from "@element-plus/icons-vue";
import { FetchOrderParams } from "@/services/api/order";

// 定义组件属性
const props = defineProps({
  // orderType：'my' 表示我的订单，'customer' 表示客户订单
  orderType: {
    type: String,
    default: "my",
    validator: (value: string) => ["my", "customer"].includes(value),
  },
});

const { t } = useI18n();
const orderStore = useOrderStore();
const userStore = useUserStore();
const { orders, loading, hasMore } = storeToRefs(orderStore);

const router = useRouter();
const orderTabs = computed(() => [
  { label: t("order.all"), name: OrderStatusLabel.ALL },
  { label: t("order.unconfirmed"), name: OrderStatusLabel.UNCONFIRMED },
  { label: t("order.confirmed"), name: OrderStatusLabel.CONFIRMED },
  { label: t("order.processing"), name: OrderStatusLabel.PENDING },
  { label: t("order.received"), name: OrderStatusLabel.DONE },
  { label: t("order.canceled"), name: OrderStatusLabel.CANCELED },
]);

// 搜索条件
const searchText = ref("");
const dateRange = ref([]);
const activeStatus = ref(OrderStatusLabel.ALL);

// 处理标签页切换
const handleTabChange = () => {
  loadOrders(true);
};

// 处理搜索
const handleSearch = () => {
  loadOrders(true);
};

// 加载更多
const loadMore = () => {
  loadOrders(false);
};

// 加载订单
const loadOrders = (refresh: boolean = false) => {
  // 构建查询参数
  const params: FetchOrderParams = {};

  // 根据订单类型添加不同的参数
  if (props.orderType === "my") {
    // 我的订单 - 添加买家ID
    params.buyerId = userStore.currentUser?.id;
  } else if (props.orderType === "customer") {
    // 客户订单 - 添加商店ID
    params.shopId = userStore.currentUser?.id;
  }

  // 设置状态查询条件
  if (activeStatus.value !== "all") {
    params.status = [activeStatus.value];
  }

  // 设置搜索条件
  if (searchText.value) {
    params.search = searchText.value;
  }

  // 设置日期范围
  if (dateRange.value && dateRange.value.length === 2) {
    params.startDate = dateRange.value[0];
    params.endDate = dateRange.value[1];
  }

  // 加载订单
  orderStore.loadOrders(params, refresh);
};

// 首次加载
onMounted(() => {
  loadOrders(true);
});

// 处理订单操作
const handleOrderAction = (actionType: string, order: Order) => {
  switch (actionType) {
    case "detail":
      router.push(`/order/${props.orderType}/detail/${order.id}`);
      break;
    case "cancel":
      ElMessageBox.confirm(
        t("dialog.confirm.deleteOrder.message"),
        t("dialog.warningTitle"),
        {
          confirmButtonText: t("common.confirm"),
          cancelButtonText: t("common.cancel"),
          type: "warning",
        }
      )
        .then(() => {
          orderStore.cancelOrderHandler(order.id).then(() => {
            ElMessage.success(t("dialog.confirm.deleteOrder.success"));
            loadOrders(true);
          });
        })
        .catch(() => {});
      break;
    case "confirm":
      ElMessageBox.confirm(
        t("dialog.confirm.confirmOrder.message"),
        t("dialog.tipTitle"),
        {
          confirmButtonText: t("common.confirm"),
          cancelButtonText: t("common.cancel"),
          type: "info",
        }
      )
        .then(() => {
          // 调用确认订单API
          orderStore.confirmOrderHandler(order.id).then(() => {
            ElMessage.success(t("dialog.confirm.confirmOrder.success"));
            loadOrders(true);
          });
        })
        .catch(() => {});
      break;
    case "edit":
      //TODO: 编辑订单
      break;
    default:
      break;
  }
};
</script>

<style lang="scss" scoped>
.order-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);

  .header-container {
    border-bottom: 1px solid var(--el-border-color-light);
    padding: 0 20px;
    :deep(.draggable-container) {
      display: flex;
      align-items: center;
      padding: 0 20px;
      border-bottom: none;

      .el-input {
        flex: 1;
        margin-right: 16px;
        max-width: 300px;
      }

      .date-picker {
        width: 350px;
        margin-right: 16px;
      }

      .search-btn {
        min-width: 80px;
      }
    }

    .order-tabs {
      :deep(.el-tabs__header) {
        margin: 0;
      }

      :deep(.el-tabs__content) {
        padding: 0 !important;
      }

      :deep(.el-tabs__nav-wrap) {
        &::after {
          display: none;
        }
      }

      :deep(.el-tabs__nav) {
        border: none;
      }
    }
  }

  .content-container {
    flex: 1;
    overflow: auto;
    padding: 20px;
  }
}
</style>
