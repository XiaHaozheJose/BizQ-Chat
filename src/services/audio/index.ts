export class AudioService {
  private static instance: AudioService | undefined;
  private dbName = "audio_files";
  private storeName = "audio";
  private maxRetries = 3;
  private db: IDBDatabase | null = null;
  private isElectron = !!window.electronAPI;

  private constructor() {}

  public static getInstance(): AudioService {
    if (!this.instance) {
      this.instance = new AudioService();
    }
    return this.instance;
  }

  public static clearInstance(): void {
    if (this.instance) {
      if (this.instance.db) {
        this.instance.db.close();
        this.instance.db = null;
      }
      this.instance = undefined;
    }
  }

  async initialize(userId: string): Promise<void> {
    // Close existing database if any
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    this.dbName = `audio_${userId}`;
    console.log("[AudioService] Initializing database for user:", userId);
    await this.openDB();
  }

  private async openDB(): Promise<IDBDatabase> {
    console.log("[AudioService] Opening database:", this.dbName);

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        console.error("[AudioService] Database open error:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log("[AudioService] Database opened successfully");
        this.db = request.result;

        // Verify store exists
        if (!this.db.objectStoreNames.contains(this.storeName)) {
          console.log(
            "[AudioService] Store not found, closing and upgrading version"
          );
          const currentVersion = this.db.version;
          this.db.close();

          // Try to open with a new version to trigger onupgradeneeded
          const upgradeRequest = indexedDB.open(
            this.dbName,
            currentVersion + 1
          );

          upgradeRequest.onerror = () => {
            console.error(
              "[AudioService] Upgrade error:",
              upgradeRequest.error
            );
            reject(upgradeRequest.error);
          };

          upgradeRequest.onupgradeneeded = (event) => {
            console.log("[AudioService] Creating store during upgrade");
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(this.storeName)) {
              try {
                // Create store without keyPath
                db.createObjectStore(this.storeName);
                console.log("[AudioService] Store created successfully");
              } catch (error) {
                console.error("[AudioService] Store creation failed:", error);
                reject(error);
              }
            }
          };

          upgradeRequest.onsuccess = () => {
            console.log("[AudioService] Upgrade successful");
            this.db = upgradeRequest.result;
            resolve(this.db);
          };
        } else {
          resolve(this.db);
        }
      };

      request.onupgradeneeded = (event) => {
        console.log("[AudioService] Initial upgrade needed");
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          try {
            // Create store without keyPath
            db.createObjectStore(this.storeName);
            console.log("[AudioService] Store created in initial upgrade");
          } catch (error) {
            console.error(
              "[AudioService] Store creation failed in initial upgrade:",
              error
            );
            reject(error);
          }
        }
      };
    });
  }

  async downloadAndSave(url: string, retryCount = 0): Promise<string> {
    try {
      // Convert full URL to relative path
      const urlObj = new URL(url);
      const relativePath = urlObj.pathname;
      const fileName = relativePath.split("/").pop() || "";
      const localPath = fileName;

      console.log("[AudioService] Attempting to download audio:", {
        originalUrl: url,
        relativePath,
        fileName,
        localPath,
      });

      // Try to get from local cache first
      console.log("[AudioService] Checking local cache for:", localPath);
      const existing = await this.getAudioFile(localPath);
      if (existing) {
        console.log("[AudioService] Found audio in cache");
        return URL.createObjectURL(existing);
      }

      console.log("[AudioService] Audio not in cache, downloading from:", url);
      let blob: Blob;

      if (this.isElectron) {
        try {
          // Use Electron IPC for file download
          console.log("[AudioService] Using Electron IPC for download");
          const data = await window.electronAPI!.file.read(url);
          if (!data) {
            throw new Error("No data received from Electron IPC");
          }
          blob = new Blob([data], { type: "audio/aac" });
        } catch (error) {
          console.error("[AudioService] Electron IPC download failed:", error);
          // Fall back to web download method if IPC fails
          console.log("[AudioService] Falling back to web download method");
          const response = await fetch(url, {
            credentials: "include",
            headers: {
              Accept: "audio/*",
            },
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          blob = await response.blob();
        }
      } else {
        // Use proxy for web environment
        console.log("[AudioService] Using web proxy for download");
        // Ensure the path starts with /file/uploads
        const proxyPath = relativePath.startsWith("/file/uploads")
          ? relativePath
          : `/file/uploads${relativePath}`;

        console.log("[AudioService] Using proxy path:", proxyPath);
        const response = await fetch(proxyPath, {
          credentials: "include",
          headers: {
            Accept: "audio/*",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        blob = await response.blob();
      }

      // Verify blob is valid
      if (!(blob instanceof Blob) || blob.size === 0) {
        throw new Error("Invalid or empty blob received");
      }

      console.log("[AudioService] Download successful, blob size:", blob.size);

      // Save to IndexedDB
      console.log("[AudioService] Saving audio to IndexedDB:", localPath);
      await this.saveAudioFile(
        localPath,
        new Blob([blob], { type: blob.type || "audio/aac" })
      );
      console.log("[AudioService] Save successful");

      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("[AudioService] Failed to download audio:", error);

      // Retry logic
      if (retryCount < this.maxRetries) {
        console.log(
          `[AudioService] Retrying download (${retryCount + 1}/${this.maxRetries})...`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1))
        );
        return this.downloadAndSave(url, retryCount + 1);
      }

      throw error;
    }
  }

  private async getAudioFile(path: string): Promise<Blob | null> {
    console.log("[AudioService] Getting audio file:", path);

    try {
      const db = await this.openDB();
      console.log("[AudioService] Database opened, store:", this.storeName);

      return new Promise((resolve, reject) => {
        try {
          if (!db.objectStoreNames.contains(this.storeName)) {
            const error = new Error(`Store ${this.storeName} not found`);
            console.error("[AudioService] Store not found:", error);
            reject(error);
            return;
          }

          console.log("[AudioService] Starting transaction");
          const transaction = db.transaction([this.storeName], "readonly");
          const store = transaction.objectStore(this.storeName);

          console.log("[AudioService] Requesting file:", path);
          const request = store.get(path);

          request.onerror = () => {
            console.error("[AudioService] File get error:", request.error);
            reject(request.error);
          };

          request.onsuccess = () => {
            const result = request.result;
            console.log("[AudioService] File get result:", result);
            if (result instanceof Blob) {
              resolve(result);
            } else {
              resolve(null);
            }
          };
        } catch (error) {
          console.error("[AudioService] Error in getAudioFile:", error);
          reject(error);
        }
      });
    } catch (error) {
      console.error("[AudioService] Database open failed:", error);
      throw error;
    }
  }

  private async saveAudioFile(path: string, blob: Blob): Promise<void> {
    console.log("[AudioService] Saving audio file:", path);
    const db = await this.openDB();

    return new Promise<void>((resolve, reject) => {
      try {
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);

        console.log("[AudioService] Putting blob into store:", {
          path,
          size: blob.size,
        });
        const request = store.put(blob, path);

        request.onerror = () => {
          console.error("[AudioService] Save request error:", request.error);
          reject(request.error);
        };

        transaction.oncomplete = () => {
          console.log("[AudioService] Save transaction completed");
          resolve();
        };

        transaction.onerror = () => {
          console.error(
            "[AudioService] Save transaction error:",
            transaction.error
          );
          reject(transaction.error);
        };
      } catch (error) {
        console.error("[AudioService] Error in saveAudioFile:", error);
        reject(error);
      }
    });
  }

  // 清理指定路径的音频文件
  async clearAudioFile(path: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(path);

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  }

  // 清理所有音频文件
  async clearAllAudioFiles(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  }
}

export const audioService = AudioService.getInstance();
