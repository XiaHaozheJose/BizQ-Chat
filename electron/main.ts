import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  globalShortcut,
  screen,
  desktopCapturer,
} from "electron";
import { join } from "path";
import { get } from "https";

// 禁用Windows 7的GPU加速
if (process.platform === "win32") {
  app.disableHardwareAcceleration();
}

let mainWindow: BrowserWindow | null = null;
let screenshotWindow: BrowserWindow | null = null;

// 处理打开外部链接
ipcMain.handle("shell:openExternal", async (_, url: string) => {
  try {
    await shell.openExternal(url);
    return true;
  } catch (error) {
    console.error("Failed to open external URL:", error);
    return false;
  }
});

// 处理截图
ipcMain.handle("screenshot:start", async () => {
  try {
    // 获取主显示器
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;

    // 创建截图窗口
    screenshotWindow = new BrowserWindow({
      width,
      height,
      x: 0,
      y: 0,
      frame: false,
      transparent: true,
      fullscreen: true,
      webPreferences: {
        preload: join(__dirname, "../preload/index.js"),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // 加载截图页面
    const baseUrl = getBaseUrl();
    await screenshotWindow.loadURL(`${baseUrl}#/screenshot`);

    // 获取所有屏幕源
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width, height },
    });

    // 返回主显示器的截图数据
    const primarySource = sources.find(
      (source) => source.display_id === primaryDisplay.id.toString()
    );

    return {
      sourceId: primarySource?.id,
      width,
      height,
    };
  } catch (error) {
    console.error("Failed to start screenshot:", error);
    return null;
  }
});

// 完成截图
ipcMain.handle("screenshot:finish", async (_, imageData: string) => {
  if (screenshotWindow) {
    screenshotWindow.close();
    screenshotWindow = null;
  }
  return true;
});

// 取消截图
ipcMain.handle("screenshot:cancel", () => {
  if (screenshotWindow) {
    screenshotWindow.close();
    screenshotWindow = null;
  }
  return true;
});

// Handle file reading
ipcMain.handle("file:read", async (_, url: string) => {
  console.log("[Main] Reading file from URL:", url);

  return new Promise((resolve, reject) => {
    // For HTTPS URLs, use HTTPS module
    if (url.startsWith("https://")) {
      const chunks: Buffer[] = [];

      const request = get(
        url,
        {
          headers: {
            Accept: "audio/*",
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          },
        },
        (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`HTTP error! status: ${response.statusCode}`));
            return;
          }

          response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));

          response.on("end", () => {
            const buffer = Buffer.concat(chunks);
            console.log("[Main] File download complete, size:", buffer.length);
            resolve(buffer);
          });
        }
      );

      request.on("error", (error) => {
        console.error("[Main] File download error:", error);
        reject(error);
      });

      request.end();
    } else {
      reject(new Error("Only HTTPS URLs are supported"));
    }
  });
});

// 获取基础URL
function getBaseUrl(): string {
  // 开发环境使用Vite开发服务器
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:5173";
  }
  // 生产环境使用打包后的文件
  return "app://./index.html";
}

// 检查是否为外部URL
function isExternalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const baseUrl = getBaseUrl();
    const baseUrlObj = new URL(baseUrl);
    return urlObj.origin !== baseUrlObj.origin;
  } catch (error) {
    console.error("[Main] Invalid URL:", error);
    return false;
  }
}

// 创建主窗口
function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    titleBarStyle: "hidden",
    trafficLightPosition: { x: 5, y: 5 }, // Adjusted x position for more compact layout
    backgroundColor: "#ffffff", // 设置背景色,避免白闪
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow = win;

  // 处理导航请求
  win.webContents.on("will-navigate", (event, url) => {
    console.log("[Main] Navigation requested to:", url);

    // 如果是外部URL,阻止默认行为并在外部浏览器打开
    if (isExternalUrl(url)) {
      event.preventDefault();
      shell.openExternal(url);
      return;
    }

    // 如果是hash导航,让Vue Router处理
    if (url.includes("#")) {
      console.log("[Main] Allowing hash navigation");
      return;
    }

    // 如果是相对路径,让Vue Router处理
    if (!url.startsWith("http")) {
      console.log("[Main] Allowing relative path navigation");
      return;
    }

    // 其他情况,使用loadURL加载完整URL
    event.preventDefault();
    console.log("[Main] Loading URL:", url);
    win.loadURL(url).catch((error) => {
      console.error("[Main] Failed to load URL:", error);
    });
  });

  // 加载初始页面
  const baseUrl = getBaseUrl();
  console.log("[Main] Loading base URL:", baseUrl);
  win.loadURL(baseUrl).catch((error) => {
    console.error("[Main] Failed to load base URL:", error);
  });

  // 开发环境打开开发者工具
  if (process.env.NODE_ENV === "development") {
    win.webContents.openDevTools();
  }

  win.on("closed", () => {
    console.log("[Electron] Main window closed");
    mainWindow = null;
  });
}

// 处理窗口控制
ipcMain.handle("window:minimize", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});

ipcMain.handle("window:maximize", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.handle("window:close", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});

app.whenReady().then(() => {
  createWindow();

  // 注册截图快捷键
  globalShortcut.register("CommandOrControl+Alt+A", () => {
    if (mainWindow) {
      mainWindow.webContents.send("screenshot:trigger");
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 当所有窗口关闭时注销快捷键
app.on("window-all-closed", () => {
  globalShortcut.unregisterAll();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
