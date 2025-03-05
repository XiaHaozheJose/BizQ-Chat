<template>
  <div class="address-section">
    <div class="address-box">
      <h2>{{ t("order.shippingAddress") }}</h2>
      <template v-if="shippingAddress">
        <div class="address-content">
          <p class="name">{{ shippingAddress.recvName }}</p>
          <p class="phone">{{ shippingAddress.phone }}</p>
          <p class="address">
            {{ shippingAddress.street }}, {{ shippingAddress.city }},
            {{ shippingAddress.province?.name }},
            {{ shippingAddress.country?.name }}, {{ shippingAddress.zipcode }}
          </p>
        </div>
      </template>
    </div>
    <div class="address-box">
      <h2>{{ t("order.invoiceAddress") }}</h2>
      <template v-if="invoiceAddress">
        <div class="address-content">
          <p v-if="invoiceAddress.companyName" class="company">
            {{ invoiceAddress.companyName }}
          </p>
          <p v-if="invoiceAddress.NIF" class="nif">
            NIF: {{ invoiceAddress.NIF }}
          </p>
          <p class="phone">{{ invoiceAddress.phone }}</p>
          <p class="address">
            {{ invoiceAddress.street }}, {{ invoiceAddress.city }},
            {{ invoiceAddress.province?.name }},
            {{ invoiceAddress.country?.name }}, {{ invoiceAddress.zipcode }}
          </p>
        </div>
      </template>
      <p v-else class="no-invoice">{{ t("order.noInvoiceAddress") }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Address } from "@/types/address";

const { t } = useI18n();

defineProps<{
  shippingAddress: Address | null | undefined;
  invoiceAddress: Address | null | undefined;
}>();
</script>

<style lang="scss" scoped>
.address-section {
  display: flex;
  gap: 12px;

  .address-box {
    flex: 1;
    background-color: #fff;
    border-radius: 4px;
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: var(--el-box-shadow-light);
    padding: 16px;

    h2 {
      margin: 0 0 16px;
      font-size: 16px;
      color: var(--el-text-color-primary);
      font-weight: 600;
    }

    .address-content {
      p {
        margin: 0 0 8px;
        color: var(--el-text-color-regular);
        line-height: 1.5;

        &:last-child {
          margin-bottom: 0;
        }

        &.name,
        &.company {
          font-weight: bold;
          font-size: 16px;
        }

        &.nif,
        &.phone {
          color: var(--el-text-color-secondary);
        }

        &.address {
          margin-top: 8px;
        }
      }
    }

    .no-invoice {
      color: var(--el-text-color-secondary);
      font-style: italic;
    }
  }
}
</style>
