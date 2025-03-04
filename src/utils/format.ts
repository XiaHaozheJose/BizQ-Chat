import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import i18n from "@/i18n";
import { watch } from "vue";

// 导入所有支持的语言包
import "dayjs/locale/zh-cn";
import "dayjs/locale/en";
import "dayjs/locale/es";
import "dayjs/locale/pt";
import "dayjs/locale/fr";

// 配置dayjs
dayjs.extend(relativeTime);

// 语言映射
const localeMap: Record<string, string> = {
  "zh-CN": "zh-cn",
  "en-US": "en",
  "es-ES": "es",
  "pt-PT": "pt",
  "fr-FR": "fr",
};

// 设置dayjs的语言
const setDayjsLocale = () => {
  const currentLocale = i18n.global.locale.value;
  const dayjsLocale = localeMap[currentLocale] || "en";
  dayjs.locale(dayjsLocale);
};

// 初始设置语言
setDayjsLocale();

// 监听i18n语言变化
watch(
  () => i18n.global.locale.value,
  () => {
    setDayjsLocale();
  }
);

/**
 * 格式化时间为相对时间
 * @param time 时间字符串
 * @returns 相对时间字符串
 */
export const formatTime = (time: string): string => {
  return dayjs(time).fromNow();
};

/**
 * 格式化距离
 * @param distance 距离（米）
 * @returns 格式化后的距离字符串
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  }
  return `${(distance / 1000).toFixed(1)}km`;
};

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
