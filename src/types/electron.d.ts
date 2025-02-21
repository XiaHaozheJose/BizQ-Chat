interface ElectronAPI {
  database: {
    query: (sql: string, params: any[]) => Promise<any>;
    exec: (sql: string, params: any[]) => Promise<any>;
  };
  file: {
    save: (path: string, data: any) => Promise<boolean>;
    read: (path: string) => Promise<any>;
  };
  system: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
  openExternal: (url: string) => Promise<boolean>;
  navigation: {
    navigate: (url: string) => Promise<boolean>;
  };
}

interface Window {
  electronAPI?: ElectronAPI;
}
