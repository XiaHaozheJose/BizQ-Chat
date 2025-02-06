<template>
  <div class="contact-page">
    <contact-list />
  </div>
</template>

<script setup lang="ts">
import ContactList from '@/components/contact/ContactList.vue'
</script>

<style lang="scss" scoped>
.contact-page {
  height: 100%;
  background-color: var(--bg-base);
}
</style> 