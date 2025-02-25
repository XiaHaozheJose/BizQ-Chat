import { contextBridge, ipcRenderer } from "electron";

// 暴露给渲染进程的API
const api = {
  navigation: {
    navigate: (url: string) => ipcRenderer.invoke("shell:openExternal", url),
  },
  file: {
    read: (url: string) => ipcRenderer.invoke("file:read", url),
  },
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    close: () => ipcRenderer.invoke("window:close"),
  },
};

// 将API暴露给渲染进程
contextBridge.exposeInMainWorld("electronAPI", api);

// TypeScript类型声明
declare global {
  interface Window {
    electronAPI: typeof api;
  }
}

export type ElectronAPI = typeof api;
