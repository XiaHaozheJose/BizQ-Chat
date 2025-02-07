import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Contact, ContactGroup } from "@/types";
import * as contactApi from "@/services/api/contact";
import { chatDB } from "@/services/db";
import { ElMessage } from "element-plus";

export const useContactStore = defineStore("contact", () => {
  // 状态
  const contacts = ref<Contact[]>([]);
  const groups = ref<ContactGroup[]>([]);
  const loading = ref(false);
  const total = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(20);
  const searchKeyword = ref("");

  // 计算属性
  const sortedContacts = computed(() => {
    return [...contacts.value].sort((a, b) => {
      // 优先按分组排序
      if (a.groups?.length && !b.groups?.length) return -1;
      if (!a.groups?.length && b.groups?.length) return 1;

      // 然后按名称排序
      return (a.name || "").localeCompare(b.name || "");
    });
  });

  const groupedContacts = computed(() => {
    const result: Record<string, Contact[]> = {
      ungrouped: [],
    };

    // 初始化分组
    groups.value.forEach((group) => {
      result[group.id] = [];
    });

    // 分配联系人到对应分组
    contacts.value.forEach((contact) => {
      if (!contact.groups?.length) {
        result.ungrouped.push(contact);
      } else {
        contact.groups.forEach((groupId) => {
          if (result[groupId]) {
            result[groupId].push(contact);
          }
        });
      }
    });

    return result;
  });

  // 方法
  const loadContacts = async (page = 1, useCache = true) => {
    loading.value = true;
    currentPage.value = page;

    try {
      // 首先从本地加载数据
      if (useCache) {
        const cachedContacts = await chatDB.getAllContacts();
        if (cachedContacts.length > 0) {
          contacts.value = cachedContacts.map((contact) => ({
            ...contact,
            ownerType: contact.ownerType,
            friendType: contact.friendType,
          })) as Contact[];
        }
      }

      // 然后从服务器获取最新数据
      const response = await contactApi.getContacts({
        page,
        limit: pageSize.value,
        search: searchKeyword.value,
      });

      // 更新状态
      contacts.value = response.contacts;
      total.value = response.count;
      // 保存到本地数据库
      await Promise.all(
        response.contacts.map((contact) =>
          chatDB.saveContact({
            ...contact,
            ownerType: contact.ownerType.toString(),
            friendType: contact.friendType.toString(),
          })
        )
      );
    } catch (error) {
      console.error("Failed to load contacts:", error);
      ElMessage.error("加载联系人失败");
    } finally {
      loading.value = false;
    }
  };

  const loadGroups = async () => {
    try {
      const response = await contactApi.getContactGroups();
      groups.value = response.contactGroups;
    } catch (error) {
      console.error("Failed to load contact groups:", error);
      ElMessage.error("加载联系人分组失败");
    }
  };

  const createContact = async (data: {
    friendId: string;
    remark?: string;
    groupIds?: string[];
  }) => {
    try {
      const response = await contactApi.createContact(data);
      const newContact = response.data.contact;
      contacts.value.push(newContact);
      // 保存到本地数据库
      await chatDB.saveContact({
        ...newContact,
        ownerType: newContact.ownerType.toString(),
        friendType: newContact.friendType.toString(),
      });
      ElMessage.success("添加联系人成功");
    } catch (error) {
      console.error("Failed to create contact:", error);
      ElMessage.error("添加联系人失败");
      throw error;
    }
  };

  const updateContact = async (
    id: string,
    data: {
      remark?: string;
      note?: string;
      groupIds?: string[];
    }
  ) => {
    try {
      const response = await contactApi.updateContact(id, data);
      const updatedContact = response.data.contact;
      const index = contacts.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        contacts.value[index] = updatedContact;
      }
      // 更新本地数据库
      await chatDB.saveContact({
        ...updatedContact,
        ownerType: updatedContact.ownerType.toString(),
        friendType: updatedContact.friendType.toString(),
      });
      ElMessage.success("更新联系人成功");
    } catch (error) {
      console.error("Failed to update contact:", error);
      ElMessage.error("更新联系人失败");
      throw error;
    }
  };

  const deleteContact = async (id: string) => {
    try {
      await contactApi.deleteContact(id);
      contacts.value = contacts.value.filter((c) => c.id !== id);
      // 从本地数据库删除
      await chatDB.deleteContact(id);
      ElMessage.success("删除联系人成功");
    } catch (error) {
      console.error("Failed to delete contact:", error);
      ElMessage.error("删除联系人失败");
      throw error;
    }
  };

  const createGroup = async (name: string) => {
    try {
      const response = await contactApi.createContactGroup({ name });
      groups.value.push(response.data.contactGroup);
      ElMessage.success("创建分组成功");
    } catch (error) {
      console.error("Failed to create group:", error);
      ElMessage.error("创建分组失败");
      throw error;
    }
  };

  const updateGroup = async (id: string, name: string) => {
    try {
      const response = await contactApi.updateContactGroup(id, { name });
      const index = groups.value.findIndex((g) => g.id === id);
      if (index !== -1) {
        groups.value[index] = response.data.contactGroup;
      }
      ElMessage.success("更新分组成功");
    } catch (error) {
      console.error("Failed to update group:", error);
      ElMessage.error("更新分组失败");
      throw error;
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      await contactApi.deleteContactGroup(id);
      groups.value = groups.value.filter((g) => g.id !== id);
      ElMessage.success("删除分组成功");
    } catch (error) {
      console.error("Failed to delete group:", error);
      ElMessage.error("删除分组失败");
      throw error;
    }
  };

  const setSearchKeyword = (keyword: string) => {
    searchKeyword.value = keyword;
    loadContacts(1, false); // 重置到第一页，不使用缓存
  };

  // 初始化
  const initialize = async () => {
    await Promise.all([loadContacts(), loadGroups()]);
  };

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
  };
});
