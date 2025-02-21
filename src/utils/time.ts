import i18n from "@/i18n";

export const formatTime = (timestamp?: string | number): string => {
  if (!timestamp) return "";

  const { t, locale } = i18n.global;
  const date = new Date(
    typeof timestamp === "string" ? parseInt(timestamp) : timestamp
  );
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 一分钟内
  if (diff < 60 * 1000) {
    return t("time.justNow");
  }

  // 一小时内
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return t("time.minutesAgo", { minutes });
  }

  // 今天内
  if (date.getDate() === now.getDate()) {
    return date.toLocaleTimeString(locale.value, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate()) {
    return (
      t("time.yesterday") +
      " " +
      date.toLocaleTimeString(locale.value, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );
  }

  // 一周内
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const weekdayKey = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][date.getDay()];
    return (
      t(`time.weekdays.${weekdayKey}`) +
      " " +
      date.toLocaleTimeString(locale.value, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );
  }

  // 其他
  return date.toLocaleDateString(locale.value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};
