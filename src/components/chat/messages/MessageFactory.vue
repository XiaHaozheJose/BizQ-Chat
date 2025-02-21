<template>
  <component
    :is="messageComponent"
    :message="message"
    :sender-avatar="senderAvatar"
    :is-shop="isShop"
    :sender-name="senderName"
    @quote="$emit('quote', $event)"
    @delete="$emit('delete', $event)"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Message } from "@/types";
import TextMessage from "./TextMessage.vue";
import ImageMessage from "./ImageMessage.vue";
import LocationMessage from "./LocationMessage.vue";
import ContactMessage from "./ContactMessage.vue";
import AudioMessage from "./AudioMessage.vue";
import OrderMessage from "./OrderMessage.vue";
import InitializePaymentMessage from "./InitializePaymentMessage.vue";
import ShipmentMessage from "./ShipmentMessage.vue";
import ProductMessage from "./ProductMessage.vue";
import BondMessage from "./BondMessage.vue";
import FileMessage from "./FileMessage.vue";

const props = defineProps<{
  message: Message;
  senderAvatar?: string;
  isShop?: boolean;
  senderName?: string;
}>();

defineEmits<{
  (e: "quote", message: Message): void;
  (e: "delete", message: Message): void;
}>();

// Map message types to components using string literals that match MessageType enum values
const messageComponents = {
  text: TextMessage,
  image: ImageMessage,
  location: LocationMessage,
  contact: ContactMessage,
  product: ProductMessage,
  order: OrderMessage,
  preOrder: OrderMessage,
  payment: TextMessage,
  card: TextMessage,
  system: TextMessage,
  pdf: FileMessage,
  initializePayment: InitializePaymentMessage,
  shipment: ShipmentMessage,
  return: ShipmentMessage,
  outOfStock: ShipmentMessage,
  coupon: BondMessage,
  voucher: BondMessage,
  audio: AudioMessage,
} as const;

type SupportedMessageType = keyof typeof messageComponents;

// Determine which component to use based on message type
const messageComponent = computed(() => {
  const type = props.message.type;
  if (type in messageComponents) {
    return messageComponents[type as SupportedMessageType];
  }
  console.warn(`Using fallback component for message type: ${type}`);
  return TextMessage; // Fallback to text message for unimplemented types
});
</script>
