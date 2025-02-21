import { defineStore } from "pinia";
import { ref } from "vue";
import { AudioService } from "@/services/audio";
import { useUserStore } from "@/store/user";

export const useAudioStore = defineStore("audio", () => {
  const currentAudio = ref<HTMLAudioElement | null>(null);
  const isPlaying = ref(false);
  const currentTime = ref(0);
  const duration = ref(0);
  const currentMessageId = ref<string | null>(null);
  const audioService = AudioService.getInstance();
  const userStore = useUserStore();

  // 添加初始化方法
  const initialize = async () => {
    if (!userStore.currentUser?.id) {
      throw new Error("User not logged in");
    }
    await audioService.initialize(userStore.currentUser.id);
  };

  // 停止当前播放的音频
  const stopCurrentAudio = () => {
    if (currentAudio.value) {
      currentAudio.value.pause();
      currentAudio.value.currentTime = 0;
      currentAudio.value = null;
      isPlaying.value = false;
      currentTime.value = 0;
      duration.value = 0;
      currentMessageId.value = null;
    }
  };

  // 播放音频
  const play = async (url: string, messageId: string, startTime?: number) => {
    try {
      // 如果是同一个音频,直接从新位置继续播放
      if (currentMessageId.value === messageId && currentAudio.value) {
        if (startTime !== undefined) {
          currentAudio.value.currentTime = startTime;
          currentTime.value = startTime;
        }
        await currentAudio.value.play();
        isPlaying.value = true;
        return;
      }

      // 否则停止当前音频,创建新的音频实例
      stopCurrentAudio();
      currentMessageId.value = messageId;

      const audioUrl = await audioService.downloadAndSave(url);
      if (!audioUrl) throw new Error("Failed to load audio file");

      const audio = new Audio(audioUrl);

      // 等待加载元数据
      await new Promise((resolve) => {
        audio.addEventListener(
          "loadedmetadata",
          () => {
            duration.value = audio.duration;
            if (startTime !== undefined) {
              audio.currentTime = startTime;
              currentTime.value = startTime;
            }
            resolve(null);
          },
          { once: true }
        );
      });

      currentAudio.value = audio;

      // 添加 timeupdate 监听
      const updateTime = () => {
        if (audio && !audio.paused) {
          // 确保 currentTime 不超过 duration
          currentTime.value = Math.min(audio.currentTime, audio.duration);
        }
      };

      // 先移除可能存在的旧监听器
      if (currentAudio.value) {
        currentAudio.value.removeEventListener("timeupdate", updateTime);
      }
      audio.addEventListener("timeupdate", updateTime);

      // 播放结束时的处理
      const handleEnded = () => {
        try {
          isPlaying.value = false;
          currentTime.value = 0;
          if (audio) {
            audio.currentTime = 0;
          }
        } catch (error) {
          console.error("Error handling audio end:", error);
        }
      };

      // 错误处理
      const handleError = (error: Event) => {
        console.error("Audio playback error:", error);
        cleanup();
      };

      // 清理函数
      const cleanup = () => {
        try {
          audio.removeEventListener("timeupdate", updateTime);
          audio.removeEventListener("ended", handleEnded);
          audio.removeEventListener("error", handleError);
          isPlaying.value = false;
          currentTime.value = 0;
        } catch (error) {
          console.error("Error during cleanup:", error);
        }
      };

      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("error", handleError);

      // 开始播放
      await audio.play();
      isPlaying.value = true;
    } catch (error) {
      console.error("Failed to play audio:", error);
      currentMessageId.value = null;
      throw error;
    }
  };

  // 暂停音频
  const pause = () => {
    if (currentAudio.value) {
      currentAudio.value.pause();
      isPlaying.value = false;
    }
  };

  // 跳转到指定时间
  const seekTo = async (time: number) => {
    if (!currentAudio.value) return;

    try {
      currentAudio.value.currentTime = time;
      currentTime.value = time;
    } catch (error) {
      console.error("Error seeking audio:", error);
    }
  };

  // 添加时间更新监听
  const onTimeUpdate = (callback: () => void) => {
    // 先移除可能存在的旧监听器
    if (currentAudio.value) {
      currentAudio.value.removeEventListener("timeupdate", callback);
      currentAudio.value.addEventListener("timeupdate", callback);
    }
  };

  // 移除时间更新监听
  const offTimeUpdate = (callback: () => void) => {
    if (currentAudio.value) {
      currentAudio.value.removeEventListener("timeupdate", callback);
    }
  };

  // 添加从指定时间恢复播放的方法
  const resumeFrom = async (time: number) => {
    if (!currentAudio.value) return;

    try {
      await seekTo(time);
      await currentAudio.value.play();
      isPlaying.value = true;
    } catch (error) {
      console.error("Error resuming audio:", error);
      isPlaying.value = false; // 确保播放失败时状态正确
      throw error;
    }
  };

  // 获取音频文件的Blob
  const getAudioBlob = async (url: string): Promise<Blob | null> => {
    try {
      const file = await audioService.downloadAndSave(url);
      const response = await fetch(file);
      return response.blob();
    } catch (error) {
      console.error("Failed to get audio blob:", error);
      return null;
    }
  };

  return {
    currentAudio,
    isPlaying,
    currentTime,
    duration,
    currentMessageId,
    initialize,
    play,
    pause,
    seekTo,
    onTimeUpdate,
    offTimeUpdate,
    resumeFrom,
    getAudioBlob,
  };
});
