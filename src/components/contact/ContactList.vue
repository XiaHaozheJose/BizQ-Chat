<template>
  <div class="contact-list">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索联系人"
        :prefix-icon="Search"
        clearable
        @input="handleSearch"
      />
      
      <div class="actions">
        <el-button
          type="primary"
          :icon="Plus"
          @click="showAddContactDialog = true"
        >
          添加联系人
        </el-button>
        
        <el-button
          :icon="FolderAdd"
          @click="showGroupManageDialog = true"
        >
          分组管理
        </el-button>
      </div>
    </div>
    
    <!-- 主体内容 -->
    <div class="content">
      <!-- 分组列表 -->
      <div class="group-list">
        <el-menu
          :default-active="currentGroupId"
          @select="handleGroupSelect"
        >
          <el-menu-item index="all">
            <el-icon><List /></el-icon>
            <span>全部联系人</span>
            <span class="count">{{ contactStore.contacts.length }}</span>
          </el-menu-item>
          
          <el-menu-item index="ungrouped">
            <el-icon><User /></el-icon>
            <span>未分组</span>
            <span class="count">{{ contactStore.groupedContacts.ungrouped.length }}</span>
          </el-menu-item>
          
          <el-sub-menu index="groups">
            <template #title>
              <el-icon><Folder /></el-icon>
              <span>分组列表</span>
            </template>
            
            <el-menu-item
              v-for="group in contactStore.groups"
              :key="group.id"
              :index="group.id"
            >
              <span>{{ group.name }}</span>
              <span class="count">{{ contactStore.groupedContacts[group.id]?.length || 0 }}</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </div>
      
      <!-- 联系人列表 -->
      <div class="contact-container">
        <el-scrollbar>
          <div v-if="contactStore.loading" class="loading">
            <el-skeleton :rows="10" animated />
          </div>
          
          <template v-else>
            <div
              v-for="contact in displayContacts"
              :key="contact.id"
              class="contact-item"
              @click="handleContactClick(contact)"
            >
              <el-avatar :src="contact.avatar" :size="40">
                {{ contact.name[0] }}
              </el-avatar>
              
              <div class="info">
                <div class="name">{{ contact.name }}</div>
                <div class="remark">{{ contact.remark || contact.email }}</div>
              </div>
              
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
              
              <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, contact)">
                <el-button class="more-btn" :icon="More" circle />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            
            <div v-if="!displayContacts.length" class="empty">
              <el-empty description="暂无联系人" />
            </div>
          </template>
        </el-scrollbar>
        
        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="contactStore.currentPage"
            v-model:page-size="contactStore.pageSize"
            :total="contactStore.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>
    
    <!-- 添加联系人对话框 -->
    <el-dialog
      v-model="showAddContactDialog"
      title="添加联系人"
      width="500px"
    >
      <el-form
        ref="addContactFormRef"
        :model="addContactForm"
        :rules="addContactRules"
        label-width="80px"
      >
        <el-form-item label="用户ID" prop="friendId">
          <el-input v-model="addContactForm.friendId" placeholder="请输入用户ID" />
        </el-form-item>
        
        <el-form-item label="备注" prop="remark">
          <el-input v-model="addContactForm.remark" placeholder="请输入备注" />
        </el-form-item>
        
        <el-form-item label="分组" prop="groupIds">
          <el-select
            v-model="addContactForm.groupIds"
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
      </el-form>
      
      <template #footer>
        <el-button @click="showAddContactDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddContact">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 分组管理对话框 -->
    <el-dialog
      v-model="showGroupManageDialog"
      title="分组管理"
      width="500px"
    >
      <div class="group-manage">
        <div class="group-list">
          <div
            v-for="group in contactStore.groups"
            :key="group.id"
            class="group-item"
          >
            <template v-if="editingGroupId === group.id">
              <el-input
                v-model="editingGroupName"
                size="small"
                @keyup.enter="handleSaveGroup"
                @blur="handleSaveGroup"
              />
            </template>
            <template v-else>
              <span class="name">{{ group.name }}</span>
              <div class="actions">
                <el-button
                  :icon="Edit"
                  circle
                  size="small"
                  @click="handleEditGroup(group)"
                />
                <el-button
                  :icon="Delete"
                  circle
                  size="small"
                  type="danger"
                  @click="handleDeleteGroup(group)"
                />
              </div>
            </template>
          </div>
        </div>
        
        <el-input
          v-model="newGroupName"
          placeholder="输入分组名称"
          size="small"
          @keyup.enter="handleCreateGroup"
        >
          <template #append>
            <el-button @click="handleCreateGroup">添加</el-button>
          </template>
        </el-input>
      </div>
    </el-dialog>
    
    <!-- 联系人详情抽屉 -->
    <contact-detail
      v-model="showContactDetail"
      :contact="selectedContact"
      @deleted="handleContactDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Search,
  Plus,
  FolderAdd,
  List,
  User,
  Folder,
  More,
  Edit,
  Delete,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Contact } from '@/types'
import { useContactStore } from '@/store/contact'
import ContactDetail from './ContactDetail.vue'

const contactStore = useContactStore()

// 状态
const searchKeyword = ref('')
const currentGroupId = ref('all')
const showAddContactDialog = ref(false)
const showGroupManageDialog = ref(false)
const showContactDetail = ref(false)
const selectedContact = ref<Contact>()
const addContactForm = ref({
  friendId: '',
  remark: '',
  groupIds: [] as string[],
})
const addContactFormRef = ref()
const editingGroupId = ref('')
const editingGroupName = ref('')
const newGroupName = ref('')

