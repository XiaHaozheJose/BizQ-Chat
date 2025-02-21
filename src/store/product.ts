import { defineStore } from "pinia";
import { ref } from "vue";
import type { Product } from "@/types/product";
import { getProducts } from "@/services/api/product";

export const useProductStore = defineStore("product", () => {
  // 存储产品信息的Map
  const products = ref<Map<string, Product>>(new Map());

  // 获取产品信息
  const fetchProducts = async (ids: string[]): Promise<Product[]> => {
    // 过滤出未缓存的产品ID
    const missingIds = ids.filter((id) => !products.value.has(id));

    // 如果有未缓存的产品,则获取它们
    if (missingIds.length > 0) {
      try {
        const newProducts = await getProducts(missingIds);
        // 存储新获取的产品
        newProducts.forEach((product) => {
          products.value.set(product.id, product);
        });
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    }

    // 返回所有请求的产品
    return ids
      .map((id) => products.value.get(id))
      .filter((product): product is Product => !!product);
  };

  // 获取单个产品
  const getProduct = (id: string): Product | undefined => {
    return products.value.get(id);
  };

  // 清理指定产品的数据
  const clearProducts = (ids: string[]) => {
    ids.forEach((id) => {
      products.value.delete(id);
    });
  };

  // 清理所有产品数据
  const clearAllProducts = () => {
    products.value.clear();
  };

  return {
    products,
    fetchProducts,
    getProduct,
    clearProducts,
    clearAllProducts,
  };
});
