<template>
  <el-breadcrumb class="app-breadcrumb">
    <el-breadcrumb-item :to="{ path: '/' }">
      {{ t("common.home") }}
    </el-breadcrumb-item>
    <template v-for="(item, index) in breadcrumbs" :key="index">
      <el-breadcrumb-item :to="item.to" :replace="true">
        {{ item.title }}
      </el-breadcrumb-item>
    </template>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter, RouteLocationMatched } from "vue-router";
import { useI18n } from "vue-i18n";

const route = useRoute();
const { t } = useI18n();

interface Breadcrumb {
  title: string;
  to?: {
    path: string;
  };
}

// 计算面包屑数据
const breadcrumbs = computed(() => {
  const result: Breadcrumb[] = [];
  const matched = route.matched;

  matched.forEach((route: RouteLocationMatched) => {
    // 跳过根路由和不需要显示的路由
    if (route.path === "/" || route.meta?.hideBreadcrumb) {
      return;
    }

    // 添加面包屑项
    result.push({
      title: route.meta.title
        ? t(route.meta.title as string)
        : (route.name as string),
      to:
        route.path === matched[matched.length - 1].path
          ? undefined // 当前路由不可点击
          : { path: route.path },
    });
  });

  return result;
});
</script>

<style lang="scss" scoped>
.app-breadcrumb {
  padding: 16px 20px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
}
</style>
