import { localeId, MESSAGES, type Locale, type MessageKey } from "@/i18n/messages";
import { useProgress } from "@/lib/progress";

export function useLocale(): Locale {
  return useProgress((state) => localeId(state.locale));
}

export function useT() {
  const locale = useLocale();
  return (key: MessageKey) => MESSAGES[locale][key];
}
