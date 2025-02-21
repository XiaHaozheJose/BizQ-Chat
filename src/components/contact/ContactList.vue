<template>
  <div class="contact-list">
    <!-- 联系人列表 -->
    <div class="contacts-container">
      <!-- 分组列表 -->
      <div class="contacts-section groups-section">
        <div class="section-header">
          <span class="section-title">{{ t("common.groups") }}</span>
          <span class="section-count">{{ groups.length }}</span>
        </div>
        <div class="contact-items">
          <div
            v-for="group in groups"
            :key="group.id"
            class="group-item"
            @click="handleGroupClick(group)"
          >
            <el-avatar
              :size="24"
              :src="getImageUrl(group.image, 'small')"
              shape="square"
            >
              <el-icon><Folder /></el-icon>
            </el-avatar>
            <span class="group-name">{{ group.name }}</span>
            <span class="group-count">{{
              getGroupContactsCount(group.id)
            }}</span>
          </div>
        </div>
      </div>

      <!-- 按字母分组的联系人列表 -->
      <template v-if="Object.keys(alphabeticalContacts).length > 0">
        <div
          v-for="(contacts, letter) in alphabeticalContacts"
          :key="letter"
          class="contacts-section"
        >
          <div class="section-header">
            <span class="section-title">{{ letter }}</span>
          </div>
          <div class="contact-items">
            <contact-item
              v-for="contact in contacts"
              :key="contact.id"
              :contact="contact"
              :selected="selectedContactIds.includes(contact.id)"
              @click="selectContact(contact)"
              @select="toggleSelectContact(contact)"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Folder } from "@element-plus/icons-vue";
import { useContactStore } from "@/store/contact";
import { useI18n } from "vue-i18n";
import type { Contact, ContactGroup } from "@/types";
import ContactItem from "@/components/contact/ContactItem.vue";
import { getImageUrl } from "@/utils";
import { useRouter } from "vue-router";

const props = defineProps<{
  selectable?: boolean;
  multiSelect?: boolean;
}>();

const emit = defineEmits<{
  (e: "select", contact: Contact): void;
  (e: "selectMultiple", contacts: Contact[]): void;
  (e: "select-group", group: ContactGroup): void;
}>();

const { t } = useI18n();
const contactStore = useContactStore();
const selectedContactIds = ref<string[]>([]);
const router = useRouter();

// 计算属性
const groups = computed(() => contactStore.groups);
const contacts = computed(() => contactStore.contacts);

// 按字母排序的联系人
const alphabeticalContacts = computed(() => {
  const result: Record<string, Contact[]> = {};
  console.log("contacts", contacts.value);
  contacts.value
    .filter((contact) => contact && contact.friend && contact.friend.name) // Filter out invalid contacts
    .forEach((contact) => {
      console.log("contact.name", contact.friend.name);
      const firstLetter =
        (contact.friend.name || "").charAt(0).toUpperCase() || "#";
      if (!result[firstLetter]) {
        result[firstLetter] = [];
      }
      result[firstLetter].push(contact);
    });

  // 对每个字母组内的联系人进行排序
  Object.keys(result).forEach((letter) => {
    result[letter].sort((a, b) =>
      (a.friend.name || "").localeCompare(b.friend.name || "")
    );
  });

  // 返回按字母排序的结果
  return Object.keys(result)
    .sort()
    .reduce((sorted, key) => {
      sorted[key] = result[key];
      return sorted;
    }, {} as Record<string, Contact[]>);
});

// 方法
const getGroupContactsCount = (groupId: string) => {
  return contacts.value.filter((contact) =>
    contact.groups.map((group) => group.id).includes(groupId)
  ).length;
};

// 处理分组点击
const handleGroupClick = (group: ContactGroup) => {
  emit("select-group", group);
};

const selectContact = (contact: Contact) => {
  if (!props.selectable) {
    emit("select", contact);
    return;
  }

  if (!props.multiSelect) {
    selectedContactIds.value = [contact.id];
    emit("select", contact);
  }
};

const toggleSelectContact = (contact: Contact) => {
  if (!props.selectable || !props.multiSelect) return;

  const index = selectedContactIds.value.indexOf(contact.id);
  if (index === -1) {
    selectedContactIds.value.push(contact.id);
  } else {
    selectedContactIds.value.splice(index, 1);
  }

  const selectedContacts = contacts.value.filter((c) =>
    selectedContactIds.value.includes(c.id)
  );
  emit("selectMultiple", selectedContacts);
};

const handleNewFriends = () => {
  // TODO: 处理新朋友点击
  console.log("New friends clicked");
};

const handleOfficialAccounts = () => {
  // TODO: 处理公众号点击
  console.log("Official accounts clicked");
};

const handleEnterpriseContacts = () => {
  // TODO: 处理企业微信联系人点击
  console.log("Enterprise contacts clicked");
};
</script>

<style lang="scss" scoped>
@use "@/styles/mixins" as *;

.contact-list {
  height: 100%;
  background-color: var(--el-bg-color);
  overflow-y: auto;

  .contacts-container {
    .contacts-section {
      &.groups-section {
        margin-bottom: 16px;
        border-bottom: 1px solid var(--el-border-color-light);
      }

      .section-header {
        display: flex;
        align-items: center;
        padding: 4px 16px;
        background-color: var(--el-fill-color-light);

        .section-title {
          font-size: 13px;
          color: var(--el-text-color-secondary);
        }

        .section-count {
          margin-left: 4px;
          font-size: 13px;
          color: var(--el-text-color-secondary);
        }
      }

      .contact-items {
        .contact-item {
          border-radius: 0;
          margin: 0;

          &:hover {
            background-color: var(--el-fill-color-light);
          }

          &.selected {
            background-color: var(--el-color-primary-light-9);
          }
        }
      }

      .group-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background-color: var(--el-fill-color-light);
        }

        .el-avatar {
          margin-right: 12px;
          background-color: var(--el-color-primary-light-8);

          .el-icon {
            font-size: 16px;
            color: var(--el-color-primary);
          }
        }

        .group-name {
          flex: 1;
          font-size: 14px;
          color: var(--el-text-color-primary);
          @include text-ellipsis;
        }

        .group-count {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          margin-left: 8px;
        }
      }
    }
  }
}
</style>
