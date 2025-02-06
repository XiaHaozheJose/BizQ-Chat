import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: 'https://bizq-dev-b5773-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'bizq-dev-b5773',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

// 初始化Firebase
const app = initializeApp(firebaseConfig)

// 获取Realtime Database实例
const database = getDatabase(app)

export { app, database } 