// 表单校验规则
const addContactRules = {
  friendId: [
    { required: true, message: '请输入用户ID', trigger: 'blur' },
  ],
}

// 计算属性
const displayContacts = computed(() => {
  if (currentGroupId.value === 'all') {
    return contactStore.sortedContacts
  }
  
  if (currentGroupId.value === 'ungrouped') {
    return contactStore.groupedContacts.ungrouped
  }
  
  return contactStore.groupedContacts[currentGroupId.value] || []
})

// 方法
const handleSearch = () => {
  contactStore.setSearchKeyword(searchKeyword.value)
}

const handleGroupSelect = (id: string) => {
  currentGroupId.value = id
}

const handleContactClick = (contact: Contact) => {
  selectedContact.value = contact
  showContactDetail.value = true
}

const handleContactDeleted = () => {
  selectedContact.value = undefined
  showContactDetail.value = false
}

const handleCommand = async (command: string, contact: Contact) => {
  switch (command) {
    case 'edit':
      selectedContact.value = contact
      showContactDetail.value = true
      break
    case 'delete':
      try {
        await ElMessageBox.confirm(
          '确定要删除该联系人吗？',
          '提示',
          {
            type: 'warning',
          }
        )
        await contactStore.deleteContact(contact.id)
      } catch (error) {
        // 用户取消删除
      }
      break
  }
}

const handleSizeChange = (size: number) => {
  contactStore.loadContacts(1)
}

const handlePageChange = (page: number) => {
  contactStore.loadContacts(page)
}

const handleAddContact = async () => {
  if (!addContactFormRef.value) return
  
  try {
    await addContactFormRef.value.validate()
    await contactStore.createContact(addContactForm.value)
    showAddContactDialog.value = false
    addContactForm.value = {
      friendId: '',
      remark: '',
      groupIds: [],
    }
  } catch (error) {
    // 表单验证失败
  }
}

const handleEditGroup = (group: { id: string; name: string }) => {
  editingGroupId.value = group.id
  editingGroupName.value = group.name
}

const handleSaveGroup = async () => {
  if (!editingGroupId.value || !editingGroupName.value.trim()) {
    editingGroupId.value = ''
    editingGroupName.value = ''
    return
  }
  
  try {
    await contactStore.updateGroup(editingGroupId.value, editingGroupName.value)
    editingGroupId.value = ''
    editingGroupName.value = ''
  } catch (error) {
    // 处理错误
  }
}

const handleDeleteGroup = async (group: { id: string; name: string }) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分组"${group.name}"吗？`,
      '提示',
      {
        type: 'warning',
      }
    )
    await contactStore.deleteGroup(group.id)
  } catch (error) {
    // 用户取消删除
  }
}

const handleCreateGroup = async () => {
  if (!newGroupName.value.trim()) return
  
  try {
    await contactStore.createGroup(newGroupName.value)
    newGroupName.value = ''
  } catch (error) {
    // 处理错误
  }
}

const getGroupName = (groupId: string) => {
  return contactStore.groups.find(g => g.id === groupId)?.name || ''
}

// 初始化
contactStore.initialize()
</script>

<style lang="scss" scoped>
.contact-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .toolbar {
    padding: var(--spacing-medium);
    border-bottom: 1px solid var(--border-base);
    display: flex;
    gap: var(--spacing-medium);
    
    .el-input {
      width: 300px;
    }
    
    .actions {
      margin-left: auto;
      display: flex;
      gap: var(--spacing-small);
    }
  }
  
  .content {
    flex: 1;
    display: flex;
    overflow: hidden;
    
    .group-list {
      width: 200px;
      border-right: 1px solid var(--border-base);
      
      .el-menu {
        border-right: none;
      }
      
      .count {
        margin-left: auto;
        color: var(--text-secondary);
        font-size: 12px;
      }
    }
    
    .contact-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      
      .loading {
        padding: var(--spacing-medium);
      }
      
      .contact-item {
        padding: var(--spacing-medium);
        display: flex;
        align-items: center;
        gap: var(--spacing-medium);
        cursor: pointer;
        
        &:hover {
          background-color: var(--bg-base);
          
          .more-btn {
            opacity: 1;
          }
        }
        
        .info {
          flex: 1;
          
          .name {
            font-weight: 500;
            margin-bottom: 4px;
          }
          
          .remark {
            font-size: 12px;
            color: var(--text-secondary);
          }
        }
        
        .groups {
          display: flex;
          gap: var(--spacing-mini);
        }
        
        .more-btn {
          opacity: 0;
          transition: opacity 0.2s;
        }
      }
      
      .empty {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        color: var(--text-secondary);
      }
      
      .pagination {
        padding: var(--spacing-medium);
        border-top: 1px solid var(--border-base);
        display: flex;
        justify-content: flex-end;
      }
    }
  }
}

.group-manage {
  .group-list {
    margin-bottom: var(--spacing-medium);
    
    .group-item {
      display: flex;
      align-items: center;
      padding: var(--spacing-small);
      
      .name {
        flex: 1;
      }
      
      .actions {
        display: flex;
        gap: var(--spacing-mini);
        opacity: 0;
        transition: opacity 0.2s;
      }
      
      &:hover .actions {
        opacity: 1;
      }
    }
  }
}
</style> 