<template>
  <div class="contact-page">
    <div class="contact-list-container">
      <contact-list @select="handleContactSelect" />
    </div>
    <div v-if="selectedContact" class="contact-detail-container">
      <contact-detail
        :contact="selectedContact"
        @update="handleContactUpdate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ContactList from "@/components/contact/ContactList.vue";
import ContactDetail from "@/components/contact/ContactDetail.vue";
import type { Contact } from "@/types";

const selectedContact = ref<Contact | null>(null);

const handleContactSelect = (contact: Contact) => {
  selectedContact.value = contact;
};

const handleContactUpdate = () => {
  // Refresh the contact list if needed
};
</script>

<style lang="scss" scoped>
.contact-page {
  height: 100%;
  display: flex;
  background-color: var(--el-bg-color);

  .contact-list-container {
    width: 300px;
    border-right: 1px solid var(--el-border-color-light);
    overflow-y: auto;
  }

  .contact-detail-container {
    flex: 1;
    overflow-y: auto;
  }
}
</style>
