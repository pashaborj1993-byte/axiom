import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ChevronDown, ChevronUp, Heart, X } from "lucide-react";
import { Companion } from "@/components/companion";
import { SponsorCard } from "@/components/sponsor-card";
import { characterName } from "@/data/characters";
import type { Exercise } from "@/data/types";
import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/format";
import type { Graded } from "@/lib/progress";
import { msUntilHeart, outOfLives, useProgress } from "@/lib/progress";
import { seededShuffle, shuffleOrder } from "@/lib/seed";
import { playComplete, playCorrect, playWrong } from "@/lib/sound";

export type RoundSummary = {
  heading: string;
  lede: string;
  xp: number;
  gems?: number;
  accuracy: number;
  foot?: string;
};

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function LessonPlayer({
  title,
  kicker,
  idea,
  spark,
  exercises,
  stakeHearts,
  onExit,
  onDrill,
  onFinished,
  onComplete,
}: {
  title: string;
  kicker: string;
  idea?: string;
  spark?: string;
  exercises: Exercise[];
  stakeHearts: boolean;
  onExit: () => void;
  onDrill?: () => void;
  onFinished?: () => void;
  onComplete: (graded: Graded[]) => RoundSummary;
}) {
  const hearts = useProgress((state) => state.hearts);
  const grace = useProgress((state) => state.grace);
  const level = useProgress((state) => state.level);
  const heartUpdatedAt = useProgress((state) => state.heartUpdatedAt);
  const now = useNow();
  const [screen, setScreen] = useState<"idea" | "play" | "done" | "hearts">(() => {
    if (stakeHearts && outOfLives(useProgress.getState())) return "hearts";
    return idea ? "idea" : "play";
  });
  const [leaving, setLeaving] = useState(false);
  const [index, setIndex] = useState(0);
  const [graded, setGraded] = useState<Graded[]>([]);
  const [summary, setSummary] = useState<RoundSummary | null>(null);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const locked = useRef(false);
  const exercise = exercises[index];
  const doneCount = screen === "done" || screen === "hearts" ? exercises.length : index;
  const pct = exercises.length === 0 ? 0 : (doneCount / exercises.length) * 100;

  function noteAnswer(correct: boolean) {
    setCombo((value) => {
      const next = correct ? value + 1 : 0;
      setBestCombo((best) => Math.max(best, next));
      return next;
    });
  }

  function miss() {
    if (!stakeHearts) return useProgress.getState().hearts;
    return useProgress.getState().loseHeart();
  }

  function finish(next: Graded[]) {
    if (locked.current) return;
    locked.current = true;
    setSummary(onComplete(next));
    setScreen("done");
    playComplete();
  }

  function handleDone(correct: boolean) {
    if (!exercise) return;
    const next = [...graded, { id: exercise.id, correct }];
    setGraded(next);
    const last = index + 1 >= exercises.length;
    if (last) {
      finish(next);
      return;
    }
    if (stakeHearts && outOfLives(useProgress.getState())) {
      for (const item of next) {
        if (!item.correct) useProgress.getState().noteMistake(item.id);
      }
      setScreen("hearts");
      return;
    }
    setIndex((value) => value + 1);
  }

  function giveUp() {
    if (exercise) useProgress.getState().noteMistake(exercise.id);
    for (const item of graded) {
      if (!item.correct) useProgress.getState().noteMistake(item.id);
    }
    setScreen("hearts");
  }

  function requestLeave() {
    if (screen === "done") {
      (onFinished ?? onExit)();
      return;
    }
    if (screen === "play") {
      setLeaving(true);
      return;
    }
    onExit();
  }

  return (
    <div className="phone-screen mx-auto flex h-dvh w-full max-w-lg flex-col bg-paper">
      <header className="flex shrink-0 items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={requestLeave}
          aria-label="Leave"
          className="press flex size-11 items-center justify-center rounded-full"
        >
          <X className="size-5" />
        </button>
        <div
          className="h-3 flex-1 overflow-hidden rounded-full bg-paper-deep"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={exercises.length}
          aria-valuenow={doneCount}
          aria-label="Lesson progress"
        >
          <div className="h-full rounded-full bg-pine" style={{ width: `${pct}%` }} />
        </div>
        <span className="flex items-center gap-1 text-sm font-semibold tabular-nums">
          <Heart
            className={cn("size-4", hearts > 0 ? "fill-copper text-copper" : "text-muted")}
            aria-hidden
          />
          <span className="sr-only">Hearts</span>
          {hearts}
          {combo >= 2 ? (
            <span className="ml-1 text-xs font-semibold text-pine tabular-nums">{combo} straight</span>
          ) : null}
          {level === "beginner" && grace > 0 ? (
            <span className="ml-1 text-xs font-semibold text-pine">{grace} free</span>
          ) : null}
        </span>
      </header>

      {screen === "idea" ? (
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
            <div className="flex items-start gap-4">
              <Companion mood="think" className="h-24 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-widest text-pine uppercase">{kicker}</p>
                <h1 className="mt-2 font-serif text-3xl leading-tight">{title}</h1>
              </div>
            </div>
            <p className="mt-4 text-lg text-pretty">{idea}</p>
            {spark ? (
              <p className="mt-4 rounded-2xl bg-pine-soft px-4 py-3 text-sm text-pretty">
                <span className="font-semibold text-pine">{characterName(useProgress.getState().character)}’s note. </span>
                {spark}
              </p>
            ) : null}
            {level === "beginner" && stakeHearts ? (
              <p className="mt-4 text-sm text-pretty text-muted">
                Beginner path: free passes are spent before hearts. You have {grace} left.
                Words for this unit live in the guidebook on the map.
              </p>
            ) : null}
          </div>
          <div className="pad-safe shrink-0 px-5 pt-3">
            <button
              type="button"
              onClick={() => setScreen("play")}
              className="press h-12 w-full rounded-xl bg-pine font-semibold text-paper"
            >
              Start
            </button>
          </div>
        </section>
      ) : null}

      {screen === "play" && exercise ? (
        <Question
          key={exercise.id}
          exercise={exercise}
          combo={combo}
          onMiss={miss}
          onAnswer={noteAnswer}
          onDone={handleDone}
          onGiveUp={giveUp}
        />
      ) : null}

      {screen === "done" && summary ? (
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
            <Companion
              mood={summary.accuracy >= 60 ? "cheer" : "oops"}
              className="h-36"
            />
            <p className="mt-2 text-xs font-semibold tracking-widest text-muted uppercase">
              {summary.accuracy}% accuracy
            </p>
            <h1 className="mt-4 font-serif text-4xl">{summary.heading}</h1>
            <p className="mt-2 text-pretty text-muted">{summary.lede}</p>
            <p className="mt-6 font-serif text-3xl text-pine tabular-nums">+{summary.xp} XP</p>
            {summary.gems ? (
              <p className="mt-1 text-sm font-semibold text-copper tabular-nums">+{summary.gems} gems</p>
            ) : null}
            {summary.foot ? <p className="mt-2 text-sm">{summary.foot}</p> : null}
            {bestCombo >= 3 ? (
              <p className="mt-3 text-sm font-semibold text-pine">{bestCombo} in a row</p>
            ) : null}
            <SponsorCard placement="lesson_end" />
          </div>
          <div className="pad-safe shrink-0 px-5 pt-3">
            <button
              type="button"
              onClick={onFinished ?? onExit}
              className="press h-12 w-full rounded-xl bg-pine font-semibold text-paper"
            >
              Continue
            </button>
          </div>
        </section>
      ) : null}

      {screen === "hearts" ? (
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
            <Companion mood="wilt" className="h-36" />
            <h1 className="mt-4 font-serif text-4xl">Out of hearts</h1>
            <p className="mt-3 max-w-sm text-pretty text-muted">
              This round stops here. One heart returns every 20 minutes, or a drill can earn one
              without risking more.
            </p>
            <p className="mt-4 font-semibold tabular-nums">
              {hearts > 0
                ? "A heart just came back."
                : `Next heart in ${formatClock(msUntilHeart(hearts, heartUpdatedAt, now))}`}
            </p>
            <SponsorCard placement="hearts" />
          </div>
          <div className="pad-safe grid shrink-0 gap-2 px-5 pt-3">
            {onDrill ? (
              <button
                type="button"
                onClick={onDrill}
                className="press h-12 rounded-xl bg-pine font-semibold text-paper"
              >
                Earn a heart
              </button>
            ) : null}
            <button type="button" onClick={onExit} className="press h-12 rounded-xl font-semibold">
              Back
            </button>
          </div>
        </section>
      ) : null}

      {leaving ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 px-4 pb-4" role="dialog" aria-modal="true" aria-labelledby="leave-title">
          <div className="surface-card w-full max-w-lg rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <Companion mood="oops" className="h-16 shrink-0" />
              <h2 id="leave-title" className="font-serif text-2xl">
                Leave this round?
              </h2>
            </div>
            <p className="mt-2 text-sm text-pretty text-muted">
              Hearts you already lost stay lost. This round will not count toward XP or your streak.
            </p>
            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={() => setLeaving(false)}
                className="press h-12 rounded-xl bg-pine font-semibold text-paper"
              >
                Keep going
              </button>
              <button type="button" onClick={onExit} className="press h-12 rounded-xl font-semibold">
                Leave
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Question({
  exercise,
  combo,
  onMiss,
  onAnswer,
  onDone,
  onGiveUp,
}: {
  exercise: Exercise;
  combo: number;
  onMiss: () => number;
  onAnswer: (correct: boolean) => void;
  onDone: (correct: boolean) => void;
  onGiveUp: () => void;
}) {
  const options = useMemo(
    () => (exercise.type === "choice" ? seededShuffle(exercise.options, exercise.id) : []),
    [exercise],
  );
  const [choice, setChoice] = useState<string | null>(null);
  const [truth, setTruth] = useState<boolean | null>(null);
  const [fill, setFill] = useState("");
  const [order, setOrder] = useState<string[]>(() =>
    exercise.type === "order" ? shuffleOrder(exercise.items, exercise.id) : [],
  );
  const rights = useMemo(
    () =>
      exercise.type === "match"
        ? seededShuffle(
            exercise.pairs.map((pair) => pair.right),
            exercise.id,
          )
        : [],
    [exercise],
  );
  const [pickedLeft, setPickedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [slips, setSlips] = useState(0);
  const [bad, setBad] = useState(false);
  const [spent, setSpent] = useState(false);
  const [phase, setPhase] = useState<"ask" | "feedback">("ask");
  const [correct, setCorrect] = useState(false);
  const sent = useRef(false);

  function ready() {
    if (exercise.type === "choice") return choice !== null;
    if (exercise.type === "truefalse") return truth !== null;
    if (exercise.type === "fill") return fill.trim().length > 0;
    if (exercise.type === "order") return order.length > 0;
    return matched.length === exercise.pairs.length;
  }

  function grade() {
    if (exercise.type === "choice") return choice === exercise.answer;
    if (exercise.type === "truefalse") return truth === exercise.answer;
    if (exercise.type === "fill") {
      const accepted = [exercise.answer, ...(exercise.accept ?? [])];
      return accepted.some((item) => normalize(item) === normalize(fill));
    }
    if (exercise.type === "order") return order.every((item, index) => item === exercise.items[index]);
    return slips === 0;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (spent) {
      onGiveUp();
      return;
    }
    if (phase === "feedback") {
      if (sent.current) return;
      sent.current = true;
      onDone(correct);
      return;
    }
    if (!ready()) return;
    const ok = grade();
    setCorrect(ok);
    setPhase("feedback");
    onAnswer(ok);
    if (ok) playCorrect();
    else {
      playWrong();
      onMiss();
    }
  }

  function pickRight(right: string) {
    if (exercise.type !== "match" || !pickedLeft || phase === "feedback" || spent) return;
    const pair = exercise.pairs.find((item) => item.left === pickedLeft);
    if (pair?.right === right) {
      const next = [...matched, pickedLeft];
      setMatched(next);
      setPickedLeft(null);
      if (next.length === exercise.pairs.length) {
        const ok = slips === 0;
        setCorrect(ok);
        setPhase("feedback");
        onAnswer(ok);
        if (ok) playCorrect();
        else playWrong();
      }
      return;
    }
    setBad(true);
    window.setTimeout(() => setBad(false), 280);
    setSlips((value) => value + 1);
    setPickedLeft(null);
    playWrong();
    const left = onMiss();
    if (left <= 0) setSpent(true);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    const current = next[index]!;
    next[index] = next[target]!;
    next[target] = current;
    setOrder(next);
  }

  const feedbackTone = correct ? "bg-pine text-paper" : "bg-copper-soft text-ink";

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <p className="text-xs font-semibold tracking-widest text-muted uppercase">
          {exercise.type === "match"
            ? "Match"
            : exercise.type === "order"
              ? "Order"
              : exercise.type === "fill"
                ? "Fill in"
                : "Choose"}
        </p>
        <h1 className="mt-2 font-serif text-3xl leading-tight">{exercise.prompt}</h1>
        {exercise.type === "match" ? (
          <p className="mt-2 text-sm text-muted">Tap a term, then its match.</p>
        ) : null}
        {exercise.type === "order" ? (
          <p className="mt-2 text-sm text-muted">First step on top.</p>
        ) : null}

        {exercise.type === "choice" ? (
          <div role="radiogroup" aria-label="Answers" className="mt-6 grid gap-2">
            {options.map((option) => {
              const selected = choice === option;
              const revealed = phase === "feedback";
              const isAnswer = option === exercise.answer;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={revealed}
                  onClick={() => setChoice(option)}
                  className={cn(
                    "press min-h-14 rounded-xl px-4 py-3 text-left",
                    revealed && isAnswer && "bg-pine text-paper",
                    revealed && selected && !isAnswer && "bg-copper-soft ring-2 ring-copper",
                    !revealed && selected && "bg-pine-soft ring-2 ring-pine",
                    !revealed && !selected && "surface-card",
                    revealed && !isAnswer && !selected && "surface-card opacity-60",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        ) : null}

        {exercise.type === "truefalse" ? (
          <div role="radiogroup" aria-label="True or false" className="mt-6 grid grid-cols-2 gap-3">
            {[
              { label: "True", value: true },
              { label: "False", value: false },
            ].map((option) => {
              const selected = truth === option.value;
              const revealed = phase === "feedback";
              const isAnswer = exercise.answer === option.value;
              return (
                <button
                  key={option.label}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={revealed}
                  onClick={() => setTruth(option.value)}
                  className={cn(
                    "press min-h-24 rounded-2xl text-lg font-semibold",
                    revealed && isAnswer && "bg-pine text-paper",
                    revealed && selected && !isAnswer && "bg-copper-soft ring-2 ring-copper",
                    !revealed && selected && "bg-pine text-paper",
                    !revealed && !selected && "surface-card",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : null}

        {exercise.type === "fill" ? (
          <label className="mt-6 block">
            <span className="sr-only">Your answer</span>
            <input
              value={fill}
              disabled={phase === "feedback"}
              onChange={(event) => setFill(event.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={40}
              placeholder="Type the missing word"
              className="surface-card h-14 w-full rounded-xl px-4 text-lg outline-none focus-visible:ring-2 focus-visible:ring-pine"
            />
          </label>
        ) : null}

        {exercise.type === "order" ? (
          <ol className="mt-6 grid gap-2">
            {order.map((item, itemIndex) => (
              <li key={item} className="surface-card flex items-center gap-2 rounded-xl py-1 pr-1 pl-3">
                <span className="w-5 text-sm font-semibold text-muted tabular-nums">{itemIndex + 1}</span>
                <span className="min-w-0 flex-1 text-sm">{item}</span>
                <button
                  type="button"
                  aria-label={`Move up: ${item}`}
                  disabled={phase === "feedback" || itemIndex === 0}
                  onClick={() => move(itemIndex, -1)}
                  className="press flex size-11 items-center justify-center disabled:opacity-30"
                >
                  <ChevronUp className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label={`Move down: ${item}`}
                  disabled={phase === "feedback" || itemIndex === order.length - 1}
                  onClick={() => move(itemIndex, 1)}
                  className="press flex size-11 items-center justify-center disabled:opacity-30"
                >
                  <ChevronDown className="size-5" />
                </button>
              </li>
            ))}
          </ol>
        ) : null}

        {exercise.type === "match" ? (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="grid content-start gap-2">
              {exercise.pairs.map((pair) => {
                const done = matched.includes(pair.left);
                const selected = pickedLeft === pair.left;
                return (
                  <button
                    key={pair.left}
                    type="button"
                    disabled={done || phase === "feedback" || spent}
                    onClick={() => setPickedLeft(selected ? null : pair.left)}
                    className={cn(
                      "press min-h-14 rounded-xl px-3 py-2 text-left text-sm",
                      done && "bg-pine-soft text-pine",
                      selected && "bg-pine text-paper",
                      !done && !selected && "surface-card",
                    )}
                  >
                    {pair.left}
                  </button>
                );
              })}
            </div>
            <div className="grid content-start gap-2">
              {rights.map((right) => {
                const used = exercise.pairs.some(
                  (pair) => pair.right === right && matched.includes(pair.left),
                );
                return (
                  <button
                    key={right}
                    type="button"
                    disabled={used || phase === "feedback" || spent}
                    onClick={() => pickRight(right)}
                    className={cn(
                      "press min-h-14 rounded-xl px-3 py-2 text-left text-sm",
                      used && "bg-pine-soft text-pine",
                      !used && bad && "nudge",
                      !used && "surface-card",
                    )}
                  >
                    {right}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className={cn("pad-safe shrink-0 px-5 pt-3", phase === "feedback" && feedbackTone, spent && "bg-copper-soft text-ink")}>
        {spent ? (
          <p className="mb-3 text-sm font-semibold">No hearts left. This round stops here.</p>
        ) : null}
        {phase === "feedback" ? (
          <div className="mb-3 flex items-start gap-3">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-paper">
              <Companion mood={correct ? "cheer" : "oops"} className="h-12" />
            </span>
            <div className="max-h-36 min-w-0 overflow-y-auto">
              <p className="font-semibold">
                {correct ? (combo >= 3 ? `${combo} in a row` : "That’s right") : "Not quite"}
              </p>
              {!correct ? <p className="mt-1 text-sm">{answerLine(exercise)}</p> : null}
              <p className="mt-1 text-sm text-pretty">{exercise.explain}</p>
            </div>
          </div>
        ) : null}
        <button
          type="submit"
          disabled={phase === "ask" && !spent && !ready()}
          className={cn(
            "press mb-1 h-12 w-full rounded-xl font-semibold disabled:opacity-40",
            phase === "feedback" && correct && "bg-paper text-pine",
            (phase === "feedback" && !correct) || spent ? "bg-ink text-paper" : "",
            phase === "ask" && !spent && "bg-pine text-paper",
          )}
        >
          {spent ? "End round" : phase === "feedback" ? "Continue" : "Check"}
        </button>
      </div>
    </form>
  );
}

function answerLine(exercise: Exercise) {
  if (exercise.type === "choice" || exercise.type === "fill") return `Answer: ${exercise.answer}`;
  if (exercise.type === "truefalse") return `Answer: ${exercise.answer ? "True" : "False"}`;
  if (exercise.type === "order") {
    return `Answer: ${exercise.items.join(" → ")}`;
  }
  return "Look back at the pairs.";
}
