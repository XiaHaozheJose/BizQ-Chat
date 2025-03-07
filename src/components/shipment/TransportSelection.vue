<template>
  <div class="transport-selection">
    <div v-loading="loading" class="transport-list">
      <div v-if="transports.length === 0 && !loading" class="empty-state">
        {{ t("shipment.noTransports") }}
      </div>

      <el-card
        v-for="transport in transports"
        :key="transport.id"
        class="transport-card"
        :class="{ selected: selectedTransportId === transport.id }"
        @click="selectTransport(transport)"
      >
        <div class="transport-content">
          <div class="transport-avatar">
            <el-avatar :src="getNormalImageUrl(transport.logo)" :size="50">
              <el-icon><Van /></el-icon>
            </el-avatar>
          </div>
          <div class="transport-info">
            <div class="transport-name">{{ transport.name }}</div>
            <div v-if="transport.phone" class="transport-detail">
              {{ t("user.phone") }}: {{ transport.phone }}
            </div>
            <div
              v-if="getTransportLimitations(transport)"
              class="transport-detail"
            >
              {{ getTransportLimitations(transport) }}
            </div>
          </div>
          <div
            class="transport-selected"
            v-if="selectedTransportId === transport.id"
          >
            <el-icon class="selected-icon"><Check /></el-icon>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { Van, Check } from "@element-plus/icons-vue";
import { getTransports } from "@/services/api/transport";
import type { Transport } from "@/types/transport";
import { TransportType, TransferContractsType } from "@/types/transport";
import { getNormalImageUrl } from "@/utils";

const { t } = useI18n();

// 客户负责运输的transport对象
const CUSTOMER_HANDLE_TRANSPORT: Transport = {
  id: "customer-handle",
  _id: "customer-handle",
  name: t("shipment.customerHandle"),
  enabled: true,
  isCustomerHandle: true,
  transferType: TransportType.Custom,
  contractsType: TransferContractsType.SEUR, // 随便给一个，因为客户负责运输不会用到
  contractsInfo: {}, // 空对象，因为客户负责运输不需要合同信息
  phone: "",
  trackingUrl: "",
  officeLocationUrl: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  pickupAtHome: {
    enabled: false,
    fee: 0,
  },
};

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "select", transport: Transport): void;
}>();

const loading = ref(false);
const transports = ref<Transport[]>([]);
const selectedTransportId = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// 加载运输方式列表
const loadTransports = async () => {
  loading.value = true;
  try {
    const response = await getTransports();
    // 添加客户负责运输选项
    transports.value = [
      ...response.transfers.filter((t) => t.enabled),
      CUSTOMER_HANDLE_TRANSPORT,
    ];
  } catch (error) {
    ElMessage.error(t("shipment.failedToLoadTransports"));
    console.error("Failed to load transports:", error);
  } finally {
    loading.value = false;
  }
};

// 选择运输方式
const selectTransport = (transport: Transport) => {
  selectedTransportId.value = transport.id;
  emit("select", transport);
};

// 获取运输限制说明
const getTransportLimitations = (transport: Transport): string => {
  if (!transport.packageLimitation) return "";

  const limitations = [];
  const { weight, length, width, height } = transport.packageLimitation;

  if (weight)
    limitations.push(`${t("shipment.packageInfo.maxWeight")}: ${weight}kg`);
  if (length)
    limitations.push(`${t("shipment.packageInfo.maxLength")}: ${length}cm`);
  if (width)
    limitations.push(`${t("shipment.packageInfo.maxWidth")}: ${width}cm`);
  if (height)
    limitations.push(`${t("shipment.packageInfo.maxHeight")}: ${height}cm`);

  return limitations.join(", ");
};

// 加载数据
onMounted(() => {
  loadTransports();
});
</script>

<style lang="scss" scoped>
.transport-selection {
  padding: 10px 0;
}

.transport-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 300px;
}

.transport-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    box-shadow: var(--el-box-shadow-light);
  }

  &.selected {
    border-color: var(--el-color-primary);
  }
}

.transport-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.transport-info {
  flex: 1;
}

.transport-name {
  font-weight: 500;
  font-size: 16px;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.transport-detail {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.transport-selected {
  color: var(--el-color-primary);
}

.selected-icon {
  font-size: 20px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--el-text-color-secondary);
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
}
</style>
