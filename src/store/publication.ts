import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { publicationApi } from "@/services/api/publication";
import type { Publication, PublicationQueryParams, Comment } from "@/types";
import { BusinessType } from "@/types";
import { PublicType } from "@/types/publications";
import { useUserStore } from "./user";
import { getCurrentPosition } from "@/utils";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";

export const usePublicationStore = defineStore("publication", () => {
  const publications = ref<Publication[]>([]);
  const loading = ref(false);
  const hasMore = ref(true);
  const currentPage = ref(0);
  const pageSize = 10;

  const userStore = useUserStore();
  const { t } = useI18n();

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

  // Add this helper function to organize comments hierarchically
  const organizeComments = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: collect all comments in a map
    comments.forEach((comment) => {
      const commentId = comment.id || comment._id;
      if (commentId) {
        commentMap.set(commentId, { ...comment, replies: [] });
      }
    });

    // Second pass: organize into hierarchy
    comments.forEach((comment) => {
      const commentId = comment.id || comment._id;
      if (commentId) {
        if (comment.originComment?.id) {
          // This is a reply
          const parentComment = commentMap.get(comment.originComment.id);
          if (parentComment) {
            if (!parentComment.replies) {
              parentComment.replies = [];
            }
            parentComment.replies.push(commentMap.get(commentId)!);
          }
        } else {
          // This is a root comment
          rootComments.push(commentMap.get(commentId)!);
        }
      }
    });

    return JSON.parse(JSON.stringify(rootComments)); // Ensure complete reactivity
  };

  // Add this helper function to find and update a comment in the publication
  const findAndUpdateComment = (
    comments: Comment[],
    commentId: string,
    updateFn: (comment: Comment) => Comment
  ): Comment[] => {
    return comments.map((comment) => {
      const currentId = comment.id || comment._id;
      if (currentId === commentId) {
        return updateFn(comment);
      }
      if (comment.replies?.length) {
        return {
          ...comment,
          replies: findAndUpdateComment(comment.replies, commentId, updateFn),
        };
      }
      return comment;
    });
  };

  // 加载动态圈数据
  const loadPublications = async (
    type: "nearby" | "followed" | "public",
    refresh = false,
    searchText = ""
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

      // 添加搜索参数
      if (searchText) {
        params.search = searchText;
      }

      // 根据类型添加额外参数
      if (type === "nearby") {
        try {
          const position = await getCurrentPosition();
          Object.assign(params, {
            lat: position.latitude,
            lon: position.longitude,
            sort: ["updatedAt_desc", "distance_asc"],
          });
        } catch (error) {
          // 使用默认排序，不考虑距离
          Object.assign(params, {
            sort: ["updatedAt_desc"],
          });
          ElMessage.warning(t("circle.locationNotAvailable"));
        }
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

      const newPublications =
        response.publications?.map((pub) => ({
          ...pub,
          comments: pub.comments ? organizeComments(pub.comments) : [],
        })) ?? [];

      publications.value = refresh
        ? newPublications
        : [...publications.value, ...newPublications];

      // 使用接口返回的currentPageHasMoreData来判断是否还有更多数据
      hasMore.value = response.currentPageHasMoreData ?? false;
      currentPage.value++;
    } catch (error) {
      ElMessage.error(t("circle.loadFailed"));
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
      ElMessage.error(t("circle.likeFailed"));
      throw error;
    }
  };

  // 发表评论
  const commentPublication = async (data: {
    content: string;
    publicationId: string;
    publicationActivityId?: string;
  }) => {
    try {
      const response = await publicationApi.commentPublication(data);

      // Find the publication and update its comments
      const publicationIndex = publications.value.findIndex(
        (p) => p.id === data.publicationId
      );

      if (publicationIndex > -1) {
        const publication = { ...publications.value[publicationIndex] };
        const newComment = response.data as Comment;

        if (data.publicationActivityId) {
          // This is a reply
          const comments = [...(publication.comments || []), newComment];
          publication.comments = organizeComments(comments);
        } else {
          // This is a new root comment
          publication.comments = [
            ...(publication.comments || []),
            { ...newComment, replies: [] },
          ];
        }

        // Update comment count
        publication.commentCount = (publication.commentCount || 0) + 1;

        // Create a new array to trigger reactivity
        const newPublications = [...publications.value];
        newPublications[publicationIndex] = publication;
        publications.value = newPublications;
      }

      return response.data;
    } catch (error) {
      ElMessage.error(t("circle.commentFailed"));
      throw error;
    }
  };

  // 删除评论
  const deleteComment = async (data: { publicationActivityId: string }) => {
    try {
      await publicationApi.deleteComment(data);

      // Find and update the publication
      const publicationIndex = publications.value.findIndex((p) =>
        p.comments?.some(
          (c) =>
            c._id === data.publicationActivityId ||
            c.id === data.publicationActivityId ||
            c.replies?.some(
              (r) =>
                r._id === data.publicationActivityId ||
                r.id === data.publicationActivityId
            )
        )
      );

      if (publicationIndex > -1) {
        const publication = { ...publications.value[publicationIndex] };

        // Remove the comment and reorganize
        const allComments = (publication.comments || []).reduce(
          (acc, comment) => {
            if (
              comment._id !== data.publicationActivityId &&
              comment.id !== data.publicationActivityId
            ) {
              const replies = (comment.replies || []).filter(
                (r) =>
                  r._id !== data.publicationActivityId &&
                  r.id !== data.publicationActivityId
              );
              acc.push({ ...comment, replies });
            }
            return acc;
          },
          [] as Comment[]
        );

        publication.comments = allComments;
        publication.commentCount = Math.max(
          (publication.commentCount || 0) - 1,
          0
        );

        // Create a new array to trigger reactivity
        const newPublications = [...publications.value];
        newPublications[publicationIndex] = publication;
        publications.value = newPublications;
      }
    } catch (error) {
      ElMessage.error(t("circle.deleteCommentFailed"));
      throw error;
    }
  };

  // 获取所有评论
  const getComments = async (publicationId: string) => {
    try {
      const { data } = await publicationApi.getComments({ publicationId });

      // Find and update the publication
      const publicationIndex = publications.value.findIndex(
        (p) => p.id === publicationId
      );

      if (publicationIndex > -1) {
        // Create a deep copy of the publication
        const publication = JSON.parse(
          JSON.stringify(publications.value[publicationIndex])
        );

        // Organize comments and ensure we have a new array
        const organizedComments = organizeComments(
          data.publicationActivities || []
        );

        // Assign the organized comments to the publication
        publication.comments = organizedComments;

        // Create a new array with the updated publication
        const newPublications = [...publications.value];
        newPublications[publicationIndex] = publication;

        // Update the store
        publications.value = newPublications;
      }

      return data.publicationActivities;
    } catch (error) {
      ElMessage.error(t("circle.getCommentsFailed"));
      throw error;
    }
  };

  // 点赞评论
  const likeComment = async (data: {
    publicationActivityId: string;
    publicationId: string;
  }) => {
    try {
      await publicationApi.likeComment({
        publicationActivityId: data.publicationActivityId,
        publicationId: data.publicationId,
      });

      // Find and update the publication
      const publicationIndex = publications.value.findIndex(
        (p) => p.id === data.publicationId
      );

      if (publicationIndex > -1) {
        const publication = { ...publications.value[publicationIndex] };

        // Update the comment's like status
        publication.comments = findAndUpdateComment(
          publication.comments || [],
          data.publicationActivityId,
          (comment) => {
            if (comment.iLiked) {
              // Unlike
              return {
                ...comment,
                iLiked: false,
                likeCount: Math.max(0, (comment.likeCount || 1) - 1),
              };
            } else {
              // Like
              return {
                ...comment,
                iLiked: true,
                likeCount: (comment.likeCount || 0) + 1,
              };
            }
          }
        );

        // Create a new array to trigger reactivity
        const newPublications = [...publications.value];
        newPublications[publicationIndex] = publication;
        publications.value = newPublications;
      }
    } catch (error) {
      ElMessage.error(t("circle.likeCommentFailed"));
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
    getComments,
    likeComment,
  };
});
