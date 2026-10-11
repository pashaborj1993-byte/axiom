export const THEMES = [
  { id: "lagoon", swatch: "#0E8A78" },
  { id: "sunrise", swatch: "#E85D4C" },
  { id: "berry", swatch: "#C23B78" },
  { id: "grove", swatch: "#1B6B56" },
  { id: "dusk", swatch: "#7C6BF2" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export function themeId(value: unknown): ThemeId {
  if (value === "sunrise" || value === "berry" || value === "grove" || value === "dusk" || value === "lagoon") {
    return value;
  }
  return "lagoon";
}
