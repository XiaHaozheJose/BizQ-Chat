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

interface ElectronAPI {
  navigation: Navigation;
  file: File;
  window: Window;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
