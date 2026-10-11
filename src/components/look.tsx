import { useEffect } from "react";
import { themeId } from "@/data/themes";
import { localeId } from "@/i18n/messages";
import { useProgress } from "@/lib/progress";

export function Look() {
  const locale = useProgress((state) => localeId(state.locale));
  const theme = useProgress((state) => themeId(state.theme));

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = locale === "fa" ? "rtl" : "ltr";
    root.dataset.theme = theme;
  }, [locale, theme]);

  return null;
}
