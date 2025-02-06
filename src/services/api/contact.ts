import api from './auth'
import type {
  Contact,
  ContactGroup,
  CreateContactParams,
  UpdateContactParams,
  CreateGroupParams,
  UpdateGroupParams,
  ContactListResponse,
  ContactGroupListResponse,
  ContactResponse,
  ContactGroupResponse,
  ApiResponse,
} from '@/types'

// 获取联系人列表
export const getContacts = async (params?: {
  page?: number
  limit?: number
  search?: string
}): Promise<ApiResponse<ContactListResponse>> => {
  const response = await api.get<ApiResponse<ContactListResponse>>('/contacts/', { params })
  return response.data
}

// 创建联系人
export const createContact = async (data: CreateContactParams): Promise<ApiResponse<ContactResponse>> => {
  const response = await api.post<ApiResponse<ContactResponse>>('/contacts/', data)
  return response.data
}

// 更新联系人
export const updateContact = async (id: string, data: UpdateContactParams): Promise<ApiResponse<ContactResponse>> => {
  const response = await api.patch<ApiResponse<ContactResponse>>(`/contacts/${id}`, data)
  return response.data
}

// 删除联系人
export const deleteContact = async (id: string): Promise<ApiResponse<null>> => {
  const response = await api.delete<ApiResponse<null>>(`/contacts/${id}`)
  return response.data
}

// 获取联系人分组列表
export const getContactGroups = async (): Promise<ApiResponse<ContactGroupListResponse>> => {
  const response = await api.get<ApiResponse<ContactGroupListResponse>>('/contact-groups/')
  return response.data
}

// 创建联系人分组
export const createContactGroup = async (data: CreateGroupParams): Promise<ApiResponse<ContactGroupResponse>> => {
  const response = await api.post<ApiResponse<ContactGroupResponse>>('/contact-groups/', data)
  return response.data
}

// 更新联系人分组
export const updateContactGroup = async (id: string, data: UpdateGroupParams): Promise<ApiResponse<ContactGroupResponse>> => {
  const response = await api.patch<ApiResponse<ContactGroupResponse>>(`/contact-groups/${id}`, data)
  return response.data
}

// 删除联系人分组
export const deleteContactGroup = async (id: string): Promise<ApiResponse<null>> => {
  const response = await api.delete<ApiResponse<null>>(`/contact-groups/${id}`)
  return response.data
} 