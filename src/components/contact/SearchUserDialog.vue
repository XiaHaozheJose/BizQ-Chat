<template>
  <el-dialog
    v-model="visible"
    title="添加联系人"
    width="600px"
    :close-on-click-modal="false"
  >
    <!-- 搜索框 -->
    <div class="search-box">
      <el-input
        v-model="keyword"
        placeholder="搜索用户名/邮箱/手机号"
        :prefix-icon="Search"
        clearable
        @input="handleSearch"
      />
      
      <el-radio-group v-model="searchType" @change="handleSearch">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button label="user">用户</el-radio-button>
        <el-radio-button label="shop">商家</el-radio-button>
      </el-radio-group>
    </div>
    
    <!-- 搜索结果列表 -->
    <div class="search-result">
      <el-scrollbar height="400px">
        <div v-if="loading" class="loading">
          <el-skeleton :rows="3" animated />
        </div>
        
        <template v-else>
          <div
            v-for="user in users"
            :key="user.id"
            class="user-item"
            @click="handleSelectUser(user)"
          >
            <el-avatar :src="user.headImg" :size="40">
              {{ user.name[0] }}
            </el-avatar>
            
            <div class="info">
              <div class="name-type">
                <span class="name">{{ user.name }}</span>
                <el-tag
                  size="small"
                  :type="user.operatorType === 'shop' ? 'success' : ''"
                >
                  {{ user.operatorType === 'shop' ? '商家' : '用户' }}
                </el-tag>
              </div>
              
              <div class="detail">
                <span v-if="user.email">{{ user.email }}</span>
                <span v-if="user.phone">{{ user.phone }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="!users.length" class="empty">
            <el-empty description="暂无搜索结果" />
          </div>
        </template>
      </el-scrollbar>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
    
    <!-- 添加联系人表单 -->
    <el-dialog
      v-model="showAddForm"
      title="设置联系人信息"
      width="400px"
      append-to-body
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入备注" />
        </el-form-item>
        
        <el-form-item label="分组" prop="groupIds">
          <el-select
            v-model="form.groupIds"
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
        <el-button @click="showAddForm = false">取消</el-button>
        <el-button type="primary" @click="handleAddContact">确定</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import type { User, Business } from '@/types'
import { useContactStore } from '@/store/contact'
import { searchUsers } from '@/services/api/contact'
import { debounce } from '@/utils'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'added'): void
}>()

const contactStore = useContactStore()

// 搜索相关
const keyword = ref('')
const searchType = ref<'all' | 'user' | 'shop'>('all')
const loading = ref(false)
const users = ref<(User | Business)[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 添加联系人相关
const showAddForm = ref(false)
const selectedUser = ref<User | Business>()
const formRef = ref<FormInstance>()
const form = ref({
  remark: '',
  groupIds: [] as string[],
})

// 表单校验规则
const rules = {
  remark: [
    { max: 50, message: '备注不能超过50个字符', trigger: 'blur' },
  ],
}

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// 搜索用户
const doSearch = async () => {
  if (!keyword.value.trim()) {
    users.value = []
    total.value = 0
    return
  }
  
  loading.value = true
  
  try {
    const response = await searchUsers({
      keyword: keyword.value,
      type: searchType.value,
      page: currentPage.value,
      limit: pageSize.value,
    })
    
    users.value = response.data.users
    total.value = response.data.total
  } catch (error) {
    console.error('Failed to search users:', error)
    ElMessage.error('搜索用户失败')
  } finally {
    loading.value = false
  }
}

// 防抖处理
const handleSearch = debounce(() => {
  currentPage.value = 1
  doSearch()
}, 300)

// 分页处理
const handleSizeChange = () => {
  currentPage.value = 1
  doSearch()
}

const handlePageChange = () => {
  doSearch()
}

// 选择用户
const handleSelectUser = (user: User | Business) => {
  selectedUser.value = user
  form.value = {
    remark: '',
    groupIds: [],
  }
  showAddForm.value = true
}

// 添加联系人
const handleAddContact = async () => {
  if (!formRef.value || !selectedUser.value) return
  
  try {
    await formRef.value.validate()
    await contactStore.createContact({
      friendId: selectedUser.value.id,
      ...form.value,
    })
    
    showAddForm.value = false
    visible.value = false
    emit('added')
    ElMessage.success('添加联系人成功')
  } catch (error) {
    // 表单验证失败或添加失败
  }
}

// 监听弹窗关闭
const handleClose = () => {
  keyword.value = ''
  searchType.value = 'all'
  users.value = []
  total.value = 0
  currentPage.value = 1
  showAddForm.value = false
}
</script>

<style lang="scss" scoped>
.search-box {
  display: flex;
  gap: var(--spacing-medium);
  margin-bottom: var(--spacing-medium);
  
  .el-input {
    width: 300px;
  }
}

.search-result {
  .loading {
    padding: var(--spacing-medium);
  }
  
  .user-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-medium);
    padding: var(--spacing-medium);
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: var(--bg-base);
    }
    
    .info {
      flex: 1;
      min-width: 0;
      
      .name-type {
        display: flex;
        align-items: center;
        gap: var(--spacing-small);
        margin-bottom: 4px;
        
        .name {
          font-weight: 500;
          @include text-ellipsis;
        }
      }
      
      .detail {
        font-size: 12px;
        color: var(--text-secondary);
        
        span {
          margin-right: var(--spacing-medium);
        }
      }
    }
  }
  
  .empty {
    padding: var(--spacing-large) 0;
  }
  
  .pagination {
    padding: var(--spacing-medium);
    border-top: 1px solid var(--border-base);
    display: flex;
    justify-content: flex-end;
  }
}

@mixin text-ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style> 