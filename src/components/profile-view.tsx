import { tally } from "@/data/curriculum";
import { WorkspaceCard } from "@/components/workspace-card";
import { trackCopy, type Track } from "@/data/placement";
import { Companion } from "@/components/companion";
import { InstallCard } from "@/components/install-card";
import { CHARACTERS, characterId } from "@/data/characters";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { displayName } from "@/lib/format";
import { cn } from "@/lib/cn";
import { effectiveStreak, GOALS, type Goal, useProgress } from "@/lib/progress";

export function ProfileView({ onRetake }: { onRetake: () => void }) {
  const user = useCurrentUser();
  const name = useProgress((state) => state.name);
  const setName = useProgress((state) => state.setName);
  const goal = useProgress((state) => state.dailyGoal);
  const setGoal = useProgress((state) => state.setGoal);
  const sound = useProgress((state) => state.sound);
  const setSound = useProgress((state) => state.setSound);
  const xp = useProgress((state) => state.xp);
  const gems = useProgress((state) => state.gems);
  const shields = useProgress((state) => state.shields);
  const grace = useProgress((state) => state.grace);
  const level = useProgress((state) => state.level);
  const placementScore = useProgress((state) => state.placementScore);
  const placementTotal = useProgress((state) => state.placementTotal);
  const syncStatus = useProgress((state) => state.syncStatus);
  const streak = useProgress((state) =>
    effectiveStreak(state.streak, state.lastPracticeDate, state.shields),
  );
  const longest = useProgress((state) => state.longestStreak);
  const crowns = useProgress((state) => state.crowns);
  const placed = useProgress((state) => state.placed);
  const correct = useProgress((state) => state.correctCount);
  const attempts = useProgress((state) => state.attemptCount);
  const perfect = useProgress((state) => state.perfectLessons);
  const character = useProgress((state) => state.character);
  const setCharacter = useProgress((state) => state.setCharacter);
  const campaignCount = useProgress((state) => Object.keys(state.campaigns).length);
  const stats = tally({ crowns, placed });
  const accuracy = attempts === 0 ? 0 : Math.round((correct / attempts) * 100);
  const track = level ? trackCopy(level as Track) : null;

  return (
    <div className="px-4 pt-6 pb-10">
      <div className="flex items-end gap-3">
        <Companion mood={streak > 0 ? "cheer" : "idle"} className="h-24 shrink-0" />
        <div className="min-w-0 pb-1">
          <h1 className="font-serif text-3xl">{displayName(name)}</h1>
          <p className="mt-1 text-sm text-pretty text-muted">{quillNote(streak, stats.cleared, stats.total)}</p>
        </div>
      </div>
      <p className="mt-1 text-sm text-muted">
        {user?.primaryEmail ? user.primaryEmail : "Signed in"} · {syncLabel(syncStatus)}
      </p>
      {track ? (
        <p className="mt-3 text-sm">
          <span className="font-semibold">{track.title}</span>
          <span className="text-muted">
            {" "}
            · placement {placementScore}/{placementTotal || 8}
          </span>
        </p>
      ) : null}

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold">Who walks with you</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {CHARACTERS.map((item) => {
            const selected = characterId(character) === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setCharacter(item.id)}
                className={cn(
                  "press rounded-2xl px-3 py-3 text-left",
                  selected ? "bg-pine text-paper" : "surface-card",
                )}
              >
                <span className="block font-semibold">{item.name}</span>
                <span className={cn("mt-1 block text-xs text-pretty", selected ? "text-paper/80" : "text-muted")}>
                  {item.blurb}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <WorkspaceCard />

      <dl className="mt-6 grid grid-cols-2 gap-3">
        <Stat label="Total XP" value={String(xp)} />
        <Stat label="Gems" value={String(gems)} />
        <Stat label="Streak" value={streak === 1 ? "1 day" : `${streak} days`} />
        <Stat label="Best streak" value={longest === 1 ? "1 day" : `${longest} days`} />
        <Stat label="Accuracy" value={attempts === 0 ? "—" : `${accuracy}%`} />
        <Stat label="Lessons" value={`${stats.cleared}/${stats.total}`} />
        <Stat label="Crowns" value={`${stats.crownSum}/${stats.total * 3}`} />
        <Stat label="Shields" value={String(shields)} />
        <Stat label="Free passes" value={level === "beginner" ? String(grace) : "—"} />
        <Stat label="Campaigns" value={String(campaignCount)} />
        <Stat label="Perfect runs" value={String(perfect)} />
        <Stat label="Answered" value={String(attempts)} />
      </dl>

      <InstallCard />

      <div className="mt-8">
        <UserButton />
      </div>

      <label className="mt-8 block">
        <span className="text-sm font-semibold">Name on the path</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={24}
          className="surface-card mt-2 h-12 w-full rounded-xl px-4 outline-none focus-visible:ring-2 focus-visible:ring-pine"
        />
      </label>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold">Daily goal</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {GOALS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={goal === value}
              onClick={() => setGoal(value as Goal)}
              className={cn(
                "press h-12 rounded-xl text-sm font-semibold tabular-nums",
                goal === value ? "bg-pine text-paper" : "surface-card",
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="surface-card mt-6 flex items-center justify-between gap-4 rounded-2xl px-4 py-3">
        <div>
          <p className="font-semibold">Sound</p>
          <p className="text-sm text-muted">Soft tones on right and wrong answers.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={sound}
          onClick={() => setSound(!sound)}
          className={cn("press relative h-8 w-14 shrink-0 rounded-full", sound ? "bg-pine" : "bg-paper-deep")}
        >
          <span
            className={cn(
              "absolute top-1 size-6 rounded-full bg-surface transition-transform duration-150",
              sound ? "translate-x-7" : "translate-x-1",
            )}
          />
          <span className="sr-only">{sound ? "Sound on" : "Sound off"}</span>
        </button>
      </div>

      <section className="mt-8">
        <h2 className="font-serif text-xl">How a round works</h2>
        <ul className="mt-2 list-disc space-y-2 pl-4 text-sm text-pretty text-muted">
          <li>The placement quiz chooses a beginner, intermediate, or advanced start. Placed-out lessons stay on the map.</li>
          <li>Five hearts. A miss in a lesson costs one, unless a beginner free pass is left. One heart returns every 20 minutes.</li>
          <li>Chests and campaigns sit off the path. They do not spend hearts. Gems are awarded once per clear.</li>
          <li>A shield saves one missed day. Beginners start with one.</li>
          <li>Finish a lesson for a crown, up to three. A perfect replay raises it.</li>
        </ul>
      </section>

      <button
        type="button"
        onClick={onRetake}
        className="press mt-8 h-12 w-full rounded-xl text-sm font-semibold text-copper"
      >
        Retake placement
      </button>
      <p className="mt-2 text-center text-xs text-muted">
        Retaking replaces your path, crowns, and campaigns. Your account stays.
      </p>
    </div>
  );
}

function quillNote(streak: number, cleared: number, total: number) {
  if (total > 0 && cleared >= total) return "You cleared the path. Replay a node if you want another crown.";
  if (streak >= 7) return "A week of showing up. That’s the whole trick.";
  if (streak > 0) return "Keep the rounds short. The streak is the point.";
  return "One finished round starts the streak.";
}

function syncLabel(status: "idle" | "saving" | "saved" | "error") {
  if (status === "saving") return "Saving…";
  if (status === "error") return "Not saved yet";
  return "Saved to your account";
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card rounded-2xl px-4 py-3">
      <dt className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</dt>
      <dd className="mt-1 font-serif text-2xl tabular-nums">{value}</dd>
    </div>
  );
}