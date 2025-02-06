<template>
  <div class="message-input">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-tooltip content="表情" placement="top">
        <el-button
          class="tool-btn"
          :icon="Face"
          @click="showEmojiPicker = true"
        />
      </el-tooltip>
      
      <el-tooltip content="图片" placement="top">
        <el-button
          class="tool-btn"
          :icon="Picture"
          @click="handleImageUpload"
        />
      </el-tooltip>
      
      <el-tooltip content="语音" placement="top">
        <el-button
          class="tool-btn"
          :icon="Microphone"
          @mousedown="startRecording"
          @mouseup="stopRecording"
          @mouseleave="cancelRecording"
        />
      </el-tooltip>
      
      <el-tooltip content="文件" placement="top">
        <el-button
          class="tool-btn"
          :icon="Document"
          @click="handleFileUpload"
        />
      </el-tooltip>
      
      <input
        ref="imageInputRef"
        type="file"
        accept="image/*"
        class="hidden-input"
        @change="onImageSelected"
      />
      
      <input
        ref="fileInputRef"
        type="file"
        class="hidden-input"
        @change="onFileSelected"
      />
    </div>
    
    <!-- 输入区域 -->
    <div class="input-area">
      <!-- 引用消息 -->
      <div v-if="replyTo" class="reply-box">
        <div class="reply-content">
          <span class="reply-sender">{{ replyTo.sender }}</span>
          <span class="reply-text">{{ getReplyPreview(replyTo) }}</span>
        </div>
        <el-button
          class="close-btn"
          :icon="Close"
          circle
          @click="cancelReply"
        />
      </div>
      
      <!-- 文本输入 -->
      <el-input
        v-model="content"
        type="textarea"
        :rows="3"
        :maxlength="2000"
        resize="none"
        placeholder="输入消息..."
        @keydown.enter.prevent="handleSend"
      />
      
      <!-- 表情选择器 -->
      <el-popover
        v-model:visible="showEmojiPicker"
        placement="top"
        :width="300"
        trigger="click"
      >
        <div class="emoji-picker">
          <div
            v-for="emoji in emojiList"
            :key="emoji"
            class="emoji-item"
            @click="insertEmoji(emoji)"
          >
            {{ emoji }}
          </div>
        </div>
      </el-popover>
    </div>
    
    <!-- 发送按钮 -->
    <div class="action-area">
      <el-button
        type="primary"
        :disabled="!canSend"
        @click="handleSend"
      >
        发送
      </el-button>
    </div>
    
    <!-- 录音状态 -->
    <div v-if="isRecording" class="recording-mask">
      <div class="recording-indicator">
        <el-icon class="recording-icon"><Microphone /></el-icon>
        <span>正在录音... {{ recordingDuration }}s</span>
        <span class="recording-tip">松开发送,移出取消</span>
      </div>
    </div>
    
    <!-- 上传进度 -->
    <el-dialog
      v-model="showProgress"
      title="上传中"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      width="300px"
    >
      <el-progress
        :percentage="uploadProgress"
        :format="(p) => p.toFixed(0) + '%'"
        status="success"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Face,
  Picture,
  Microphone,
  Document,
  Close,
} from '@element-plus/icons-vue'
import type { Message } from '@/types'
import { ElMessage } from 'element-plus'
import { StorageService } from '@/services/firebase/storage'
import { VoiceRecorder } from '@/utils/recorder'

const props = defineProps<{
  replyTo?: {
    id: string
    sender: string
    content: string
    type: string
  }
}>()

const emit = defineEmits<{
  (e: 'send', content: string, type: string): void
  (e: 'reply-cancel'): void
}>()

// 状态
const content = ref('')
const showEmojiPicker = ref(false)
const isRecording = ref(false)
const recordingDuration = ref(0)
const recordingTimer = ref<NodeJS.Timer>()
const imageInputRef = ref<HTMLInputElement>()
const fileInputRef = ref<HTMLInputElement>()

// 服务实例
const storage = new StorageService()
const recorder = new VoiceRecorder()

// 上传进度
const uploadProgress = ref(0)
const showProgress = ref(false)

// 计算属性
const canSend = computed(() => content.value.trim().length > 0)

// 表情列表
const emojiList = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
  '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
]

// 插入表情
const insertEmoji = (emoji: string) => {
  content.value += emoji
  showEmojiPicker.value = false
}

// 发送消息
const handleSend = () => {
  if (!canSend.value) return
  
  emit('send', content.value, 'text')
  content.value = ''
}

// 取消回复
const cancelReply = () => {
  emit('reply-cancel')
}

