import { useState } from "react";
import { Quill } from "@/components/quill";
import { placementView } from "@/i18n/placement-copy";
import { useLocale, useT } from "@/i18n/use-t";
import { placementQuestions } from "@/data/placement";
import { GOALS, type Goal, useProgress } from "@/lib/progress";
import { submitPlacement } from "@/lib/learner-client";
import { cn } from "@/lib/cn";

const GOAL_KEYS: Record<Goal, { title: "steady" | "sharp" | "deep"; detail: "steadyHint" | "sharpHint" | "deepHint" }> = {
  50: { title: "steady", detail: "steadyHint" },
  100: { title: "sharp", detail: "sharpHint" },
  150: { title: "deep", detail: "deepHint" },
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
  const t = useT();
  const locale = useLocale();

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
      setError(err instanceof Error ? err.message : t("couldNotSave"));
    } finally {
      setPending(false);
    }
  }

  if (step === "result" && level) {
    const copy =
      level === "beginner"
        ? { title: t("beginnerTitle"), lede: t("beginnerLede") }
        : level === "intermediate"
          ? { title: t("intermediateTitle"), lede: t("intermediateLede") }
          : { title: t("advancedTitle"), lede: t("advancedLede") };
    return (
      <main className="phone-screen mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-10">
        <div className="my-auto">
          <div className="flex items-end gap-3">
            <Quill
              mood={level === "beginner" ? "greet" : "cheer"}
              className="h-32 shrink-0"
              label="Quill"
            />
            <div className="min-w-0 pb-2">
              <p className="text-xs font-semibold tracking-widest text-pine uppercase">{t("placement")}</p>
              <h1 className="mt-2 font-serif text-3xl leading-tight">{copy.title}</h1>
            </div>
          </div>
          <p className="mt-3 text-pretty text-muted">{copy.lede}</p>
          <p className="mt-4 font-serif text-3xl tabular-nums">
            {score}
            <span className="text-xl text-muted">/{total || placementQuestions.length}</span>
          </p>
          <p className="text-sm text-muted">{t("savedAccount")}</p>
          <button
            type="button"
            onClick={onFinished}
            className="press mt-8 h-12 w-full rounded-xl bg-pine font-semibold text-paper"
          >
            {t("enterPath")}
          </button>
        </div>
      </main>
    );
  }

  if (step === "intro") {
    return (
      <main className="phone-screen mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-10">
        <div className="my-auto">
          <div className="flex items-end gap-4">
            <Quill mood="greet" className="h-32 shrink-0" label="Quill" />
            <div className="min-w-0 pb-1">
              <p className="text-xs font-semibold tracking-widest text-pine uppercase">Quill · Placement</p>
              <h1 className="mt-2 font-serif text-3xl leading-tight">
                {t("questionsNoFail")}
              </h1>
            </div>
          </div>
          <p className="mt-3 text-pretty text-muted">
            {t("placementLede")}
          </p>
          <label className="mt-8 block">
            <span className="text-sm font-semibold">{t("callYou")}</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={24}
              placeholder="Optional"
              className="surface-card mt-2 h-12 w-full rounded-xl px-4 text-ink outline-none focus-visible:ring-2 focus-visible:ring-pine"
            />
          </label>
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold">{t("dailyGoal")}</legend>
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
                    <span className="font-semibold">{t(GOAL_KEYS[value].title)}</span>
                    <span className={cn("text-sm", selected ? "text-paper/80" : "text-muted")}>
                      {t(GOAL_KEYS[value].detail)}
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
            {t("startQuiz")}
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
  const view = placementView(question, locale);
  const correct = choice === question.answer;
  const pct = (index / placementQuestions.length) * 100;

  return (
    <main className="phone-screen mx-auto flex min-h-dvh w-full max-w-md flex-col">
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
        <p className="text-xs font-semibold tracking-widest text-pine uppercase">{t("placement")}</p>
        <h1 className="mt-2 font-serif text-3xl leading-tight">{view.prompt}</h1>
        <div className="mt-6 grid gap-2" role="radiogroup" aria-label="Answer">
          {view.options.map((option) => {
            const selected = choice === option.value;
            const show = checked && (selected || option.value === question.answer);
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={checked || pending}
                onClick={() => setChoice(option.value)}
                className={cn(
                  "press min-h-14 rounded-xl px-4 text-left font-medium",
                  !show && selected && "bg-pine text-paper",
                  !show && !selected && "surface-card",
                  show && option.value === question.answer && "bg-pine text-paper",
                  show && selected && option.value !== question.answer && "bg-copper-soft",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {checked ? <p className="mt-4 text-sm text-pretty text-muted">{view.explain}</p> : null}
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
            {t("check")}
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
            {pending ? "…" : index + 1 >= placementQuestions.length ? t("seePath") : t("continue")}
          </button>
        )}
      </div>
    </main>
  );
}
