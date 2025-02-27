import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";

// 配置dayjs
dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

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
