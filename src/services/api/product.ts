import type { ProductsResponse, Product } from "@/types/product";
import api from "./auth";

/**
 * 获取产品列表
 * @param ids 产品ID数组
 * @returns 产品列表响应
 */
export const getProducts = async (ids: string[]): Promise<Product[]> => {
  try {
    const response = await api.get<ProductsResponse>("/products", {
      params: {
        _id: ids,
        populates: ["sku"],
      },
    });
    return response.data.products;
  } catch (error) {
    console.error("Failed to fetch products:", error);
    throw error;
  }
};

/**
 * 获取单个产品
 * @param id 产品ID
 * @returns 产品信息
 */
export const getProduct = async (id: string): Promise<Product | null> => {
  try {
    const products = await getProducts([id]);
    return products[0] || null;
  } catch (error) {
    console.error("Failed to fetch product:", error);
    throw error;
  }
};
