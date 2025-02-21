<template>
  <div>
    <message-base
      :message="message"
      :sender-avatar="senderAvatar"
      :is-shop="isShop"
      :sender-name="senderName"
      @contextmenu="handleContextMenu"
    >
      <div class="audio-message">
        <!-- 时长显示移到左侧 -->
        <span class="duration"> {{ formatDuration }} </span>

        <!-- Progress bar container -->
        <div
          class="progress-bar"
          ref="progressBarRef"
          @mousedown="startDragging"
          @mousemove="handleDrag"
          @mouseup="stopDragging"
          @mouseleave="stopDragging"
          @click="handleProgressClick"
        >
          <el-progress
            :percentage="progress"
            :show-text="false"
            :stroke-width="4"
            class="audio-progress"
          />
        </div>

        <!-- 播放按钮移到右侧 -->
        <div
          class="play-button"
          :class="{ 'is-playing': isCurrentPlaying }"
          @click="handlePlayAudio"
        >
          <el-icon class="play-icon" :class="{ 'el-icon-loading': isLoading }">
            <component :is="playButtonIcon" />
          </el-icon>
        </div>
      </div>

      <!-- 语音转写文本 -->
      <div v-if="showVoiceText && message.voiceText" class="voice-text">
        {{ message.voiceText }}
      </div>
    </message-base>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import MessageBase from "./MessageBase.vue";
import type { Message } from "@/types";
import { VideoPlay, VideoPause, Loading } from "@element-plus/icons-vue";
import { useAudioStore } from "@/store/audio";
import { useContextMenuStore } from "@/store/contextMenu";
import { transcribe } from "@/services/api/transcribe";

const props = defineProps<{
  message: Message;
  senderAvatar?: string;
  isShop?: boolean;
  senderName?: string;
}>();

const audioStore = useAudioStore();
const contextMenuStore = useContextMenuStore();
const progressBarRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const progress = ref(0);

// 添加加载状态
const isLoading = ref(false);

// 添加一个变量记录拖动前的播放状态
const wasPlayingBeforeDrag = ref(false);

// 是否显示语音转写文本
const showVoiceText = ref(false);

// 格式化时长显示
const formatDuration = computed(() => {
  const duration = props.message.recorderTime || 0;
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
});

// 添加计算属性判断是否是当前播放的消息
const isCurrentPlaying = computed(() => {
  return (
    audioStore.isPlaying && audioStore.currentMessageId === props.message.id
  );
});

// 添加计算属性来决定播放按钮图标
const playButtonIcon = computed(() => {
  if (isLoading.value) {
    return Loading;
  }
  return isCurrentPlaying.value ? VideoPause : VideoPlay;
});

// 修改拖动开始处理
const startDragging = (e: MouseEvent) => {
  isDragging.value = true;
  // 记录当前播放状态
  wasPlayingBeforeDrag.value = isCurrentPlaying.value;
  // 如果正在播放,先暂停
  if (isCurrentPlaying.value) {
    audioStore.pause();
  }
  // 立即更新进度
  requestAnimationFrame(() => updateProgress(e));
};

// 处理拖动过程
const handleDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;
  requestAnimationFrame(() => updateProgress(e));
};

// 更新进度
const updateProgress = (e: MouseEvent) => {
  if (!progressBarRef.value) return;
  const rect = progressBarRef.value.getBoundingClientRect();
  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
  const width = rect.width;
  // 使用更精确的计算
  progress.value = parseFloat(((x / width) * 100).toFixed(2));
};

// 修改拖动结束处理
const stopDragging = async () => {
  if (!isDragging.value) return;

  try {
    isDragging.value = false;

    if (audioStore.currentAudio) {
      const newTime = (audioStore.duration * progress.value) / 100;

      if (wasPlayingBeforeDrag.value) {
        await audioStore.resumeFrom(newTime);
        // 立即开始更新进度
        updateProgressFromAudio();
      } else {
        await audioStore.seekTo(newTime);
      }
    }
  } catch (error) {
    console.error("Error handling drag stop:", error);
  } finally {
    wasPlayingBeforeDrag.value = false;
  }
};

// 修改进度条更新函数
const updateProgressFromAudio = () => {
  if (!audioStore.duration) return;

  const updateFrame = () => {
    if (
      audioStore.isPlaying &&
      audioStore.currentMessageId === props.message.id
    ) {
      // 使用更精确的计算方式
      progress.value = parseFloat(
        ((audioStore.currentTime / audioStore.duration) * 100).toFixed(2)
      );
      requestAnimationFrame(updateFrame);
    }
  };

  requestAnimationFrame(updateFrame);
};

