import { initializeApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";
import { firebaseConfig } from "./config";

class FirebaseService {
  private static instance: FirebaseService;
  private app;
  private database: Database;

  private constructor() {
    // 初始化 Firebase
    this.app = initializeApp(firebaseConfig);
    // 获取 Realtime Database 实例
    this.database = getDatabase(this.app);
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  public getDatabase(): Database {
    return this.database;
  }

  public getApp() {
    return this.app;
  }
}

// 导出单例实例
export const firebaseService = FirebaseService.getInstance();
export const database = firebaseService.getDatabase();
export const app = firebaseService.getApp();