// 获取回复预览
const getReplyPreview = (message: { content: string; type: string }) => {
  switch (message.type) {
    case 'text':
      return message.content
    case 'image':
      return '[图片]'
    case 'voice':
      return '[语音]'
    case 'video':
      return '[视频]'
    case 'file':
      return '[文件]'
    case 'location':
      return '[位置]'
    default:
      return '[未知消息]'
  }
}

// 图片上传
const handleImageUpload = () => {
  imageInputRef.value?.click()
}

const onImageSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  
  const file = input.files[0]
  showProgress.value = true
  
  try {
    const imageUrl = await storage.uploadImage(file, (progress) => {
      uploadProgress.value = progress
    })
    emit('send', imageUrl, 'image')
  } catch (error) {
    console.error('Failed to upload image:', error)
    ElMessage.error('图片上传失败')
  } finally {
    showProgress.value = false
    uploadProgress.value = 0
    input.value = ''
  }
}

// 文件上传
const handleFileUpload = () => {
  fileInputRef.value?.click()
}

const onFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  
  const file = input.files[0]
  showProgress.value = true
  
  try {
    const fileData = await storage.uploadFile(file, (progress) => {
      uploadProgress.value = progress
    })
    emit('send', JSON.stringify(fileData), 'file')
  } catch (error) {
    console.error('Failed to upload file:', error)
    ElMessage.error('文件上传失败')
  } finally {
    showProgress.value = false
    uploadProgress.value = 0
    input.value = ''
  }
}

// 录音相关
const startRecording = async () => {
  try {
    await recorder.start()
    isRecording.value = true
    recordingDuration.value = 0
    recordingTimer.value = setInterval(() => {
      recordingDuration.value++
    }, 1000)
  } catch (error) {
    console.error('Failed to start recording:', error)
    ElMessage.error('无法开始录音')
  }
}

const stopRecording = async () => {
  if (!isRecording.value) return
  
  clearInterval(recordingTimer.value)
  isRecording.value = false
  
  try {
    const audioBlob = await recorder.stop()
    showProgress.value = true
    
    const audioData = await storage.uploadVoice(audioBlob, recordingDuration.value, (progress) => {
      uploadProgress.value = progress
    })
    emit('send', JSON.stringify(audioData), 'voice')
  } catch (error) {
    console.error('Failed to record voice:', error)
    ElMessage.error('录音失败')
  } finally {
    showProgress.value = false
    uploadProgress.value = 0
  }
}

const cancelRecording = () => {
  if (!isRecording.value) return
  
  clearInterval(recordingTimer.value)
  isRecording.value = false
  recorder.cancel()
}
</script>

<style lang="scss" scoped>
.message-input {
  position: relative;
  padding: var(--spacing-medium);
  border-top: 1px solid var(--border-base);
  background-color: var(--bg-lighter);
  
  .toolbar {
    display: flex;
    gap: var(--spacing-small);
    margin-bottom: var(--spacing-small);
    
    .tool-btn {
      padding: var(--spacing-mini);
      color: var(--text-regular);
      
      &:hover {
        color: var(--color-primary);
      }
    }
  }
  
  .input-area {
    position: relative;
    margin-bottom: var(--spacing-small);
    
    .reply-box {
      display: flex;
      align-items: center;
      padding: var(--spacing-small);
      margin-bottom: var(--spacing-small);
      background-color: var(--bg-base);
      border-radius: var(--radius-base);
      
      .reply-content {
        flex: 1;
        margin-right: var(--spacing-small);
        
        .reply-sender {
          color: var(--color-primary);
          margin-right: var(--spacing-small);
        }
        
        .reply-text {
          color: var(--text-regular);
        }
      }
      
      .close-btn {
        padding: 2px;
      }
    }
    
    .emoji-picker {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: var(--spacing-small);
      padding: var(--spacing-small);
      
      .emoji-item {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 30px;
        height: 30px;
        cursor: pointer;
        transition: transform 0.2s;
        
        &:hover {
          transform: scale(1.2);
        }
      }
    }
  }
  
  .action-area {
    display: flex;
    justify-content: flex-end;
  }
  
  .hidden-input {
    display: none;
  }
  
  .recording-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.5);
    
    .recording-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: white;
      
      .recording-icon {
        font-size: 40px;
        margin-bottom: var(--spacing-small);
        animation: pulse 1s infinite;
      }
      
      .recording-tip {
        margin-top: var(--spacing-small);
        font-size: 12px;
        opacity: 0.8;
      }
    }
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style> 