<template>
  <draggable-container
    class="side-nav"
    :class="{ expanded }"
    has-system-buttons
    padding="0"
  >
    <!-- 用户头像 -->
    <div class="nav-header no-drag">
      <el-avatar
        :size="40"
        :src="
          getImageUrl(
            userStore.currentUser?.headImg || userStore.currentUser?.logo,
            'medium',
            userStore.currentUser?.isShop
          )
        "
        :shape="userStore.currentUser?.isShop ? 'square' : 'circle'"
        @click="handleProfileClick"
      >
        <img
          :src="
            userStore.currentUser?.isShop ? DEFAULT_SHOP_AVATAR : DEFAULT_AVATAR
          "
        />
      </el-avatar>
    </div>

    <!-- 导航菜单 -->
    <div class="nav-menu">
      <template v-for="item in navItems" :key="item.name">
        <!-- 带子菜单的导航项 -->
        <div v-if="item.children" class="nav-item-with-children">
          <div
            class="nav-item parent-item no-drag"
            :class="{ active: isParentActive(item) }"
            @click="toggleSubmenu(item.name)"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span v-if="expanded" class="nav-text">{{ item.title }}</span>
            <el-icon
              v-if="expanded"
              class="arrow-icon"
              :class="{ 'is-open': expandedSubmenus.includes(item.name) }"
            >
              <arrow-down />
            </el-icon>
          </div>

          <!-- 子菜单 -->
          <div
            class="submenu"
            v-show="expanded && expandedSubmenus.includes(item.name)"
          >
            <router-link
              v-for="subItem in item.children"
              :key="subItem.name"
              :to="subItem.path"
              custom
              v-slot="{ isActive, navigate }"
            >
              <div
                class="nav-item submenu-item no-drag"
                :class="{ active: isActive }"
                @click="navigate"
              >
                <span class="nav-text">{{ subItem.title }}</span>
              </div>
            </router-link>
          </div>
        </div>

        <!-- 普通导航项 -->
        <router-link
          v-else
          :to="item.path"
          custom
          v-slot="{ isActive, navigate }"
        >
          <div
            class="nav-item no-drag"
            :class="{ active: isActive }"
            @click="navigate"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span v-if="expanded" class="nav-text">{{ item.title }}</span>
          </div>
        </router-link>
      </template>
    </div>

    <!-- 展开/折叠按钮 -->
    <div class="toggle-expand no-drag" @click="expanded = !expanded">
      <el-icon>
        <arrow-right v-if="!expanded" />
        <arrow-left v-else />
      </el-icon>
    </div>

    <!-- 底部菜单 -->
    <div class="nav-footer">
      <div class="nav-item no-drag" @click="handleSettingsClick">
        <el-icon><Setting /></el-icon>
        <span v-if="expanded" class="nav-text">{{ t("common.settings") }}</span>
      </div>
    </div>

    <!-- 设置对话框 -->
    <settings-dialog v-model="showSettingsDialog" />
  </draggable-container>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useUserStore } from "@/store/user";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import {
  ChatDotSquare,
  Setting,
  UserFilled,
  Stopwatch,
  Document,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
} from "@element-plus/icons-vue";
import { getImageUrl, DEFAULT_AVATAR, DEFAULT_SHOP_AVATAR } from "@/utils";
import SettingsDialog from "@/components/settings/SettingsDialog.vue";
import DraggableContainer from "@/components/base/DraggableContainer.vue";
import type { Component } from "vue";

const { t } = useI18n();
const userStore = useUserStore();
const route = useRoute();
const showSettingsDialog = ref(false);
const expanded = ref(false);

// 跟踪展开的子菜单
const expandedSubmenus = ref<string[]>([]);

// 定义导航项类型接口
interface NavItem {
  name: string;
  title: string;
  icon: Component;
  path: string;
  children?: SubNavItem[];
}

interface SubNavItem {
  name: string;
  title: string;
  path: string;
  icon?: Component;
}

// 切换子菜单展开状态
const toggleSubmenu = (name: string) => {
  // 如果导航栏未展开，则先展开导航栏
  if (!expanded.value) {
    expanded.value = true;
    expandedSubmenus.value = [name]; // 直接设置当前子菜单为展开状态
    return;
  }

  // 导航栏已展开，则切换子菜单展开状态
  if (expandedSubmenus.value.includes(name)) {
    expandedSubmenus.value = expandedSubmenus.value.filter(
      (item) => item !== name
    );
  } else {
    expandedSubmenus.value.push(name);
  }
};

