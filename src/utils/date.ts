export function formatDate(timestamp: string): string {
  const date = new Date(parseInt(timestamp));
  return date.toLocaleString();
}

export function formatISODate(isoString: string): string {
  const date = new Date(isoString);
  return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD
}

// 格式化日期 YYYY/MM/DD HH:mm:ss
export const formatDateStr = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
};
