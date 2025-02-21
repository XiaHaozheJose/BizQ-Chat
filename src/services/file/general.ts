import { BaseFileService, type FileServiceConfig } from "./base";

export class GeneralFileService extends BaseFileService {
  protected db: IDBDatabase | null = null;
  protected dbName: string = "";
  protected storeName: string = "";

  async initialize(config: FileServiceConfig): Promise<void> {
    this.userId = config.userId;
    this.dbName = config.dbName || `files_${this.userId}`;
    this.storeName = config.storeName || "general_files";

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          // Store additional metadata along with the file
          db.createObjectStore(this.storeName, { keyPath: "path" });
        }
      };
    });
  }

  protected async saveFile(path: string, blob: Blob): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      const fileData = {
        path,
        blob,
        size: blob.size,
        type: blob.type,
        lastModified: new Date().toISOString(),
        userId: this.userId,
      };

      const request = store.put(fileData);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getFile(path: string): Promise<Blob | null> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(path);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const fileData = request.result;
        resolve(fileData ? fileData.blob : null);
      };
    });
  }

  async getFileInfo(
    path: string
  ): Promise<{ size: number; type: string; lastModified: string } | null> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(path);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const fileData = request.result;
        if (!fileData) return resolve(null);

        const { size, type, lastModified } = fileData;
        resolve({ size, type, lastModified });
      };
    });
  }

  async clearFile(path: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(path);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearAllFiles(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}
