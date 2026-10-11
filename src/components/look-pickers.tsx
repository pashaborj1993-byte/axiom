import { THEMES, themeId } from "@/data/themes";
import { LOCALES } from "@/i18n/messages";
import { useLocale, useT } from "@/i18n/use-t";
import { cn } from "@/lib/cn";
import { useProgress } from "@/lib/progress";

export function LanguagePicker() {
  const locale = useLocale();
  const setLocale = useProgress((state) => state.setLocale);
  const t = useT();
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{t("language")}</legend>
      <div className="mt-2 flex gap-2">
        {LOCALES.map((item) => {
          const selected = locale === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setLocale(item.id)}
              className={cn(
                "press h-11 flex-1 rounded-xl text-sm font-semibold",
                selected ? "bg-pine text-paper" : "surface-card",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

const THEME_KEY = {
  lagoon: "themeLagoon",
  sunrise: "themeSunrise",
  berry: "themeBerry",
  grove: "themeGrove",
  dusk: "themeDusk",
} as const;

export function ThemePicker() {
  const theme = useProgress((state) => themeId(state.theme));
  const setTheme = useProgress((state) => state.setTheme);
  const t = useT();
  return (
    <fieldset className="mt-6">
      <legend className="text-sm font-semibold">{t("theme")}</legend>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {THEMES.map((item) => {
          const selected = theme === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              aria-label={t(THEME_KEY[item.id])}
              onClick={() => setTheme(item.id)}
              className={cn("press flex flex-col items-center gap-1 rounded-xl px-1 py-2", selected && "bg-pine-soft")}
            >
              <span className="size-8 rounded-full" style={{ background: item.swatch }} />
              <span className="text-[11px] font-semibold">{t(THEME_KEY[item.id])}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
