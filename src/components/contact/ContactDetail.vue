<template>
  <el-drawer
    v-model="visible"
    :title="isEditing ? '编辑联系人' : '联系人详情'"
    size="400px"
    :show-close="true"
    @close="handleClose"
  >
    <template v-if="contact">
      <div class="contact-detail">
        <!-- 基本信息 -->
        <div class="basic-info">
          <template v-if="isEditing">
            <el-upload
              class="avatar-uploader"
              :show-file-list="false"
              :before-upload="handleAvatarUpload"
            >
              <el-avatar
                v-if="contact.avatar"
                :src="contact.avatar"
                :size="80"
              />
              <el-icon v-else class="avatar-uploader-icon" :size="30">
                <Plus />
              </el-icon>
            </el-upload>
          </template>
          <template v-else>
            <el-avatar
              :src="contact.avatar"
              :size="80"
            >
              {{ contact.name[0] }}
            </el-avatar>
          </template>
          
          <div class="info">
            <template v-if="isEditing">
              <el-form
                ref="formRef"
                :model="editForm"
                :rules="formRules"
                label-width="80px"
              >
                <el-form-item label="备注" prop="remark">
                  <el-input v-model="editForm.remark" placeholder="请输入备注" />
                </el-form-item>
                
                <el-form-item label="分组" prop="groupIds">
                  <el-select
                    v-model="editForm.groupIds"
                    multiple
                    placeholder="请选择分组"
                  >
                    <el-option
                      v-for="group in contactStore.groups"
                      :key="group.id"
                      :label="group.name"
                      :value="group.id"
                    />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="备注信息" prop="note">
                  <el-input
                    v-model="editForm.note"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入备注信息"
                  />
                </el-form-item>
              </el-form>
            </template>
            <template v-else>
              <div class="name">{{ contact.name }}</div>
              <div class="email">{{ contact.email }}</div>
              <div v-if="contact.remark" class="remark">备注: {{ contact.remark }}</div>
              
              <div class="groups">
                <el-tag
                  v-for="groupId in contact.groups"
                  :key="groupId"
                  size="small"
                  type="info"
                >
                  {{ getGroupName(groupId) }}
                </el-tag>
              </div>
              
              <div v-if="contact.note" class="note">
                <div class="note-title">备注信息:</div>
                <div class="note-content">{{ contact.note }}</div>
              </div>
            </template>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="actions">
          <template v-if="isEditing">
            <el-button @click="handleCancel">取消</el-button>
            <el-button type="primary" @click="handleSave">保存</el-button>
          </template>
          <template v-else>
            <el-button type="primary" @click="handleChat">发起聊天</el-button>
            <el-button @click="handleEdit">编辑</el-button>
            <el-button type="danger" @click="handleDelete">删除</el-button>
          </template>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Contact } from '@/types'
import { useContactStore } from '@/store/contact'
import { useRouter } from 'vue-router'
import { StorageService } from '@/services/firebase/storage'

const props = defineProps<{
  modelValue: boolean
  contact?: Contact
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'deleted'): void
}>()

const router = useRouter()
const contactStore = useContactStore()
const storage = new StorageService()

// 状态
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
const isEditing = ref(false)
const formRef = ref()
const editForm = ref({
  remark: '',
  groupIds: [] as string[],
  note: '',
})

// 表单校验规则
const formRules = {
  remark: [
    { max: 50, message: '备注不能超过50个字符', trigger: 'blur' },
  ],
  note: [
    { max: 500, message: '备注信息不能超过500个字符', trigger: 'blur' },
  ],
}

// 方法
const handleClose = () => {
  isEditing.value = false
}

const handleEdit = () => {
  editForm.value = {
    remark: props.contact?.remark || '',
    groupIds: props.contact?.groups || [],
    note: props.contact?.note || '',
  }
  isEditing.value = true
}

const handleCancel = () => {
  isEditing.value = false
}

const handleSave = async () => {
  if (!formRef.value || !props.contact) return
  
  try {
    await formRef.value.validate()
    await contactStore.updateContact(props.contact.id, editForm.value)
    isEditing.value = false
  } catch (error) {
    // 表单验证失败
  }
}

const handleDelete = async () => {
  if (!props.contact) return
  
  try {
    await ElMessageBox.confirm(
      '确定要删除该联系人吗？',
      '提示',
      {
        type: 'warning',
      }
    )
    await contactStore.deleteContact(props.contact.id)
    visible.value = false
    emit('deleted')
  } catch (error) {
    // 用户取消删除
  }
}

const handleChat = () => {
  if (!props.contact) return
  
  // TODO: 创建或打开与该联系人的会话
  router.push({
    name: 'chat',
    query: {
      userId: props.contact.id,
    },
  })
}

const handleAvatarUpload = async (file: File) => {
  if (!props.contact) return false
  
  try {
    const url = await storage.uploadImage(file)
    await contactStore.updateContact(props.contact.id, {
      ...editForm.value,
      avatar: url,
    })
    return false
  } catch (error) {
    ElMessage.error('头像上传失败')
    return false
  }
}

const getGroupName = (groupId: string) => {
  return contactStore.groups.find(g => g.id === groupId)?.name || ''
}
</script>

<style lang="scss" scoped>
.contact-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .basic-info {
    flex: 1;
    padding: var(--spacing-medium);
    
    .avatar-uploader {
      display: flex;
      justify-content: center;
      margin-bottom: var(--spacing-medium);
      
      :deep(.el-upload) {
        border: 1px dashed var(--border-base);
        border-radius: 50%;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition: var(--transition-base);
        
        &:hover {
          border-color: var(--color-primary);
        }
      }
      
      .avatar-uploader-icon {
        width: 80px;
        height: 80px;
        display: flex;
        justify-content: center;
        align-items: center;
        color: var(--text-secondary);
      }
    }
    
    .info {
      .name {
        font-size: 20px;
        font-weight: 500;
        margin-bottom: var(--spacing-small);
        text-align: center;
      }
      
      .email {
        color: var(--text-regular);
        margin-bottom: var(--spacing-medium);
        text-align: center;
      }
      
      .remark {
        color: var(--text-regular);
        margin-bottom: var(--spacing-medium);
      }
      
      .groups {
        display: flex;
        gap: var(--spacing-small);
        margin-bottom: var(--spacing-medium);
        flex-wrap: wrap;
      }
      
      .note {
        .note-title {
          font-weight: 500;
          margin-bottom: var(--spacing-small);
        }
        
        .note-content {
          color: var(--text-regular);
          white-space: pre-wrap;
        }
      }
    }
  }
  
  .actions {
    padding: var(--spacing-medium);
    border-top: 1px solid var(--border-base);
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-small);
  }
}
</style> 