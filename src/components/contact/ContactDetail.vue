<template>
  <div class="contact-detail">
    <!-- Header with back button -->
    <div class="detail-header">
      <el-button @click="$router.back()" link> </el-button>
      <span class="header-title">{{ t("contact.detail") }}</span>
      <el-button @click="handleSave" type="primary" link>
        {{ t("common.save") }}
      </el-button>
    </div>

    <!-- Contact basic info -->
    <div class="contact-info">
      <el-avatar
        :size="60"
        :shape="contact.friendType === UserType.Shop ? 'square' : 'circle'"
        :src="
          getImageUrl(
            contact.friend.headImg ?? contact.friend.logo ?? '',
            'medium'
          )
        "
      />
      <div class="info-text">
        <div class="name">{{ contact.friend.name }}</div>
        <div class="subtitle">{{ contact.remark || contact.friend.name }}</div>
      </div>
    </div>

    <!-- Contact details -->
    <div class="detail-section">
      <!-- Alias -->
      <div class="detail-item">
        <div class="item-label">{{ t("contact.alias") }}</div>
        <el-input
          v-model="formData.remark"
          :placeholder="t('contact.aliasPlaceholder')"
        />
      </div>

      <!-- Description -->
      <div class="detail-item">
        <div class="item-label">{{ t("contact.description") }}</div>
        <el-input
          v-model="formData.note"
          type="textarea"
          :placeholder="t('contact.descriptionPlaceholder')"
          :rows="3"
        />
      </div>

      <!-- Groups -->
      <div class="detail-item">
        <div class="item-label">{{ t("common.groups") }}</div>
        <div class="groups-list">
          <el-checkbox
            v-for="group in groups"
            :key="group.id"
            v-model="selectedGroups[group.id]"
            :label="group.name"
          />
        </div>
      </div>
    </div>

    <!-- 底部功能按钮 -->
    <div class="detail-footer">
      <div class="detail-footer-item">
        <el-button type="primary" text class="action-button">
          <div class="button-content">
            <el-icon class="action-icon"><ChatDotRound /></el-icon>
            <span class="action-text">{{ t("common.chat") }}</span>
          </div>
        </el-button>
      </div>

      <div class="detail-footer-item">
        <el-button type="primary" text class="action-button">
          <div class="button-content">
            <el-icon class="action-icon"><Phone /></el-icon>
            <span class="action-text">{{ t("common.voice") }}</span>
          </div>
        </el-button>
      </div>

      <div class="detail-footer-item">
        <el-button type="primary" text class="action-button">
          <div class="button-content">
            <el-icon class="action-icon"><VideoCamera /></el-icon>
            <span class="action-text">{{ t("common.video") }}</span>
          </div>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useContactStore } from "@/store/contact";
import { ElMessage } from "element-plus";
import type { Contact } from "@/types";
import { UserType } from "@/types";
import { getImageUrl } from "@/utils";
import { ChatDotRound, Phone, VideoCamera } from "@element-plus/icons-vue";
const props = defineProps<{
  contact: Contact;
}>();

const emit = defineEmits<{
  (e: "update"): void;
}>();

const { t } = useI18n();
const contactStore = useContactStore();

// Form data
const formData = ref({
  remark: props.contact.remark || "",
  note: props.contact.note || "",
});

// Groups handling
const groups = computed(() => contactStore.groups);
const selectedGroups = ref<Record<string, boolean>>({});

// Initialize form data and selected groups
const initializeData = () => {
  formData.value = {
    remark: props.contact.remark || "",
    note: props.contact.note || "",
  };

  // Reset and initialize selected groups
  selectedGroups.value = {};
  props.contact.groups.forEach((group) => {
    selectedGroups.value[group.id] = true;
  });
};

// Watch for contact changes
watch(
  () => props.contact,
  () => {
    initializeData();
  },
  { deep: true }
);

// Initialize on mount
onMounted(() => {
  initializeData();
});

// Save changes
const handleSave = async () => {
  try {
    const selectedGroupIds = Object.entries(selectedGroups.value)
      .filter(([, selected]) => selected)
      .map(([id]) => id);

    await contactStore.updateContact(props.contact.id, {
      remark: formData.value.remark,
      note: formData.value.note,
      groupIds: selectedGroupIds,
    });

    ElMessage.success(t("contact.updateSuccess"));
    emit("update");
  } catch (error) {
    console.error("Failed to update contact:", error);
    ElMessage.error(t("contact.updateError"));
  }
};
</script>

<style lang="scss" scoped>
.contact-detail {
  height: 100%;
  background-color: var(--el-bg-color);
  display: flex;
  flex-direction: column;

  .detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-light);

    .header-title {
      font-size: 16px;
      font-weight: 500;
    }
  }

  .contact-info {
    display: flex;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid var(--el-border-color-light);
    background-color: var(--el-color-primary-light-9);

    .el-avatar {
      margin-right: 16px;
      border: 1px solid var(--el-border-color-lighter);
    }

    .info-text {
      .name {
        font-size: 18px;
        font-weight: 500;
        margin-bottom: 4px;
      }

      .subtitle {
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .detail-section {
    flex: 1;
    padding: 16px;
    overflow-y: auto;

    .detail-item {
      margin-bottom: 24px;

      .item-label {
        font-size: 14px;
        color: var(--el-text-color-regular);
        margin-bottom: 8px;
      }

      .groups-list {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .el-checkbox {
          margin-right: 0;
        }
      }
    }
  }

  .detail-footer {
    display: flex;
    justify-content: space-around;
    padding: 16px;
    border-top: 1px solid var(--el-border-color-light);

    .detail-footer-item {
      flex: 1;
      display: flex;
      justify-content: center;

      .action-button {
        height: auto;
        padding: 8px 0;
        width: 100%;

        .button-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .action-icon {
          font-size: 24px;
        }

        .action-text {
          font-size: 12px;
          color: var(--el-text-color-regular);
        }

        &:hover {
          .action-text {
            color: var(--el-color-primary);
          }
        }
      }
    }
  }
}
</style>
