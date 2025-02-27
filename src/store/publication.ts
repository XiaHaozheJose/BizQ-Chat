import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { publicationApi } from "@/services/api/publication";
import { Publication, PublicationQueryParams, BusinessType } from "@/types";
import { PublicType } from "@/types/publications";
import { useUserStore } from "./user";
import { getCurrentPosition } from "@/utils";

export const usePublicationStore = defineStore("publication", () => {
  const publications = ref<Publication[]>([]);
  const loading = ref(false);
  const hasMore = ref(true);
  const currentPage = ref(0);
  const pageSize = 10;

  const userStore = useUserStore();

  // 根据用户类型获取商家类型
  const shopTypes = computed<BusinessType[]>(() => {
    if (userStore.currentUser?.operatorType === "user") {
      return [
        BusinessType.Retailer,
        BusinessType.Wholesaler,
        BusinessType.Manufacturer,
      ];
    }
    return [BusinessType.Wholesaler, BusinessType.Manufacturer];
  });

  // 加载动态圈数据
  const loadPublications = async (
    type: "nearby" | "followed" | "public",
    refresh = false
  ) => {
    if (loading.value || (!refresh && !hasMore.value)) return;

    try {
      loading.value = true;

      if (refresh) {
        currentPage.value = 0;
        publications.value = [];
      }

      const params: PublicationQueryParams = {
        limit: pageSize,
        skip: currentPage.value * pageSize,
        showInPlatform: true,
        onlyPublication: true,
        publicType: PublicType.Public,
        shopType: shopTypes.value,
      };

      // 根据类型添加额外参数
      if (type === "nearby") {
        const position = await getCurrentPosition();
        Object.assign(params, {
          lat: position.latitude,
          lon: position.longitude,
          sort: ["updatedAt_desc", "distance_asc"],
        });
      } else if (type === "followed") {
        Object.assign(params, {
          followed: true,
          following: true,
        });
      } else {
        Object.assign(params, {
          followed: true,
        });
      }

      const { data: response } = await (type === "nearby"
        ? publicationApi.getNearbyPublications(params)
        : type === "followed"
          ? publicationApi.getFollowedPublications(params)
          : publicationApi.getPublicPublications(params));

      publications.value = refresh
        ? response.publications
        : [...publications.value, ...response.publications];

      hasMore.value = response.publications.length === pageSize;
      currentPage.value++;
    } catch (error) {
      console.error("Failed to load publications:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 点赞/取消点赞
  const likePublication = async (publicationId: string) => {
    try {
      const { data } = await publicationApi.likePublication({ publicationId });

      // 更新本地状态
      const index = publications.value.findIndex((p) => p.id === publicationId);
      if (index !== -1) {
        const publication = publications.value[index];
        const isLiked = publication.likes?.some(
          (like) => like.operatorId === userStore.currentUser?.id
        );

        // 创建新的数组以确保响应式
        const newPublications = [...publications.value];
        const newPublication = { ...publication };

        if (isLiked) {
          // 取消点赞
          newPublication.likeCount = Math.max(
            0,
            (newPublication.likeCount || 1) - 1
          );
          newPublication.likes = newPublication.likes?.filter(
            (like) => like.operatorId !== userStore.currentUser?.id
          );
        } else {
          // 添加点赞
          newPublication.likeCount = (newPublication.likeCount || 0) + 1;
          newPublication.likes = [
            ...(newPublication.likes || []),
            {
              operatorId: userStore.currentUser?.id,
              operatorType: userStore.currentUser?.operatorType,
              publicationId,
              type: "like",
              createdAt: new Date().toISOString(),
            },
          ];
        }

        // 更新整个数组以触发响应式更新
        newPublications[index] = newPublication;
        publications.value = newPublications;
      }

      return data;
    } catch (error) {
      console.error("Failed to like publication:", error);
      throw error;
    }
  };

  // 发表评论
  const commentPublication = async (data: {
    publicationId: string;
    content: string;
    publicationActivityId?: string;
  }) => {
    try {
      const response = await publicationApi.commentPublication(data);

      // 更新本地状态
      const index = publications.value.findIndex(
        (p) => p.id === data.publicationId
      );
      if (index !== -1) {
        const publication = publications.value[index];
        publication.commentCount = (publication.commentCount || 0) + 1;
        publication.comments = [
          ...(publication.comments || []),
          {
            ...response.data,
            operator: userStore.currentUser,
            operatorId: userStore.currentUser?.id,
            operatorType: userStore.currentUser?.operatorType,
            content: data.content,
            createdAt: new Date().toISOString(),
          },
        ];
      }

      return response.data;
    } catch (error) {
      console.error("Failed to comment publication:", error);
      throw error;
    }
  };

  // 删除评论
  const deleteComment = async (data: { publicationActivityId: string }) => {
    try {
      await publicationApi.deleteComment(data);

      // 更新本地状态
      const publicationIndex = publications.value.findIndex((p) =>
        p.comments?.some((c) => c._id === data.publicationActivityId)
      );

      if (publicationIndex !== -1) {
        const publication = publications.value[publicationIndex];
        publication.commentCount = (publication.commentCount || 0) - 1;
        publication.comments = publication.comments?.filter(
          (c) => c._id !== data.publicationActivityId
        );
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
      throw error;
    }
  };

  return {
    publications,
    loading,
    hasMore,
    loadPublications,
    likePublication,
    commentPublication,
    deleteComment,
  };
});
