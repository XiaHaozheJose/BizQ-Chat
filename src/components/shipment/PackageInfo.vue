<template>
  <div class="package-info">
    <el-form :model="localPackageInfo" label-position="top">
      <el-form-item :label="t('shipment.packageInfo.count')" required>
        <el-input-number
          v-model="localPackageInfo.count"
          :min="1"
          :max="100"
          :controls="false"
          @blur="handleChange"
        />
      </el-form-item>
      <el-form-item :label="t('shipment.packageInfo.length')" required>
        <div class="input-with-unit">
          <el-input-number
            v-model="localPackageInfo.length"
            :min="0"
            :precision="2"
            :step="0.01"
            :controls="false"
            @blur="handleChange"
          />
          <span class="unit">cm</span>
        </div>
      </el-form-item>
      <el-form-item :label="t('shipment.packageInfo.width')" required>
        <div class="input-with-unit">
          <el-input-number
            v-model="localPackageInfo.width"
            :min="0"
            :precision="2"
            :step="0.01"
            :controls="false"
            @blur="handleChange"
          />
          <span class="unit">cm</span>
        </div>
      </el-form-item>
      <el-form-item :label="t('shipment.packageInfo.height')" required>
        <div class="input-with-unit">
          <el-input-number
            v-model="localPackageInfo.height"
            :min="0"
            :precision="2"
            :step="0.01"
            :controls="false"
            @blur="handleChange"
          />
          <span class="unit">cm</span>
        </div>
      </el-form-item>
      <el-form-item :label="t('shipment.packageInfo.weight')" required>
        <div class="input-with-unit">
          <el-input-number
            v-model="localPackageInfo.weight"
            :min="0"
            :precision="2"
            :step="0.01"
            :controls="false"
            @blur="handleChange"
          />
          <span class="unit">kg</span>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { ShipmentPackageInfo } from "@/types/shipments";

const props = defineProps<{
  modelValue: ShipmentPackageInfo;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: ShipmentPackageInfo): void;
  (e: "change", value: ShipmentPackageInfo): void;
}>();

const { t } = useI18n();

// 本地包裹信息，用于表单绑定
const localPackageInfo = ref<ShipmentPackageInfo>({
  length: props.modelValue.length,
  width: props.modelValue.width,
  height: props.modelValue.height,
  weight: props.modelValue.weight,
  count: props.modelValue.count || 1,
});

// 当数据变化时，触发更新
const handleChange = () => {
  emit("update:modelValue", { ...localPackageInfo.value });
  emit("change", { ...localPackageInfo.value });
};

// 监听 props 的变化，更新本地数据
watch(
  () => props.modelValue,
  (newValue) => {
    localPackageInfo.value = { ...newValue };
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
.package-info {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.input-with-unit {
  display: flex;
  align-items: center;

  .unit {
    margin-left: 8px;
    color: var(--el-text-color-secondary);
  }

  .el-input-number {
    width: 100%;
  }
}
</style>
