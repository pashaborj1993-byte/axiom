import { cn } from "@/lib/cn";

export const QUILL_MOODS = ["greet", "idle", "think", "cheer", "oops", "wilt"] as const;
export type QuillMood = (typeof QUILL_MOODS)[number];

export function Quill({
  mood = "idle",
  className,
  label,
}: {
  mood?: QuillMood;
  className?: string;
  label?: string;
}) {
  return (
    <img
      src={`/quill/${mood}.png`}
      alt={label ?? ""}
      draggable={false}
      className={cn("pointer-events-none w-auto select-none object-contain", className)}
    />
  );
}
