import { contextBridge, ipcRenderer } from "electron";

// 导航相关API
const navigation = {
  navigate: (url: string) => ipcRenderer.invoke("shell:openExternal", url),
};

// 文件相关API
const file = {
  read: (url: string) => ipcRenderer.invoke("file:read", url),
};

// 窗口相关API
const window = {
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),
};

// 截图相关API
const screenshot = {
  start: () => ipcRenderer.invoke("screenshot:start"),
  finish: (imageData: string) =>
    ipcRenderer.invoke("screenshot:finish", imageData),
  cancel: () => ipcRenderer.invoke("screenshot:cancel"),
  onTrigger: (callback: () => void) => {
    ipcRenderer.on("screenshot:trigger", callback);
    return () => {
      ipcRenderer.removeListener("screenshot:trigger", callback);
    };
  },
};

// 暴露API给渲染进程
contextBridge.exposeInMainWorld("electronAPI", {
  navigation,
  file,
  window,
  screenshot,
});

// TypeScript类型声明
declare global {
  interface Window {
    electronAPI: typeof api;
  }
}

export type ElectronAPI = typeof api;
