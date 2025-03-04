<template>
  <div class="order-list" v-loading="loading">
    <!-- 订单列表 -->
    <template v-for="order in orders" :key="order.id">
      <order-item :order="order">
        <template #actions>
          <el-button
            v-if="order.status === OrderStatus.UNCONFIRMED"
            type="primary"
            size="small"
            link
            @click="$emit('action', 'confirm', order)"
          >
            {{ t("order.confirm") }}
          </el-button>
          <el-button
            v-if="order.status === OrderStatus.UNCONFIRMED"
            type="primary"
            size="small"
            link
            @click="handleEditClick(order)"
          >
            {{ t("common.edit") }}
          </el-button>
          <el-button
            v-if="[OrderStatus.UNCONFIRMED].includes(order.status)"
            type="danger"
            size="small"
            link
            @click="$emit('action', 'cancel', order)"
          >
            {{ t("order.cancel") }}
          </el-button>
          <el-button
            type="primary"
            size="small"
            link
            @click="$emit('action', 'detail', order)"
          >
            {{ t("order.detail") }}
          </el-button>
        </template>
      </order-item>
    </template>

    <!-- 加载更多 -->
    <div v-if="hasMore && !loading" class="load-more">
      <el-button @click="$emit('load-more')">{{
        t("common.loadMore")
      }}</el-button>
    </div>

    <!-- 空数据提示 -->
    <div v-if="orders.length === 0 && !loading" class="empty-data">
      {{ t("order.noData") }}
    </div>

    <order-edit-dialog
      v-model:visible="editDialogVisible"
      :order-details="currentOrder?.orderDetails || []"
      :order-id="currentOrder?.id || ''"
      :is-seller="true"
      :lock-status="currentOrder?.lockStatus || OrderLockStatus.Unlocked"
      @order-updated="handleOrderUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { Order, OrderLockStatus, OrderStatus } from "@/types/order";
import OrderItem from "./OrderItem.vue";
import OrderEditDialog from "./OrderEditDialog.vue";
import { useI18n } from "vue-i18n";
import { ref, watch } from "vue";

defineProps<{
  orders: Order[];
  loading: boolean;
  hasMore: boolean;
}>();

const emit = defineEmits<{
  (e: "load-more"): void;
  (e: "action", type: string, order: Order): void;
}>();

const { t } = useI18n();

const editDialogVisible = ref(false);
const currentOrder = ref<Order | null>(null);

const handleEditClick = (order: Order) => {
  currentOrder.value = order;
  editDialogVisible.value = true;
};

watch(editDialogVisible, (visible) => {
  if (!visible) {
    currentOrder.value = null;
  }
});

const handleOrderUpdated = () => {
  emit("action", "refresh", currentOrder.value!);
};
</script>

<style scoped lang="scss">
.order-list {
  width: 100%;

  .load-more {
    text-align: center;
    margin: 20px 0;
  }

  .empty-data {
    text-align: center;
    padding: 30px;
    color: #909399;
  }
}
</style>
