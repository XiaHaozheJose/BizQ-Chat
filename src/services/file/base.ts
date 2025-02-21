export interface FileServiceConfig {
  userId: string;
  dbName?: string;
  storeName?: string;
}

export interface FileService {
  initialize(config: FileServiceConfig): Promise<void>;
  downloadAndSave(
    url: string,
    fileName: string,
    onProgress?: (progress: number) => void
  ): Promise<{
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>;
  getFile(path: string): Promise<Blob | null>;
  clearFile(path: string): Promise<void>;
  clearAllFiles(): Promise<void>;
}

// Base implementation with common utilities
export abstract class BaseFileService implements FileService {
  protected userId: string = "";
  protected maxRetries: number = 3;
  protected abstract db: IDBDatabase | null;

  abstract initialize(config: FileServiceConfig): Promise<void>;
  abstract getFile(path: string): Promise<Blob | null>;
  abstract clearFile(path: string): Promise<void>;
  abstract clearAllFiles(): Promise<void>;

  // Extract file name from URL
  protected getFileNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split("/");
      const lastSegment = pathSegments[pathSegments.length - 1];
      // Remove any query parameters
      return lastSegment.split("?")[0];
    } catch (error) {
      console.error("Failed to parse URL:", error);
      return "unknown_file";
    }
  }

  // Common download implementation
  async downloadAndSave(
    url: string,
    fileName: string = "",
    onProgress?: (progress: number) => void,
    retryCount = 0
  ): Promise<{
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }> {
    try {
      // Get file name from URL if not provided
      const actualFileName = fileName || this.getFileNameFromUrl(url);
      console.log("[FileService] Attempting to get file:", actualFileName);

      // Try to get from local first
      const existing = await this.getFile(actualFileName);
      if (existing) {
        console.log("[FileService] File found in local storage:", {
          fileName: actualFileName,
          size: existing.size,
          type: existing.type,
        });
        onProgress?.(100);
        return {
          url: URL.createObjectURL(existing),
          fileName: actualFileName,
          fileSize: existing.size,
          mimeType:
            existing.type || this.getMimeTypeFromFileName(actualFileName),
        };
      }

      console.log(
        "[FileService] File not found locally, downloading from server..."
      );

      // Convert absolute URL to relative path for proxy
      let fetchUrl = url;
      try {
        const urlObj = new URL(url);
        fetchUrl = urlObj.pathname + urlObj.search;
      } catch (error) {
        console.warn("Failed to parse URL, using as is:", error);
      }

      // Download file with progress
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentLength = response.headers.get("content-length");
      const contentType =
        response.headers.get("content-type") ||
        this.getMimeTypeFromFileName(actualFileName);
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        loaded += value.length;

        if (total && onProgress) {
          onProgress((loaded / total) * 100);
        }
      }

      // Combine chunks into a single Uint8Array
      const chunksAll = new Uint8Array(loaded);
      let position = 0;
      for (const chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
      }

      // Convert to blob with proper MIME type
      const blob = new Blob([chunksAll], { type: contentType });

      // Save file and return URL
      await this.saveFile(actualFileName, blob);
      onProgress?.(100);
      return {
        url: URL.createObjectURL(blob),
        fileName: actualFileName,
        fileSize: blob.size,
        mimeType: contentType,
      };
    } catch (error) {
      console.error("Failed to download file:", error);

      // Retry logic
      if (retryCount < this.maxRetries) {
        console.log(
          `Retrying download (${retryCount + 1}/${this.maxRetries})...`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1))
        );
        return this.downloadAndSave(url, fileName, onProgress, retryCount + 1);
      }

      throw error;
    }
  }

  // Get MIME type from file extension
  protected getMimeTypeFromFileName(fileName: string): string {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      txt: "text/plain",
    };
    return mimeTypes[ext || ""] || "application/octet-stream";
  }

  protected abstract saveFile(path: string, blob: Blob): Promise<void>;
}
