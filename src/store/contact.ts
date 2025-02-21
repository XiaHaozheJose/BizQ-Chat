import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  Contact,
  ContactGroup,
  ConversationUser,
  UpdateGroupParams,
} from "@/types";
import * as contactApi from "@/services/api/contact";
import { getChatDB, ChatDatabase } from "@/services/db";
import { ElMessage } from "element-plus";
import { useChatStore } from "@/store/chat";
import { useUserStore } from "@/store/user";
import { UserType } from "@/types";

export const useContactStore = defineStore("contact", () => {
  // 状态
  const contacts = ref<Contact[]>([]);
  const groups = ref<ContactGroup[]>([]);
  const loading = ref(false);
  const total = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(20);
  const searchKeyword = ref("");

  const chatStore = useChatStore();
  const userStore = useUserStore();

  // 获取数据库实例
  const chatDB = computed(() => {
    if (!userStore.currentUser?.id) {
      throw new Error("User not logged in");
    }
    return getChatDB(userStore.currentUser.id);
  });

  // 计算属性
  const sortedContacts = computed(() => {
    return [...contacts.value].sort((a, b) => {
      // 优先按分组排序
      if (a.groups?.length && !b.groups?.length) return -1;
      if (!a.groups?.length && b.groups?.length) return 1;

      // 然后按名称排序
      return (a.friend.name || "").localeCompare(b.friend.name || "");
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
        contact.groups.forEach((group) => {
          if (result[group.id]) {
            result[group.id].push(contact);
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
      // 确保数据库已初始化
      if (!chatDB.value) {
        throw new Error("Database not initialized");
      }

      // 首先从本地加载数据
      if (useCache) {
        const cachedContacts = await chatDB.value.getAllContacts();
        if (cachedContacts.length > 0) {
          contacts.value = cachedContacts.map((contact) => ({
            ...contact,
            ownerType: contact.ownerType as UserType,
            friendType: contact.friendType as UserType,
          })) as unknown as Contact[];
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
        response.contacts.map(async (contact) => {
          const friend = contact.friend;
          const contactData = {
            id: contact.id,
            name: friend.name || "",
            friendID: contact.friendId,
            ownerID: contact.ownerId,
            ownerType: contact.ownerType.toString(),
            friendType: contact.friendType.toString(),
            isShop: contact.friendType === UserType.Shop,
            image: friend.headImg || friend.logo || "",
            remark: contact.remark || "",
            note: contact.note || "",
            groups: contact.groups?.map((g) => g.id) || [],
            createdAt: contact.createdAt,
            updatedAt: contact.updatedAt,
            isSelected: false,
          } as const;
          await chatDB.value.saveContact(contactData);

          // 同步用户信息到会话
          await syncUserToConversation(contact);
        })
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

  // 同步用户信息到会话用户
  const syncUserToConversation = async (contact: Contact) => {
    try {
      // 确保数据库已初始化
      if (!chatDB.value) {
        throw new Error("Database not initialized");
      }

      const friend = contact.friend;
      const userInfo: ConversationUser = {
        id: contact.friendId,
        name: friend.name || "",
        avatar: friend.headImg || friend.logo || "",
        status: "offline",
        remark: contact.remark,
        isShop: contact.friendType === UserType.Shop,
      };

      // 保存到本地数据库
      await chatDB.value.saveUser(userInfo);

      // 更新内存中的用户信息
      chatStore.$patch((state) => {
        state.users[contact.friendId] = userInfo;
      });
    } catch (error) {
      console.error("Failed to sync user info:", error);
    }
  };

  const createContact = async (data: {
    friendId: string;
    remark?: string;
    groupIds?: string[];
  }) => {
    try {
      // 确保数据库已初始化
      if (!chatDB.value) {
        throw new Error("Database not initialized");
      }

      const response = await contactApi.createContact(data);
      const newContact = response.data.contact;
      contacts.value.push(newContact);

      // 同步用户信息到会话
      await syncUserToConversation(newContact);

      // 保存到本地数据库
      const friend = newContact.friend;
      const contactData = {
        id: newContact.id,
        name: friend.name || "",
        friendID: newContact.friendId,
        ownerID: newContact.ownerId,
        ownerType: newContact.ownerType.toString(),
        friendType: newContact.friendType.toString(),
        isShop: newContact.friendType === UserType.Shop,
        image: friend.headImg || friend.logo || "",
        remark: newContact.remark || "",
        note: newContact.note || "",
        groups: newContact.groups?.map((g) => g.id) || [],
        createdAt: newContact.createdAt,
        updatedAt: newContact.updatedAt,
        isSelected: false,
      } as const;
      await chatDB.value.saveContact(contactData);
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
      // 确保数据库已初始化
      if (!chatDB.value) {
        throw new Error("Database not initialized");
      }

      await contactApi.updateContact(id, data);

      // Find and update the contact in the local state
      const index = contacts.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        const updatedContact = {
          ...contacts.value[index],
          remark: data.remark ?? contacts.value[index].remark,
          note: data.note ?? contacts.value[index].note,
          groups: data.groupIds
            ? groups.value.filter((g) => data.groupIds?.includes(g.id))
            : contacts.value[index].groups,
        };
        contacts.value[index] = updatedContact;

        // 同步用户信息到会话
        await syncUserToConversation(updatedContact);

        // 更新本地数据库
        const friend = updatedContact.friend;
        const contactData = {
          id: updatedContact.id,
          name: friend.name || "",
          friendID: updatedContact.friendId,
          ownerID: updatedContact.ownerId,
          ownerType: updatedContact.ownerType.toString(),
          friendType: updatedContact.friendType.toString(),
          isShop: updatedContact.friendType === UserType.Shop,
          image: friend.headImg || friend.logo || "",
          remark: updatedContact.remark || "",
          note: updatedContact.note || "",
          groups: updatedContact.groups?.map((g) => g.id) || [],
          createdAt: updatedContact.createdAt,
          updatedAt: updatedContact.updatedAt,
          isSelected: false,
        } as const;
        await chatDB.value.saveContact(contactData);
      }
    } catch (error) {
      console.error("Failed to update contact:", error);
      throw error;
    }
  };

  const deleteContact = async (id: string) => {
    try {
      // 确保数据库已初始化
      if (!chatDB.value) {
        throw new Error("Database not initialized");
      }

      await contactApi.deleteContact(id);
      contacts.value = contacts.value.filter((c) => c.id !== id);
      // 从本地数据库删除
      await chatDB.value.deleteContact(id);
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

  const updateGroup = async (id: string, data: UpdateGroupParams) => {
    try {
      await contactApi.updateContactGroup(id, data);
      const index = groups.value.findIndex((g) => g.id === id);
      if (index !== -1) {
        groups.value[index] = {
          ...groups.value[index],
          ...data,
        };
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
    try {
      if (!userStore.currentUser?.id) {
        console.warn(
          "Skipping contact store initialization - no user logged in"
        );
        return;
      }

      // 确保数据库已初始化
      await chatDB.value.initialize();

      // 加载数据
      await Promise.all([loadContacts(), loadGroups()]);
    } catch (error) {
      console.error("Failed to initialize contact store:", error);
      ElMessage.error("初始化联系人失败");
    }
  };

  // 清理数据
  const cleanup = async () => {
    // 清理内存中的数据
    contacts.value = [];
    groups.value = [];
    total.value = 0;
    currentPage.value = 1;
    searchKeyword.value = "";

    // 关闭数据库连接
    // 注意:这里只是关闭连接,不删除数据,以便将来可以重新加载
    if (userStore.currentUser?.id) {
      ChatDatabase.clearInstance(userStore.currentUser.id);
    }
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
    cleanup,
  };
});
