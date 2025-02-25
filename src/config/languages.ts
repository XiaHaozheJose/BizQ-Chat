export interface Language {
  code: string;
  name: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "zh-CN", name: "简体中文" },
  { code: "en-US", name: "English" },
  { code: "es-ES", name: "Español" },
  { code: "pt-PT", name: "Português" },
  { code: "fr-FR", name: "Français" },
];

export const DEFAULT_LANGUAGE = "en-US";
