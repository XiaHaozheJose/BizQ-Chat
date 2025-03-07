<template>
  <div class="package-info">
    <a-form :model="packageInfo" layout="vertical">
      <a-form-item :label="$t('shipment.packageInfo.count')">
        <a-input-number v-model="packageInfo.count" :min="1" />
      </a-form-item>
      <a-form-item :label="$t('shipment.packageInfo.weight')">
        <a-input-number v-model="packageInfo.weight" :min="0" :step="0.1" />
      </a-form-item>
      <a-form-item :label="$t('shipment.packageInfo.height')">
        <a-input-number v-model="packageInfo.height" :min="0" />
      </a-form-item>
      <a-form-item :label="$t('shipment.packageInfo.width')">
        <a-input-number v-model="packageInfo.width" :min="0" />
      </a-form-item>
      <a-form-item :label="$t('shipment.packageInfo.length')">
        <a-input-number v-model="packageInfo.length" :min="0" />
      </a-form-item>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
  modelValue: {
    count: number;
    weight: number;
    height: number;
    width: number;
    length: number;
  };
}>();

const emit = defineEmits(['update:modelValue']);

const packageInfo = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});
</script>

<style scoped>
.package-info {
  margin-bottom: 16px;
}
</style>