import { MD5 } from "crypto-js";

export async function generateMD5(input: string): Promise<string> {
  return MD5(input).toString();
}

export async function generateUnitConversationId(
  id1: string,
  id2: string
): Promise<string> {
  const sortedIds = [id1, id2].sort();
  const concatenatedIds = sortedIds.join("");
  return generateMD5(concatenatedIds);
}
