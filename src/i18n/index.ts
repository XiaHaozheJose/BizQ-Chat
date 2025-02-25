import { createI18n } from "vue-i18n";
import zhCN from "../locales/zh-CN";
import enUS from "../locales/en-US";
import esES from "../locales/es-ES";
import ptPT from "../locales/pt-PT";
import frFR from "../locales/fr-FR";
import { SUPPORTED_LANGUAGES } from "../config/languages";

const messages = {
  "zh-CN": zhCN,
  "en-US": enUS,
  "es-ES": esES,
  "pt-PT": ptPT,
  "fr-FR": frFR,
};

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem("language") || "en-US",
  fallbackLocale: "en-US",
  messages,
});

export default i18n;
