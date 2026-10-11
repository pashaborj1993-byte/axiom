import { Quill, type QuillMood } from "@/components/quill";
import { characterId, characterName } from "@/data/characters";
import { cn } from "@/lib/cn";
import { useProgress } from "@/lib/progress";

export function Companion({
  mood = "idle",
  className,
  label,
}: {
  mood?: QuillMood;
  className?: string;
  label?: string;
}) {
  const id = useProgress((state) => characterId(state.character));
  const name = characterName(id);
  if (id === "quill") {
    return <Quill mood={mood} className={cn("bob", className)} label={label ?? name} />;
  }
  const pose = mood === "cheer" ? "cheer" : mood === "oops" || mood === "wilt" ? "oops" : "idle";
  return (
    <img
      src={`/characters/${id}/${pose}.jpg`}
      alt={label ?? name}
      draggable={false}
      className={cn("bob pointer-events-none aspect-square rounded-full object-cover select-none", className)}
    />
  );
}
