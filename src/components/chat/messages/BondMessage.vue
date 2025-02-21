<template>
  <message-base
    :message="message"
    :sender-avatar="senderAvatar"
    :is-shop="isShop"
    :sender-name="senderName"
  >
    <div class="bond-message" :class="bondInfo.type" @click="handleClick">
      <!-- 左侧内容区域 -->
      <div class="bond-content">
        <div class="shop-name">{{ bondInfo.shop?.name }}</div>
        <div class="remark">{{ bondInfo.remark }}</div>
        <div class="expire-time">
          {{ t("order.expireTime") }}: {{ expireTime }}
        </div>
      </div>

      <!-- 右侧金额/折扣区域 -->
      <div class="value-info" :class="{ expired: isExpired }">
        <div class="value-unit-wrapper">
          <span class="value">{{ displayValue }}</span>
          <span class="unit">{{ displayUnit }}</span>
        </div>
        <div class="bond-number">
          <span class="bond-number-text">No. {{ bondInfo.number }}</span>
        </div>
      </div>
    </div>
  </message-base>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { Message } from "@/types";
import type { BondDetail } from "@/types/bond";
import MessageBase from "./MessageBase.vue";
import { formatISODate } from "@/utils/date";

const props = defineProps<{
  message: Message;
  senderAvatar?: string;
  isShop?: boolean;
  senderName?: string;
}>();

const { t } = useI18n();

// 解析券信息
const bondInfo = computed<BondDetail>(() => {
  try {
    return JSON.parse(props.message.content);
  } catch (error) {
    console.error("Failed to parse bond message content:", error);
    return {} as BondDetail;
  }
});

// 判断是否过期
const isExpired = computed(() => {
  if (!bondInfo.value.useExpiredDate) return false;
  return new Date(bondInfo.value.useExpiredDate) < new Date();
});

// 计算显示的值
const displayValue = computed(() => {
  if (bondInfo.value.discountValue) {
    return bondInfo.value.discountValue.toString();
  }
  if (bondInfo.value.deductionValue) {
    return bondInfo.value.deductionValue.toString();
  }
  return "";
});

// 计算单位
const displayUnit = computed(() => {
  return bondInfo.value.discountValue ? "%" : "€";
});

// 格式化过期时间
const expireTime = computed(() => {
  return formatISODate(bondInfo.value.useExpiredDate);
});

// 处理点击事件
const handleClick = () => {
  // TODO: 实现点击查看详情
  console.log("View bond details:", bondInfo.value.id);
};
</script>

<style lang="scss" scoped>
.bond-message {
  min-width: 300px;
  max-width: 320px;
  height: 120px;
  background: #fff;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  display: flex;

  .bond-content {
    flex: 1;
    min-width: 180px;
    padding: 8px;
    background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
    .shop-name {
      font-size: 16px;
      font-weight: 500;
      color: #fff;
      margin-bottom: 4px;
    }

    .remark {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
    }

    //展示在最底部
    .expire-time {
      position: absolute;
      bottom: 12px;
      left: 12px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .value-info {
    width: 100px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    background: url("@/assets/images/vourcher_bg_icon.png") no-repeat center;
    background-size: 100% 100%;
    padding: 20px 12px;

    &.expired {
      background-image: url("@/assets/images/vourcher_gray_icon.png");
    }

    .value-unit-wrapper {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      gap: 2px;

      .value {
        font-size: 32px;
        font-weight: 600;
        color: #fff;
        line-height: 1;
      }

      .unit {
        font-size: 14px;
        color: #fff;
        margin-top: 4px;
      }
    }

    .bond-number {
      background: #fff;
      padding: 4px 8px;
      border-radius: 4px;

      .bond-number-text {
        font-size: 10px;
        color: #333;
      }
    }
  }

  &.voucher {
    .bond-content {
      background: linear-gradient(135deg, #ff9f43 0%, #ffbe76 100%);
    }
  }
}
</style>
