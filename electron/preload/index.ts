import { contextBridge, ipcRenderer } from "electron";

// 暴露给渲染进程的API
contextBridge.exposeInMainWorld("electronAPI", {
  // 数据库操作
  database: {
    query: (sql: string, params: any[]) =>
      ipcRenderer.invoke("database:query", sql, params),
    exec: (sql: string, params: any[]) =>
      ipcRenderer.invoke("database:exec", sql, params),
  },

  // 文件操作
  file: {
    save: (path: string, data: any) =>
      ipcRenderer.invoke("file:save", path, data),
    read: (path: string) => ipcRenderer.invoke("file:read", path),
  },

  // 系统操作
  system: {
    minimize: () => ipcRenderer.send("window:minimize"),
    maximize: () => ipcRenderer.send("window:maximize"),
    close: () => ipcRenderer.send("window:close"),
  },

  // 浏览器操作
  openExternal: (url: string) => ipcRenderer.invoke("shell:openExternal", url),

  // 导航操作
  navigation: {
    navigate: (url: string) => ipcRenderer.invoke("window:navigate", url),
  },
});