// 检查父菜单是否激活
const isParentActive = (item: NavItem) => {
  return (
    item.children?.some((child) => route.path.startsWith(child.path)) || false
  );
};

// 导航配置
const navItems = computed((): NavItem[] => {
  const items: NavItem[] = [
    {
      name: "chat",
      title: t("common.chat"),
      icon: ChatDotSquare,
      path: "/chat",
    },
    {
      name: "contacts",
      title: t("common.contacts"),
      icon: UserFilled,
      path: "/contacts",
    },
    {
      name: "circle",
      title: t("common.circle"),
      icon: Stopwatch,
      path: "/circle",
    },
  ];

  // 根据用户类型添加订单导航项
  const isShop = userStore.currentUser?.operatorType === "shop";

  if (isShop) {
    // 商家用户：添加订单菜单项和子菜单
    items.push({
      name: "order",
      title: t("common.order"),
      icon: Document,
      path: "/order",
      children: [
        {
          name: "myOrders",
          title: t("order.myOrders"),
          path: "/order/my",
        },
        {
          name: "customerOrders",
          title: t("order.customerOrders"),
          path: "/order/customer",
        },
      ],
    });
  } else {
    // 普通用户：只添加我的订单
    items.push({
      name: "myOrders",
      title: t("order.myOrders"),
      icon: Document,
      path: "/order/my",
    });
  }

  return items;
});

const handleProfileClick = () => {
  // TODO: 处理个人资料点击
};

const handleSettingsClick = () => {
  showSettingsDialog.value = true;
};
</script>

<style lang="scss" scoped>
.side-nav {
  width: 65px;
  height: 100%;
  background-color: var(--el-color-primary-light-8);
  border-right: 1px solid var(--el-color-primary-light-8);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: width 0.3s;

  &.expanded {
    width: 200px;

    .nav-item {
      justify-content: flex-start;
      padding: 0 20px;

      .nav-text {
        display: block;
        margin-left: 12px;
      }
    }

    .arrow-icon {
      right: 12px;
      opacity: 1;
    }

    .submenu-item {
      padding: 0 20px 0 40px;
    }
  }

  .nav-header {
    margin: 16px 0 24px;

    .el-avatar {
      cursor: pointer;
      border: 1px solid transparent;
      transition: border-color 0.3s;

      &:hover {
        border-color: var(--el-color-primary);
      }
    }
  }

  .nav-menu {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .nav-footer {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .nav-item-with-children {
    width: 100%;
  }

  .nav-item {
    width: 100%;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;

    .el-icon {
      flex-shrink: 0;
      font-size: 24px;
      color: var(--el-text-color-secondary);
      transition: color 0.3s;
    }

    .nav-text {
      display: none;
      font-size: 14px;
      color: var(--el-text-color-regular);
      transition: color 0.3s;
      flex: 1;
    }

    &:hover {
      background-color: var(--el-fill-color-light);

      .el-icon {
        color: var(--el-text-color-primary);
      }

      .nav-text {
        color: var(--el-text-color-primary);
      }
    }

    &.active {
      background-color: var(--el-fill-color);

      > .el-icon:not(.arrow-icon) {
        color: var(--el-color-primary);
        transform: scale(1.2);
      }

      .nav-text {
        color: var(--el-color-primary);
        font-weight: 500;
      }
    }
  }

  .submenu {
    width: 100%;
    margin-top: 2px;
    margin-bottom: 4px;
  }

  .submenu-item {
    height: 40px;
    padding-left: 12px;
    margin-bottom: 2px;
  }

  .parent-item {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;

    &.active {
      background-color: var(--el-fill-color);
    }
  }

  .arrow-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%) !important;
    font-size: 12px;
    transition: all 0.3s;

    &.is-open {
      transform: translateY(-50%) rotate(180deg) !important;
    }
  }

  .toggle-expand {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 12px 0;
    cursor: pointer;
    transition: all 0.3s;
    background-color: var(--el-fill-color-light);

    &:hover {
      background-color: var(--el-color-primary-light-7);

      .el-icon {
        color: var(--el-color-primary);
      }
    }

    .el-icon {
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
