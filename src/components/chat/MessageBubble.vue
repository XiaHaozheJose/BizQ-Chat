<template>
  <div class="message-bubble" :class="{ 'is-self': isSelf }">
    <div class="bubble-content">
      <!-- 文本消息 -->
      <template v-if="message.type === 'text'">
        {{ message.content }}
      </template>
      
      <!-- 图片消息 -->
      <template v-else-if="message.type === 'image'">
        <el-image
          :src="message.content"
          :preview-src-list="[message.content]"
          fit="cover"
          class="image-content"
        >
          <template #placeholder>
            <div class="image-placeholder">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
          <template #error>
            <div class="image-error">
              <el-icon><CircleClose /></el-icon>
            </div>
          </template>
        </el-image>
      </template>
      
      <!-- 语音消息 -->
      <template v-else-if="message.type === 'voice'">
        <div class="voice-content" @click="handlePlayVoice">
          <el-icon><Microphone /></el-icon>
          <span>{{ getDuration(message.content) }}"</span>
        </div>
      </template>
      
      <!-- 视频消息 -->
      <template v-else-if="message.type === 'video'">
        <video
          class="video-content"
          controls
          :src="message.content"
        />
      </template>
      
      <!-- 文件消息 -->
      <template v-else-if="message.type === 'file'">
        <div class="file-content" @click="handleDownloadFile">
          <el-icon><Document /></el-icon>
          <span>{{ getFileName(message.content) }}</span>
        </div>
      </template>
      
      <!-- 位置消息 -->
      <template v-else-if="message.type === 'location'">
        <div class="location-content">
          <el-icon><Location /></el-icon>
          <span>{{ message.content }}</span>
        </div>
      </template>
      
      <!-- 引用消息 -->
      <template v-if="message.referenceMessageId">
        <div class="reference-content">
          <div class="reference-info">
            <span class="reference-sender">{{ message.referenceMessageSender }}</span>
            <span class="reference-type">{{ getReferenceType(message.referenceMessageType) }}</span>
          </div>
          <div class="reference-text">{{ message.referenceMessageContent }}</div>
        </div>
      </template>
    </div>
    
    <!-- 消息状态 -->
    <div class="message-status" v-if="isSelf">
      <el-icon v-if="message.status === 'sending'" class="sending">
        <Loading />
      </el-icon>
      <el-icon v-else-if="message.status === 'failed'" class="failed">
        <Warning />
      </el-icon>
      <el-icon v-else-if="message.status === 'sent'" class="sent">
        <Check />
      </el-icon>
      <el-icon v-else-if="message.status === 'received'" class="received">
        <Select />
      </el-icon>
      <el-icon v-else-if="message.status === 'read'" class="read">
        <Finished />
      </el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Picture, CircleClose, Microphone, Document, Location, Loading, Warning, Check, Select, Finished } from '@element-plus/icons-vue'
import type { Message } from '@/types'

defineProps<{
  message: Message
  isSelf: boolean
}>()

// 获取语音时长
const getDuration = (content: string) => {
  try {
    const data = JSON.parse(content)
    return Math.ceil(data.duration)
  } catch {
    return 0
  }
}

// 获取文件名
const getFileName = (content: string) => {
  try {
    const data = JSON.parse(content)
    return data.name
  } catch {
    return '未知文件'
  }
}

// 获取引用消息类型
const getReferenceType = (type?: string) => {
  if (!type) return ''
  
  switch (type) {
    case 'text':
      return '文本消息'
    case 'image':
      return '图片'
    case 'voice':
      return '语音'
    case 'video':
      return '视频'
    case 'file':
      return '文件'
    case 'location':
      return '位置'
    default:
      return '未知类型'
  }
}

// 播放语音
const handlePlayVoice = () => {
  try {
    const data = JSON.parse(message.content)
    const audio = new Audio(data.url)
    audio.play()
  } catch {
    console.error('播放语音失败')
  }
}

// 下载文件
const handleDownloadFile = () => {
  try {
    const data = JSON.parse(message.content)
    window.open(data.url)
  } catch {
    console.error('下载文件失败')
  }
}
</script>

<style lang="scss" scoped>
.message-bubble {
  position: relative;
  max-width: 60%;
  
  .bubble-content {
    padding: var(--spacing-medium);
    background-color: var(--bg-base);
    border-radius: var(--border-radius);
    word-break: break-all;
    
    &.is-self {
      background-color: var(--color-primary);
      color: #fff;
    }
    
    .image-content {
      max-width: 200px;
      max-height: 200px;
      border-radius: var(--border-radius);
      overflow: hidden;
      cursor: pointer;
    }
    
    .image-placeholder,
    .image-error {
      width: 200px;
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-base);
      color: var(--text-secondary);
      font-size: 24px;
    }
    
    .voice-content {
      display: flex;
      align-items: center;
      cursor: pointer;
      
      .el-icon {
        margin-right: var(--spacing-small);
      }
    }
    
    .video-content {
      max-width: 300px;
      max-height: 200px;
      border-radius: var(--border-radius);
    }
    
    .file-content {
      display: flex;
      align-items: center;
      cursor: pointer;
      
      .el-icon {
        margin-right: var(--spacing-small);
      }
    }
    
    .location-content {
      display: flex;
      align-items: center;
      
      .el-icon {
        margin-right: var(--spacing-small);
      }
    }
    
    .reference-content {
      margin-top: var(--spacing-small);
      padding-top: var(--spacing-small);
      border-top: 1px solid var(--border-color);
      font-size: 12px;
      
      .reference-info {
        margin-bottom: 4px;
        color: var(--text-secondary);
        
        .reference-sender {
          margin-right: var(--spacing-small);
        }
      }
      
      .reference-text {
        color: var(--text-regular);
      }
    }
  }
  
  .message-status {
    position: absolute;
    right: -20px;
    bottom: 0;
    font-size: 14px;
    
    .el-icon {
      &.sending {
        animation: rotate 1s linear infinite;
      }
      
      &.failed {
        color: var(--color-danger);
      }
      
      &.sent {
        color: var(--text-secondary);
      }
      
      &.received {
        color: var(--text-regular);
      }
      
      &.read {
        color: var(--color-success);
      }
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 