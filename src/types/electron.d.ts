interface Navigation {
  navigate: (url: string) => Promise<boolean>;
}

interface File {
  read: (url: string) => Promise<string>;
}

interface Window {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
}

interface Screenshot {
  start: () => Promise<{
    sourceId: string;
    width: number;
    height: number;
  } | null>;
  finish: (imageData: string) => Promise<boolean>;
  cancel: () => Promise<boolean>;
  onTrigger: (callback: () => void) => () => void;
}

interface ElectronAPI {
  navigation: Navigation;
  file: File;
  window: Window;
  screenshot: Screenshot;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
