import api from "./auth";
import type { PublicationQueryParams, Publication } from "@/types";

export const publicationApi = {
  // 获取附近动态圈
  getNearbyPublications(params: PublicationQueryParams) {
    return api.get<{ publications: Publication[] }>("/publications", {
      params,
    });
  },

  // 获取关注圈
  getFollowedPublications(params: PublicationQueryParams) {
    return api.get<{ publications: Publication[] }>("/publications", {
      params,
    });
  },

  // 获取公开圈
  getPublicPublications(params: PublicationQueryParams) {
    return api.get<{ publications: Publication[] }>("/publications", {
      params,
    });
  },

  // 点赞/取消点赞
  //http://dev.bizq.com/backend/api/v1/publication-activities/
  /**{
	"publicationId": "678a797fa0eab9177db8926e",
	"type": "like"
} */
  likePublication(data: { publicationId: string }) {
    return api.post("/publication-activities", {
      ...data,
      type: "like",
    });
  },

  //评论 http://dev.bizq.com/backend/api/v1/publication-activities/
  /**{
  "publicationId" : "678a78c5a0eab9177db89085",
  "type" : "comment",
  "content" : "Que pasa",
  "publicationActivityId" : "67c07dc9071c8cd7e84d93b9"
}*/
  commentPublication(data: {
    content: string;
    publicationId: string;
    publicationActivityId?: string;
  }) {
    return api.post("/publication-activities", { ...data, type: "comment" });
  },

  // 删除评论 http://dev.bizq.com/backend/api/v1/publication-activities/67c07dec071c8cd7e84d93c7
  deleteComment(data: { publicationActivityId: string }) {
    return api.delete(`/publication-activities/${data.publicationActivityId}`);
  },
};
