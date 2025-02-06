import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { app } from './config'
import { generateUUID } from '@/utils'

const storage = getStorage(app)

export class StorageService {
  // 上传图片
  async uploadImage(file: File, onProgress?: (progress: number) => void): Promise<string> {
    const ext = file.name.split('.').pop()
    const path = `images/${generateUUID()}.${ext}`
    const imageRef = storageRef(storage, path)
    
    const uploadTask = uploadBytesResumable(imageRef, file)
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          onProgress?.(progress)
        },
        (error) => {
          reject(error)
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref)
            resolve(url)
          } catch (error) {
            reject(error)
          }
        }
      )
    })
  }
  
  // 上传语音
  async uploadVoice(blob: Blob, duration: number, onProgress?: (progress: number) => void): Promise<{
    url: string
    duration: number
  }> {
    const path = `voice/${generateUUID()}.mp3`
    const voiceRef = storageRef(storage, path)
    
    const uploadTask = uploadBytesResumable(voiceRef, blob)
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          onProgress?.(progress)
        },
        (error) => {
          reject(error)
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref)
            resolve({
              url,
              duration,
            })
          } catch (error) {
            reject(error)
          }
        }
      )
    })
  }
  
  // 上传文件
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<{
    url: string
    name: string
    size: number
    type: string
  }> {
    const path = `files/${generateUUID()}-${file.name}`
    const fileRef = storageRef(storage, path)
    
    const uploadTask = uploadBytesResumable(fileRef, file)
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          onProgress?.(progress)
        },
        (error) => {
          reject(error)
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref)
            resolve({
              url,
              name: file.name,
              size: file.size,
              type: file.type,
            })
          } catch (error) {
            reject(error)
          }
        }
      )
    })
  }
} 