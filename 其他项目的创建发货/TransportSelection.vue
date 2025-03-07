<template>
  <div class="transport-selection">
    <a-radio-group v-model="selectedTransport" @change="handleTransportChange">
      <a-radio
        v-for="transport in enabledTransports"
        :key="transport.id"
        :value="transport.id"
      >
        {{ transport.name }}
      </a-radio>
      <a-radio v-if="customerHandle" value="customerHandle">
        {{ $t('shipment.customerHandle') }}
      </a-radio>
    </a-radio-group>
  </div>
</template>

<script lang="ts" setup>
  import { ref, watch, computed } from 'vue';
  import { Transport } from '@/types/transport';

  const props = defineProps<{
    transports: Transport[];
    customerHandle: boolean;
  }>();

  const emit = defineEmits(['transport-selected']);

  const selectedTransport = ref<string>('');

  const enabledTransports = computed(() => {
    return props.transports.filter((transport) => transport.enabled);
  });

  const handleTransportChange = () => {
    emit('transport-selected', selectedTransport.value);
  };

  watch(
    () => props.transports,
    () => {
      if (props.customerHandle) {
        selectedTransport.value = 'customerHandle';
        emit('transport-selected', selectedTransport.value);
      } else {
        const firstEnabledTransport = enabledTransports.value[0];
        selectedTransport.value = firstEnabledTransport
          ? firstEnabledTransport.id
          : '';
      }
    },
    { immediate: true }
  );

  watch(
    () => props.customerHandle,
    (newValue) => {
      if (newValue && selectedTransport.value !== 'customerHandle') {
        selectedTransport.value = 'customerHandle';
        handleTransportChange();
      }
    }
  );
</script>

<style scoped>
  .transport-selection {
    margin-bottom: 16px;
  }
</style>
