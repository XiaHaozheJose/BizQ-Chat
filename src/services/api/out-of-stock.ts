import api from "./auth";
import { OutOfStockRequest } from "@/types/shipments";

export const submitOutOfStock = async (
  requestBody: OutOfStockRequest
): Promise<string> => {
  const response = await api.post("/shipments", requestBody);
  return response.data;
};
