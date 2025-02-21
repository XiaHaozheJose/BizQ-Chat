<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="400px"
    :show-close="false"
    class="file-preview-dialog"
  >
    <div class="recipient-info" v-if="recipient">
      <div class="user-info">
        <el-avatar
          :size="32"
          :shape="recipient.isShop ? 'square' : 'circle'"
          :src="getImageUrl(recipient.avatar, 'small', recipient.isShop)"
        />
        <span class="name">{{ recipient.name }}</span>
      </div>
    </div>

    <div class="file-list">
      <div v-for="(file, index) in files" :key="index" class="file-item">
        <div class="file-icon">
          <el-icon>
            <component :is="file.type === 'pdf' ? Document : Picture" />
          </el-icon>
        </div>
        <div class="file-info">
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">{{ formatFileSize(file.size) }}</span>
        </div>
        <el-button class="delete-button" link @click="handleDelete(index)">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">{{ t("common.cancel") }}</el-button>
        <el-button type="primary" @click="handleConfirm">
          {{ confirmButtonText }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Document, Picture, Close } from "@element-plus/icons-vue";
import { formatFileSize } from "@/utils/format";
import { getImageUrl } from "@/utils";
import type { ConversationUser } from "@/types";

interface FileInfo {
  name: string;
  size: number;
  type: string;
  file: File;
}

const props = defineProps<{
  modelValue: boolean;
  files: FileInfo[];
  title?: string;
  confirmButtonText?: string;
  recipient?: ConversationUser;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "delete", index: number): void;
  (e: "cancel"): void;
  (e: "confirm"): void;
}>();

const { t } = useI18n();

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const handleDelete = (index: number) => {
  emit("delete", index);
};

const handleCancel = () => {
  emit("cancel");
};

const handleConfirm = () => {
  emit("confirm");
};
</script>

<style lang="scss" scoped>
.file-preview-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
  }

  .file-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .file-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid var(--el-border-color-light);

    &:last-child {
      border-bottom: none;
    }

    .file-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--el-fill-color-light);
      border-radius: 4px;
      margin-right: 12px;

      .el-icon {
        font-size: 24px;
        color: var(--el-text-color-regular);
      }
    }

    .file-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .file-name {
        font-size: 14px;
        color: var(--el-text-color-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .file-size {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    .delete-button {
      margin-left: 8px;
    }
  }

  .dialog-footer {
    padding: 12px 20px;
    text-align: right;
  }

  .recipient-info {
    padding: 10px 10px;
    border-bottom: 1px solid var(--el-border-color-light);
    display: flex;
    align-items: center;
    gap: 12px;

    .label {
      color: var(--el-text-color-regular);
      font-size: 14px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .name {
        font-size: 14px;
        color: var(--el-text-color-primary);
      }
    }
  }
}
</style>
