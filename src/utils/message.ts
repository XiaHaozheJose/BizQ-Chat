import type { ProductMessageContent } from "@/types/chat";

/**
 * 解析产品消息内容
 * @param content 消息内容字符串
 * @returns 解析后的产品消息内容
 */
export const parseProductMessageContent = (
  content: string
): ProductMessageContent => {
  const [shopId, productIdsStr] = content.split("$");
  const productsIds = productIdsStr ? productIdsStr.split(",") : [];

  return {
    shopId,
    productsIds,
  };
};
