import api from "./auth";
import type {
  CreateContactParams,
  UpdateContactParams,
  CreateGroupParams,
  UpdateGroupParams,
  ContactListResponse,
  ContactGroupListResponse,
  ContactResponse,
  ContactGroupResponse,
  User,
  Business,
  ApiResponse,
} from "@/types";

// 获取联系人列表
export const getContacts = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ContactListResponse> => {
  const response = await api.get<ContactListResponse>("/contacts/", { params });
  return response.data;
};

// 创建联系人
export const createContact = async (
  data: CreateContactParams
): Promise<ApiResponse<ContactResponse>> => {
  const response = await api.post<ApiResponse<ContactResponse>>(
    "/contacts/",
    data
  );
  return response.data;
};

// 更新联系人
export const updateContact = async (
  id: string,
  data: UpdateContactParams
): Promise<ApiResponse<ContactResponse>> => {
  const response = await api.patch<ApiResponse<ContactResponse>>(
    `/contacts/${id}`,
    data
  );
  return response.data;
};

// 删除联系人
export const deleteContact = async (id: string): Promise<ApiResponse<null>> => {
  const response = await api.delete<ApiResponse<null>>(`/contacts/${id}`);
  return response.data;
};

// 获取联系人分组列表
export const getContactGroups = async (): Promise<ContactGroupListResponse> => {
  const response = await api.get<ContactGroupListResponse>("/contact-groups/");
  console.log("response.data", response.data);
  return response.data;
};

// 创建联系人分组
export const createContactGroup = async (
  data: CreateGroupParams
): Promise<ApiResponse<ContactGroupResponse>> => {
  const response = await api.post<ApiResponse<ContactGroupResponse>>(
    "/contact-groups/",
    data
  );
  return response.data;
};

// 更新联系人分组
export const updateContactGroup = async (
  id: string,
  data: UpdateGroupParams
): Promise<ApiResponse<ContactGroupResponse>> => {
  const response = await api.patch<ApiResponse<ContactGroupResponse>>(
    `/contact-groups/${id}`,
    data
  );
  return response.data;
};

// 删除联系人分组
export const deleteContactGroup = async (
  id: string
): Promise<ApiResponse<null>> => {
  const response = await api.delete<ApiResponse<null>>(`/contact-groups/${id}`);
  return response.data;
};

// 搜索用户
export const searchUsers = async (params: {
  keyword: string;
  type?: "user" | "shop" | "all";
  page?: number;
  limit?: number;
}): Promise<
  ApiResponse<{
    users: (User | Business)[];
    total: number;
  }>
> => {
  const response = await api.get("/operators/search", { params });
  return response.data;
};
