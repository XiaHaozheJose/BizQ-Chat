import { getImageUrl, getNormalImageUrl } from ".";

export const getAvatarUrl = (
  url: string | undefined,
  size: "small" | "medium" | "origin" = "medium",
  isShop: boolean = false
) => {
  return getImageUrl(url, size, isShop);
};

export const getNullAvatarUrl = (
  url: string | undefined,
  size: "small" | "medium" | "origin" = "medium"
) => {
  return getNormalImageUrl(url, size);
};
