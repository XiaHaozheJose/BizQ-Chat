import { defineStore } from "pinia";
import { ref } from "vue";
import type { Message } from "@/types";
import { MessageType } from "@/types";

export const useContextMenuStore = defineStore("contextMenu", () => {
  const visible = ref(false);
  const position = ref({ x: 0, y: 0 });
  const currentMessage = ref<Message | null>(null);

  // 是否显示语音转写文本
  const showVoiceText = ref(false);

  const show = (
    x: number,
    y: number,
    message: Message,
    isVoiceTextVisible?: boolean
  ) => {
    position.value = { x, y };
    currentMessage.value = message;
    visible.value = true;
    if (isVoiceTextVisible !== undefined) {
      showVoiceText.value = isVoiceTextVisible;
    }
  };

  const hide = () => {
    visible.value = false;
    currentMessage.value = null;
    // 重置语音转写文本显示状态
    showVoiceText.value = false;
  };

  // 切换语音转写文本显示状态
  const toggleVoiceText = () => {
    console.log("pre toggleVoiceText", showVoiceText.value);
    showVoiceText.value = !showVoiceText.value;
    console.log("after toggleVoiceText", showVoiceText.value);
  };

  // 切换语音文本并隐藏菜单,但不重置showVoiceText状态
  const toggleVoiceTextAndHideMenu = () => {
    toggleVoiceText();
    visible.value = false;
    currentMessage.value = null;
  };

  // 添加直接设置语音转写文本显示状态的方法
  const setVoiceTextVisible = (visible: boolean) => {
    showVoiceText.value = visible;
  };

  return {
    visible,
    position,
    currentMessage,
    showVoiceText,
    show,
    hide,
    toggleVoiceText,
    toggleVoiceTextAndHideMenu,
    setVoiceTextVisible,
  };
});
