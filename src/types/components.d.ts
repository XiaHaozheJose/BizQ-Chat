declare module "@/components/chat/MessageContent.vue" {
  import { DefineComponent } from "vue";
  import { Message } from "@/types/chat";

  const MessageContent: DefineComponent<{
    message: Message;
  }>;

  export default MessageContent;
}

declare module "@/components/chat/EmojiPicker.vue" {
  import { DefineComponent } from "vue";

  const EmojiPicker: DefineComponent<
    {},
    {
      select: (emoji: string) => void;
    }
  >;

  export default EmojiPicker;
}