// 修改点击处理函数
const handleProgressClick = async (e: MouseEvent) => {
  if (!progressBarRef.value || !audioStore.duration) return;
  try {
    const rect = progressBarRef.value.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const width = rect.width;
    const newProgress = parseFloat(((x / width) * 100).toFixed(2));
    const newTime = (audioStore.duration * newProgress) / 100;

    // 更新进度
    progress.value = newProgress;

    // 如果是当前正在播放的音频
    if (audioStore.currentMessageId === props.message.id) {
      if (audioStore.isPlaying) {
        await audioStore.seekTo(newTime);
        // 立即开始更新进度
        updateProgressFromAudio();
      } else {
        await audioStore.resumeFrom(newTime);
        // 立即开始更新进度
        updateProgressFromAudio();
      }
    } else {
      // 如果是新的音频
      await audioStore.play(props.message.content, props.message.id, newTime);
      // 立即开始更新进度
      updateProgressFromAudio();
    }
  } catch (error) {
    console.error("Error handling progress click:", error);
  }
};

const resetProgress = () => {
  progress.value = 0;
};

// 修改播放控制
const handlePlayAudio = async () => {
  try {
    if (isCurrentPlaying.value) {
      audioStore.pause();
    } else {
      isLoading.value = true;
      // 如果是已经播放过的音频,从当前位置继续播放
      if (audioStore.currentMessageId === props.message.id) {
        await audioStore.resumeFrom(audioStore.currentTime);
      } else {
        await audioStore.play(props.message.content, props.message.id);
      }
      // 添加进度更新监听器
      audioStore.onTimeUpdate(updateProgressFromAudio);
    }
  } catch (error) {
    console.error("Error handling play audio:", error);
  } finally {
    isLoading.value = false;
  }
};

// 处理语音转写
const handleTranscribe = async () => {
  try {
    isLoading.value = true;

    // 获取音频文件
    const audioBlob = await audioStore.getAudioBlob(props.message.content);
    if (!audioBlob) {
      throw new Error("Failed to get audio file");
    }

    // 创建File对象
    const file = new File([audioBlob], "audio.aac", { type: "audio/aac" });

    // 调用转写接口
    const response = await transcribe(file);
    console.log("Transcribe response:", response.data);
    console.log("Updated message:", props.message);

    // 触发更新消息事件
    window.dispatchEvent(
      new CustomEvent("message-update", {
        detail: {
          messageId: props.message.id,
          updates: { voiceText: response.data.text },
        },
      })
    );

    // 转写成功后自动显示文本
    showVoiceText.value = true;
  } catch (error) {
    console.error("Failed to transcribe audio:", error);
  } finally {
    isLoading.value = false;
  }
};

// 修改生命周期钩子
onMounted(() => {
  // 如果当前消息正在播放，添加监听器
  if (isCurrentPlaying.value) {
    audioStore.onTimeUpdate(updateProgressFromAudio);
  }

  // 监听转写事件
  window.addEventListener("message-transcribe", ((event: CustomEvent) => {
    if (event.detail.id === props.message.id) {
      handleTranscribe();
    }
  }) as EventListener);

  window.addEventListener("toggle-voice-text", ((event: CustomEvent) => {
    if (event.detail.id === props.message.id) {
      showVoiceText.value = !showVoiceText.value;
    }
  }) as EventListener);
});

// 修改播放状态监听
watch(isCurrentPlaying, (newValue) => {
  if (newValue) {
    // 开始播放时添加监听器
    audioStore.onTimeUpdate(updateProgressFromAudio);
    // 立即开始更新进度
    updateProgressFromAudio();
  } else {
    // 停止播放时移除监听器
    audioStore.offTimeUpdate(updateProgressFromAudio);
    resetProgress();
  }
});

onUnmounted(() => {
  // 移除监听器
  audioStore.offTimeUpdate(updateProgressFromAudio);
  window.removeEventListener("message-transcribe", ((event: CustomEvent) => {
    if (event.detail.id === props.message.id) {
      handleTranscribe();
    }
  }) as EventListener);
});

const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault();
  contextMenuStore.show(
    e.clientX,
    e.clientY,
    props.message,
    showVoiceText.value
  );
};
</script>

<style lang="scss" scoped>
.audio-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  width: 300px;
  justify-content: space-between;

  .audio-player {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .play-button {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--el-color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;

    &.is-playing {
      .play-icon {
        animation: rotate 1s linear infinite;
      }
    }

    .play-icon {
      font-size: 20px;
      color: white;
    }
  }

  .progress-bar {
    flex: 1;
    height: 24px;
    position: relative;
    cursor: pointer;
    display: flex;
    align-items: center;

    .audio-progress {
      width: 100%;
      position: relative;

      :deep(.el-progress-bar) {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 100%;
        height: 100%;

        .el-progress-bar__outer {
          background-color: var(--el-bg-color);
        }

        .el-progress-bar__inner {
          transition: width 0.1s ease;
        }
      }
    }
  }

  .duration {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    min-width: 45px;
  }

  .voice-text {
    margin-top: 8px;
    padding: 8px;
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
    font-size: 14px;
    line-height: 1.5;
    color: var(--el-text-color-primary);
    white-space: pre-wrap;
    word-break: break-word;
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
