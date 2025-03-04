import i18n from "@/i18n";

// 生成UUID
export const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16).toUpperCase();
  });
};

// 格式化时间
export const formatTime = (timestamp: string | number): string => {
  const { t, locale } = i18n.global;
  const date = new Date(Number(timestamp));
  const now = new Date();

  // 如果是今天
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(locale.value, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // 如果是昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return (
      t("time.yesterday") +
      " " +
      date.toLocaleTimeString(locale.value, {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }

  // 如果是今年
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(locale.value, {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // 其他情况
  return date.toLocaleDateString(locale.value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 防抖
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// 节流
export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      fn(...args);
      lastCall = now;
    }
  };
};

// 文件大小格式化
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 获取文件扩展名
export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
};

// 检查是否是图片文件
export const isImageFile = (filename: string): boolean => {
  const ext = getFileExtension(filename).toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
};

// 检查是否是视频文件
export const isVideoFile = (filename: string): boolean => {
  const ext = getFileExtension(filename).toLowerCase();
  return ["mp4", "webm", "ogg"].includes(ext);
};

// 检查是否是音频文件
export const isAudioFile = (filename: string): boolean => {
  const ext = getFileExtension(filename).toLowerCase();
  return ["mp3", "wav", "ogg"].includes(ext);
};

// 图片url添加后缀 -small.jpeg | -medium.jpeg | -origin.jpeg

export const addImageSuffix = (url: string, suffix: string): string => {
  // 检查URL是否已经有图片扩展名
  if (/\.(jpeg|jpg|png|gif|webp)$/.test(url)) {
    return url.replace(/\.(jpeg|jpg|png|gif|webp)$/, `-${suffix}.$1`);
  }
  // 如果没有扩展名,添加后缀和默认的.jpg扩展名
  return `${url}-${suffix}.jpeg`;
};

// 添加默认头像常量
export const DEFAULT_AVATAR =
  "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png";
export const DEFAULT_SHOP_AVATAR =
  "https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png";

// 默认占位图片, 不是头像默认图
export const DEFAULT_IMAGE =
  "https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png";

export const getImageUrl = (
  url: string | undefined,
  size: "small" | "medium" | "origin" = "medium",
  isShop: boolean = false
) => {
  // url 无效的情况, 比如是###的情况
  if (!url || url === "###") {
    return isShop ? DEFAULT_SHOP_AVATAR : DEFAULT_AVATAR;
  }
  return `${url}-${size}.jpeg`;
};

export const getNormalImageUrl = (
  url: string | undefined,
  size: "small" | "medium" | "origin" = "medium"
) => {
  // url 无效的情况, 比如是###的情况
  if (!url || url === "###") {
    return DEFAULT_IMAGE;
  }

  return `${url}-${size}.jpeg`;
};

// 获取当前位置
export const getCurrentPosition = async (): Promise<{
  latitude: number;
  longitude: number;
}> => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
};
