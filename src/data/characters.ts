export const CHARACTERS = [
  {
    id: "quill",
    name: "Quill",
    blurb: "A pine bird in a paper cap. The careful one.",
  },
  {
    id: "pip",
    name: "Pip",
    blurb: "A fox in the same cap. Faster, still asks for the source.",
  },
  {
    id: "lumen",
    name: "Lumen",
    blurb: "A moth with a lantern belly. Lights the claim, not the rumor.",
  },
  {
    id: "dot",
    name: "Dot",
    blurb: "A one-eyed pebble. Counts what would prove the answer wrong.",
  },
] as const;

export type CharacterId = (typeof CHARACTERS)[number]["id"];

export function characterId(value: unknown): CharacterId {
  if (value === "pip" || value === "lumen" || value === "dot" || value === "quill") return value;
  return "quill";
}

export function characterName(id: CharacterId) {
  return CHARACTERS.find((item) => item.id === id)?.name ?? "Quill";
}
