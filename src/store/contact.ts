import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Contact, ContactGroup } from '@/types'
import * as contactApi from '@/services/api/contact'
import { ElMessage } from 'element-plus'

export const useContactStore = defineStore('contact', () => {
  // 状态
  const contacts = ref<Contact[]>([])
  const groups = ref<ContactGroup[]>([])
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const searchKeyword = ref('')
  
  // 计算属性
  const sortedContacts = computed(() => {
    return [...contacts.value].sort((a, b) => {
      // 优先按分组排序
      if (a.groups?.length && !b.groups?.length) return -1
      if (!a.groups?.length && b.groups?.length) return 1
      
      // 然后按名称排序
      return a.name.localeCompare(b.name)
    })
  })
  
  const groupedContacts = computed(() => {
    const result: Record<string, Contact[]> = {
      ungrouped: []
    }
    
    // 初始化分组
    groups.value.forEach(group => {
      result[group.id] = []
    })
    
    // 分配联系人到对应分组
    contacts.value.forEach(contact => {
      if (!contact.groups?.length) {
        result.ungrouped.push(contact)
      } else {
        contact.groups.forEach(groupId => {
          if (result[groupId]) {
            result[groupId].push(contact)
          }
        })
      }
    })
    
    return result
  })
  
  // 方法
  const loadContacts = async (page = 1) => {
    loading.value = true
    currentPage.value = page
    
    try {
      const response = await contactApi.getContacts({
        page,
        limit: pageSize.value,
        search: searchKeyword.value
      })
      
      contacts.value = response.data.contacts
      total.value = response.data.total
    } catch (error) {
      console.error('Failed to load contacts:', error)
      ElMessage.error('加载联系人失败')
    } finally {
      loading.value = false
    }
  }
  
  const loadGroups = async () => {
    try {
      const response = await contactApi.getContactGroups()
      groups.value = response.data.groups
    } catch (error) {
      console.error('Failed to load contact groups:', error)
      ElMessage.error('加载联系人分组失败')
    }
  }
  
  const createContact = async (data: {
    friendId: string
    remark?: string
    groupIds?: string[]
  }) => {
    try {
      const response = await contactApi.createContact(data)
      contacts.value.push(response.data.contact)
      ElMessage.success('添加联系人成功')
    } catch (error) {
      console.error('Failed to create contact:', error)
      ElMessage.error('添加联系人失败')
      throw error
    }
  }
  
  const updateContact = async (id: string, data: {
    remark?: string
    note?: string
    groupIds?: string[]
  }) => {
    try {
      const response = await contactApi.updateContact(id, data)
      const index = contacts.value.findIndex(c => c.id === id)
      if (index !== -1) {
        contacts.value[index] = response.data.contact
      }
      ElMessage.success('更新联系人成功')
    } catch (error) {
      console.error('Failed to update contact:', error)
      ElMessage.error('更新联系人失败')
      throw error
    }
  }
  
  const deleteContact = async (id: string) => {
    try {
      await contactApi.deleteContact(id)
      contacts.value = contacts.value.filter(c => c.id !== id)
      ElMessage.success('删除联系人成功')
    } catch (error) {
      console.error('Failed to delete contact:', error)
      ElMessage.error('删除联系人失败')
      throw error
    }
  }
  
  const createGroup = async (name: string) => {
    try {
      const response = await contactApi.createContactGroup({ name })
      groups.value.push(response.data.group)
      ElMessage.success('创建分组成功')
    } catch (error) {
      console.error('Failed to create group:', error)
      ElMessage.error('创建分组失败')
      throw error
    }
  }
  
  const updateGroup = async (id: string, name: string) => {
    try {
      const response = await contactApi.updateContactGroup(id, { name })
      const index = groups.value.findIndex(g => g.id === id)
      if (index !== -1) {
        groups.value[index] = response.data.group
      }
      ElMessage.success('更新分组成功')
    } catch (error) {
      console.error('Failed to update group:', error)
      ElMessage.error('更新分组失败')
      throw error
    }
  }
  
  const deleteGroup = async (id: string) => {
    try {
      await contactApi.deleteContactGroup(id)
      groups.value = groups.value.filter(g => g.id !== id)
      ElMessage.success('删除分组成功')
    } catch (error) {
      console.error('Failed to delete group:', error)
      ElMessage.error('删除分组失败')
      throw error
    }
  }
  
  const setSearchKeyword = (keyword: string) => {
    searchKeyword.value = keyword
    loadContacts(1) // 重置到第一页
  }
  
  // 初始化
  const initialize = async () => {
    await Promise.all([
      loadContacts(),
      loadGroups()
    ])
  }
  
  return {
    contacts,
    groups,
    loading,
    total,
    currentPage,
    pageSize,
    searchKeyword,
    sortedContacts,
    groupedContacts,
    loadContacts,
    loadGroups,
    createContact,
    updateContact,
    deleteContact,
    createGroup,
    updateGroup,
    deleteGroup,
    setSearchKeyword,
    initialize,
  }
}) 