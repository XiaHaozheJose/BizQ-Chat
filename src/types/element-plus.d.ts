declare module "element-plus" {
  import type { FormInstance, FormRules } from "element-plus";
  export { FormInstance, FormRules };
  import type { Component } from "vue";

  export const ElMessage: {
    success(message: string): void;
    warning(message: string): void;
    info(message: string): void;
    error(message: string): void;
  };

  export const ElMessageBox: {
    confirm(
      message: string,
      title: string,
      options?: {
        type?: "success" | "warning" | "info" | "error";
        confirmButtonText?: string;
        cancelButtonText?: string;
        confirmButtonClass?: string;
        cancelButtonClass?: string;
        showCancelButton?: boolean;
        closeOnClickModal?: boolean;
        closeOnPressEscape?: boolean;
        showClose?: boolean;
      }
    ): Promise<void>;
    alert(message: string, title: string, options?: any): Promise<void>;
    prompt(message: string, title: string, options?: any): Promise<string>;
  };
}

declare module "@element-plus/icons-vue" {
  import type { Component } from "vue";
  export const User: Component;
  export const Lock: Component;
  export const View: Component;
  export const Hide: Component;
  export const Iphone: Component;
  export const ArrowDown: Component;
  export const Search: Component;
  export const More: Component;
  export const Close: Component;
  export const Picture: Component;
  export const Document: Component;
  export const ChatDotRound: Component;
  export const Warning: Component;
  export const Folder: Component;
}

declare module "element-plus/dist/locale/zh-cn.mjs" {
  const zhCn: {
    name: string;
    el: {
      [key: string]: any;
    };
  };
  export default zhCn;
}
