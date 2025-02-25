<template>
  <div class="contacts-view">
    <!-- 列表区域 -->
    <div class="list-container">
      <!-- 搜索框 -->
      <draggable-container with-border height="64px">
        <el-input
          v-model="searchText"
          :placeholder="t('common.search')"
          :prefix-icon="IconSearch"
          clearable
          class="no-drag"
        />
      </draggable-container>

      <!-- 联系人列表 -->
      <div class="list-content">
        <contact-list
          @select="handleContactSelect"
          @select-group="handleGroupSelect"
        />
      </div>
    </div>

    <!-- 详情区域 -->
    <div class="detail-container">
      <template v-if="detailType === 'contact' && selectedContact">
        <ContactDetail
          v-show="detailType === 'contact'"
          :contact="selectedContact"
          @update="handleContactUpdate"
          @chat="handleChatStart"
        />
      </template>
      <template v-if="detailType === 'group' && currentGroup">
        <GroupDetail
          v-show="detailType === 'group'"
          :group="currentGroup"
          @update="handleGroupUpdate"
        />
      </template>
      <div v-show="!detailType" class="no-detail">
        <el-empty :description="t('contacts.selectContact')" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";
import { useContactStore } from "@/store/contact";
import { useChatStore } from "@/store/chat";
import { type Contact, type ContactGroup } from "@/types";
import { useI18n } from "vue-i18n";
import { Search as IconSearch } from "@element-plus/icons-vue";
import ContactList from "@/components/contact/ContactList.vue";
import ContactDetail from "@/components/contact/ContactDetail.vue";
import GroupDetail from "@/components/contact/GroupDetail.vue";
import DraggableContainer from "@/components/base/DraggableContainer.vue";
import { useRoute, useRouter } from "vue-router";

const contactStore = useContactStore();
const chatStore = useChatStore();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

// 状态
const searchText = ref("");
const selectedContact = ref<Contact | null>(null);
const detailType = ref<"contact" | "group" | null>(null);
const currentGroup = ref<ContactGroup | null>(null);

// 处理联系人选择
const handleContactSelect = async (contact: Contact) => {
  detailType.value = "contact";
  selectedContact.value = contact;
  currentGroup.value = null;
};

// 处理群组选择
const handleGroupSelect = (group: ContactGroup) => {
  detailType.value = "group";
  currentGroup.value = group;
  selectedContact.value = null;
};

// 处理联系人更新
const handleContactUpdate = () => {
  contactStore.loadContacts();
};

// 处理群组更新
const handleGroupUpdate = () => {
  contactStore.loadGroups();
};

// 开始聊天
const handleChatStart = async (contact: Contact) => {
  try {
    const conversation = await chatStore.createOrGetConversation(
      contact.friend
    );
    await chatStore.setCurrentConversation(conversation);
    // 跳转到聊天页面
    router.push("/chat");
  } catch (error) {
    console.error("Failed to start chat:", error);
    ElMessage.error(t("chat.startChatError"));
  }
};

// 监听路由变化以处理群组详情
watch(
  () => route.name,
  (newRouteName) => {
    if (newRouteName === "groupDetail") {
      detailType.value = "group";
      selectedContact.value = null;
    }
  }
);

// 监听搜索文本变化
watch(searchText, (newValue) => {
  contactStore.setSearchKeyword(newValue);
});

// 生命周期
onMounted(async () => {
  // 初始化联系人
  await contactStore.initialize();
});
</script>

<style lang="scss" scoped>
.contacts-view {
  width: 100%;
  height: 100%;
  display: flex;
  background-color: var(--el-bg-color);

  .list-container {
    width: 280px;
    border-right: 1px solid var(--el-border-color-light);
    display: flex;
    flex-direction: column;

    .list-content {
      flex: 1;
      overflow-y: auto;
    }
  }

  .detail-container {
    flex: 1;
    background-color: var(--el-bg-color-page);
    overflow-y: auto;

    .no-detail {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
