import { useState } from "react";
import { Quill } from "@/components/quill";
import { placementQuestions, trackCopy } from "@/data/placement";
import { GOALS, type Goal, useProgress } from "@/lib/progress";
import { submitPlacement } from "@/lib/learner-client";
import { cn } from "@/lib/cn";
import type { Track } from "@/data/placement";

const GOAL_COPY: Record<Goal, { title: string; detail: string }> = {
  50: { title: "Steady", detail: "50 XP · about one lesson" },
  100: { title: "Sharp", detail: "100 XP · about two lessons" },
  150: { title: "Deep", detail: "150 XP · a long sitting" },
};

export function Placement({
  replace,
  defaultName,
  onCancel,
  onFinished,
}: {
  replace: boolean;
  defaultName: string;
  onCancel?: () => void;
  onFinished: () => void;
}) {
  const [name, setName] = useState(defaultName);
  const [goal, setGoal] = useState<Goal>(useProgress.getState().dailyGoal || 50);
  const [step, setStep] = useState<"intro" | "quiz" | "result">("intro");
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<{ id: string; choice: string }[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const question = placementQuestions[index];
  const level = useProgress((state) => state.level);
  const score = useProgress((state) => state.placementScore);
  const total = useProgress((state) => state.placementTotal);

  async function finish(next: { id: string; choice: string }[]) {
    setPending(true);
    setError("");
    try {
      await submitPlacement({
        name,
        goal,
        replace,
        answers: next,
      });
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the quiz.");
    } finally {
      setPending(false);
    }
  }

  if (step === "result" && level) {
    const copy = trackCopy(level as Track);
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-10">
        <div className="my-auto">
          <div className="flex items-end gap-3">
            <Quill
              mood={level === "beginner" ? "greet" : "cheer"}
              className="h-32 shrink-0"
              label="Quill"
            />
            <div className="min-w-0 pb-2">
              <p className="text-xs font-semibold tracking-widest text-pine uppercase">Placement</p>
              <h1 className="mt-2 font-serif text-3xl leading-tight">{copy.title}</h1>
            </div>
          </div>
          <p className="mt-3 text-pretty text-muted">{copy.lede}</p>
          <p className="mt-4 font-serif text-3xl tabular-nums">
            {score}
            <span className="text-xl text-muted">/{total || placementQuestions.length}</span>
          </p>
          <p className="text-sm text-muted">Saved to your account. You can retake this later from You.</p>
          <button
            type="button"
            onClick={onFinished}
            className="press mt-8 h-12 w-full rounded-xl bg-pine font-semibold text-paper"
          >
            Enter the path
          </button>
        </div>
      </main>
    );
  }

  if (step === "intro") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-10">
        <div className="my-auto">
          <div className="flex items-end gap-4">
            <Quill mood="greet" className="h-32 shrink-0" label="Quill" />
            <div className="min-w-0 pb-1">
              <p className="text-xs font-semibold tracking-widest text-pine uppercase">Quill · Placement</p>
              <h1 className="mt-2 font-serif text-3xl leading-tight">Eight questions. No failing score.</h1>
            </div>
          </div>
          <p className="mt-3 text-pretty text-muted">
            This only chooses where your path starts. Guessing is fine. Beginners get plain-language notes,
            free passes on early misses, and a streak shield.
          </p>
          <label className="mt-8 block">
            <span className="text-sm font-semibold">What should we call you?</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={24}
              placeholder="Optional"
              className="surface-card mt-2 h-12 w-full rounded-xl px-4 text-ink outline-none focus-visible:ring-2 focus-visible:ring-pine"
            />
          </label>
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold">Daily goal</legend>
            <div className="mt-2 grid gap-2">
              {GOALS.map((value) => {
                const selected = goal === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setGoal(value)}
                    className={cn(
                      "press flex min-h-14 items-center justify-between rounded-xl px-4 text-left",
                      selected ? "bg-pine text-paper" : "surface-card",
                    )}
                  >
                    <span className="font-semibold">{GOAL_COPY[value].title}</span>
                    <span className={cn("text-sm", selected ? "text-paper/80" : "text-muted")}>
                      {GOAL_COPY[value].detail}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <button
            type="button"
            onClick={() => setStep("quiz")}
            className="press mt-8 h-12 w-full rounded-xl bg-pine font-semibold text-paper"
          >
            Start the quiz
          </button>
          {onCancel ? (
            <button type="button" onClick={onCancel} className="press mt-2 h-12 w-full rounded-xl font-semibold">
              Keep my current path
            </button>
          ) : null}
        </div>
      </main>
    );
  }

  if (!question) return null;
  const correct = choice === question.answer;
  const pct = (index / placementQuestions.length) * 100;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="flex items-center gap-3 px-4 pt-4">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-paper-deep"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={placementQuestions.length}
          aria-valuenow={index}
          aria-label="Placement progress"
        >
          <div className="h-full bg-pine" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-sm font-semibold tabular-nums text-muted">
          {index + 1}/{placementQuestions.length}
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <p className="text-xs font-semibold tracking-widest text-pine uppercase">Placement</p>
        <h1 className="mt-2 font-serif text-3xl leading-tight">{question.prompt}</h1>
        <div className="mt-6 grid gap-2" role="radiogroup" aria-label="Answer">
          {question.options.map((option) => {
            const selected = choice === option;
            const show = checked && (selected || option === question.answer);
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={checked || pending}
                onClick={() => setChoice(option)}
                className={cn(
                  "press min-h-14 rounded-xl px-4 text-left font-medium",
                  !show && selected && "bg-pine text-paper",
                  !show && !selected && "surface-card",
                  show && option === question.answer && "bg-pine text-paper",
                  show && selected && option !== question.answer && "bg-copper-soft",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
        {checked ? <p className="mt-4 text-sm text-pretty text-muted">{question.explain}</p> : null}
        {error ? <p className="mt-4 text-sm text-copper">{error}</p> : null}
      </div>
      <div className="pad-safe px-5 pt-3">
        {!checked ? (
          <button
            type="button"
            disabled={!choice}
            onClick={() => setChecked(true)}
            className="press h-12 w-full rounded-xl bg-pine font-semibold text-paper disabled:opacity-40"
          >
            Check
          </button>
        ) : (
          <button
            type="button"
            disabled={pending || !choice}
            onClick={() => {
              if (!choice) return;
              const next = [...answers, { id: question.id, choice }];
              setAnswers(next);
              if (index + 1 >= placementQuestions.length) {
                void finish(next);
                return;
              }
              setIndex((value) => value + 1);
              setChoice(null);
              setChecked(false);
            }}
            className="press h-12 w-full rounded-xl bg-pine font-semibold text-paper disabled:opacity-40"
          >
            {pending ? "Saving…" : index + 1 >= placementQuestions.length ? "See your path" : "Continue"}
          </button>
        )}
      </div>
    </main>
  );
}
