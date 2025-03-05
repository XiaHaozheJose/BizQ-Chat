<template>
  <div v-if="shipmentsDetails?.length" class="shipment-info">
    <div
      v-for="(shipmentsByType, type) in groupedShipments"
      :key="type"
      class="shipment-type"
    >
      <el-tag
        size="small"
        :type="
          getShipmentTagType(String(type) as unknown as ShipmentDetailType)
        "
      >
        {{ t(`order.shipmentType.${type}`) }}
      </el-tag>
      <div
        v-for="(shipments, status) in shipmentsByType"
        :key="status"
        class="shipment-status"
      >
        <span class="status-text">{{
          t(`order.shipmentStatus.${status}`)
        }}</span>
        <span class="shipment-count">{{
          calculateShipmentCount(shipments)
        }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { ShipmentDetailType } from "@/types/shipments";

const { t } = useI18n();

const props = defineProps<{
  shipmentsDetails: any[];
  orderDetailId?: string;
}>();

const groupedShipments = computed(() => {
  return props.shipmentsDetails.reduce<
    Record<ShipmentDetailType, Record<string, any[]>>
  >(
    (acc, shipment) => {
      const type = (shipment.type ||
        ShipmentDetailType.Shipment) as ShipmentDetailType;
      const status = shipment.status || "pending";

      if (!acc[type]) {
        acc[type] = {};
      }
      if (!acc[type][status]) {
        acc[type][status] = [];
      }
      acc[type][status].push(shipment);
      return acc;
    },
    {} as Record<ShipmentDetailType, Record<string, any[]>>
  );
});

const getShipmentTagType = (
  type: ShipmentDetailType
): "success" | "danger" | "warning" | "info" => {
  const typeMap: Record<
    ShipmentDetailType,
    "success" | "danger" | "warning" | "info"
  > = {
    [ShipmentDetailType.Shipment]: "success",
    [ShipmentDetailType.OutOfStock]: "danger",
    [ShipmentDetailType.Return]: "warning",
  };
  return typeMap[type] || "info";
};

const calculateShipmentCount = (shipments: any[]) => {
  if (!props.orderDetailId) {
    return shipments.reduce((total, shipment) => {
      return total + (shipment.quantity || 0);
    }, 0);
  }

  return shipments.reduce((total, shipment) => {
    return (
      total +
      shipment.skus.reduce((skuTotal: number, shipmentSku: any) => {
        if (shipmentSku.orderDetailId === props.orderDetailId) {
          return skuTotal + (shipmentSku.quantity || 0);
        }
        return skuTotal;
      }, 0)
    );
  }, 0);
};
</script>

<style lang="scss" scoped>
.shipment-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.shipment-type {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.shipment-status {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--el-text-color-secondary);

  .status-text {
    font-size: 12px;
  }

  .shipment-count {
    background-color: var(--el-fill-color-darker);
    color: white;
    border-radius: 10px;
    padding: 0 4px;
    font-size: 11px;
    min-width: 16px;
    text-align: center;
  }
}
</style>
