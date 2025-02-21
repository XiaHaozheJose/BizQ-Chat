import api from "./auth";

export const uploadFiles = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await api.post("/files/upload/multiple", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    baseURL: import.meta.env.VITE_FILE_BASE_URL,
  });

  // 返回文件的url数组
  return response.data;
};

// http://dev.bizq.com/file/api/v1/files/upload/single

export const uploadSingleFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/files/upload/single", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    baseURL: import.meta.env.VITE_FILE_BASE_URL,
  });

  return response.data.uri;
};
