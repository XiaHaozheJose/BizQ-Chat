export function formatDate(timestamp: string): string {
  const date = new Date(parseInt(timestamp));
  return date.toLocaleString();
}

export function formatISODate(isoString: string): string {
  const date = new Date(isoString);
  return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD
}
