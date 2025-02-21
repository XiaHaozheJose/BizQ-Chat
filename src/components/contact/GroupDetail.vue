<template>
  <div class="group-detail">
    <!-- Header -->
    <div class="detail-header">
      <span class="header-title">{{ group.name }}</span>
      <el-button type="primary" text @click="handleSave">
        {{ t("common.save") }}
      </el-button>
    </div>

    <!-- Group Info -->
    <div class="group-info">
      <!-- Avatar -->
      <div class="info-item">
        <div class="item-label">{{ t("common.avatar") }}</div>
        <div class="avatar-container">
          <el-avatar
            :size="60"
            :src="getImageUrl(group.image, 'small')"
            shape="square"
            @click="handleAvatarClick"
            :class="{ 'is-loading': uploading }"
          >
            <el-icon v-if="uploading"><Loading /></el-icon>
            <el-icon v-else><Folder /></el-icon>
          </el-avatar>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleFileChange"
          />
        </div>
      </div>

      <!-- Group Name -->
      <div class="info-item">
        <div class="item-label">{{ t("group.name") }}</div>
        <el-input
          v-model="formData.name"
          :placeholder="t('group.namePlaceholder')"
        />
      </div>

      <!-- Members -->
      <div class="info-item">
        <div class="members-header">
          <div class="item-label">{{ t("group.members") }}</div>
          <el-button type="primary" plain @click="handleAddMember">
            <el-icon><Plus /></el-icon>
            {{ t("group.addMember") }}
          </el-button>
        </div>

        <div class="members-list">
          <div
            v-for="contact in groupContacts"
            :key="contact.id"
            class="member-item"
          >
            <el-avatar
              :size="40"
              :src="
                getImageUrl(
                  contact.friend.headImg || contact.friend.logo,
                  'medium'
                )
              "
              :shape="contact.friendType === 'shop' ? 'square' : 'circle'"
            />
            <div class="member-info">
              <div class="member-name">{{ contact.friend.name }}</div>
              <div class="member-tags">
                {{ contact.groups.map((g) => g.name).join(", ") }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useContactStore } from "@/store/contact";
import { ElMessage } from "element-plus";
import { Folder, Plus, Loading } from "@element-plus/icons-vue";
import type { ContactGroup } from "@/types";
import { getImageUrl } from "@/utils";
import { uploadFiles } from "@/services/api/upload";

const props = defineProps<{
  group: ContactGroup;
}>();

const emit = defineEmits<{
  (e: "update"): void;
}>();

const { t } = useI18n();
const contactStore = useContactStore();

// Form data
const formData = ref({
  name: props.group.name,
  image: props.group.image,
});

// Get contacts in this group
const groupContacts = computed(() => {
  return contactStore.contacts.filter((contact) =>
    contact.groups.some((g) => g.id === props.group.id)
  );
});

// Add after other refs
const fileInput = ref<HTMLInputElement>();
const uploading = ref(false);

// Methods
const handleSave = async () => {
  try {
    await contactStore.updateGroup(props.group.id, {
      name: formData.value.name,
      image: formData.value.image,
    });
    ElMessage.success(t("group.updateSuccess"));
    emit("update");
  } catch (error) {
    console.error("Failed to update group:", error);
    ElMessage.error(t("group.updateError"));
  }
};

const handleAvatarClick = () => {
  fileInput.value?.click();
};

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  try {
    uploading.value = true;
    const files = Array.from(input.files);
    const urls = await uploadFiles(files);

    if (urls.length > 0) {
      formData.value.image = urls[0];
      await contactStore.updateGroup(props.group.id, {
        name: formData.value.name,
        image: urls[0],
      });
      ElMessage.success(t("group.updateSuccess"));
      emit("update");
    }
  } catch (error) {
    console.error("Failed to upload image:", error);
    ElMessage.error(t("group.uploadError"));
  } finally {
    uploading.value = false;
    // Reset input value to allow selecting the same file again
    if (fileInput.value) {
      fileInput.value.value = "";
    }
  }
};

const handleAddMember = () => {
  // TODO: Implement add member functionality
  console.log("Add member clicked");
};
</script>

<style lang="scss" scoped>
.group-detail {
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

  .group-info {
    flex: 1;
    padding: 20px;
    overflow-y: auto;

    .info-item {
      margin-bottom: 24px;

      .item-label {
        font-size: 14px;
        color: var(--el-text-color-regular);
        margin-bottom: 12px;
      }

      .avatar-container {
        display: flex;
        justify-content: center;
        margin: 20px 0;

        .el-avatar {
          cursor: pointer;
          border: 0.2px solid var(--el-border-color-light);

          &:hover {
            border-color: var(--el-color-primary);
          }

          &.is-loading {
            opacity: 0.7;
            cursor: not-allowed;
          }
        }
      }
    }

    .members-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .members-list {
      .member-item {
        display: flex;
        align-items: center;
        padding: 12px;
        border-bottom: 1px solid var(--el-border-color-lighter);

        .el-avatar {
          margin-right: 12px;
        }

        .member-info {
          flex: 1;

          .member-name {
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 4px;
          }

          .member-tags {
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }
      }
    }
  }
}
</style>
