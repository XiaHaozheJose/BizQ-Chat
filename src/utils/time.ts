export const formatTime = (timestamp?: string | number): string => {
  if (!timestamp) return "";

  const date = new Date(
    typeof timestamp === "string" ? parseInt(timestamp) : timestamp
  );
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 一分钟内
  if (diff < 60 * 1000) {
    return "刚刚";
  }

  // 一小时内
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`;
  }

  // 今天内
  if (date.getDate() === now.getDate()) {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate()) {
    return `昨天 ${date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  // 一周内
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    return `${weekdays[date.getDay()]} ${date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  // 其他
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
