import { useEffect, useState } from "react";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { LearnerGate } from "@/components/learner-gate";
import { LessonPlayer } from "@/components/lesson-player";
import { getLesson, getUnitOf, isUnlocked, nextAfter } from "@/data/curriculum";
import type { Exercise } from "@/data/types";
import { useProgress } from "@/lib/progress";

export const Route = createFileRoute("/lesson/$lessonId")({
  component: LessonPage,
});

function LessonPage() {
  return (
    <LearnerGate>
      <LessonBody />
    </LearnerGate>
  );
}

function LessonBody() {
  const { lessonId } = Route.useParams();
  const crowns = useProgress((state) => state.crowns);
  const placed = useProgress((state) => state.placed);
  const onboarded = useProgress((state) => state.onboarded);
  const navigate = useNavigate();
  const lesson = getLesson(lessonId);
  const credit = { crowns, placed };
  const [exercises, setExercises] = useState<Exercise[] | null>(null);

  useEffect(() => {
    if (!lesson) return;
    let cancel = false;
    setExercises(null);
    void (async () => {
      try {
        const { loadLessonBank } = await import("@/lib/bank.functions");
        const rows = await loadLessonBank({ data: lesson.id });
        if (!cancel) setExercises(rows.length > 0 ? rows : lesson.exercises);
      } catch {
        if (!cancel) setExercises(lesson.exercises);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [lesson]);

  if (!onboarded) return <Navigate to="/" search={{ tab: "path" }} />;
  if (!lesson) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6">
        <h1 className="font-serif text-3xl">That lesson isn’t on the path.</h1>
        <button
          type="button"
          className="press mt-6 h-12 rounded-xl bg-pine font-semibold text-paper"
          onClick={() => void navigate({ to: "/", search: { tab: "path" } })}
        >
          Back to the path
        </button>
      </main>
    );
  }
  if (!isUnlocked(lesson.id, credit)) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6">
        <h1 className="font-serif text-3xl">This lesson is still locked.</h1>
        <p className="mt-2 text-muted">Finish the one before it, or place out of it, to open this node.</p>
        <button
          type="button"
          className="press mt-6 h-12 rounded-xl bg-pine font-semibold text-paper"
          onClick={() => void navigate({ to: "/", search: { tab: "path" } })}
        >
          Back to the path
        </button>
      </main>
    );
  }

  if (!exercises) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md items-center justify-center px-6">
        <p className="text-sm text-muted">Opening the lesson…</p>
      </main>
    );
  }

  const unit = getUnitOf(lesson.id);
  const focus = nextAfter(lesson.id) ?? lesson.id;

  return (
    <LessonPlayer
      lessonId={lesson.id}
      title={lesson.title}
      kicker={lesson.checkpoint ? `Checkpoint · ${unit?.title ?? "Axiom"}` : (unit?.title ?? "Lesson")}
      idea={lesson.idea}
      spark={lesson.spark}
      exercises={exercises}
      stakeHearts
      onExit={() => void navigate({ to: "/", search: { tab: "path", focus: lesson.id } })}
      onFinished={() => void navigate({ to: "/", search: { tab: "path", focus } })}
      onDrill={() => void navigate({ to: "/", search: { tab: "practice", drill: "repair" } })}
      onComplete={(graded) => {
        const result = useProgress.getState().completeLesson({ lessonId: lesson.id, graded });
        const lede = result.crownedUp
          ? `Crown ${result.crown} of 3.`
          : result.crown >= 3
            ? "Crown is already full."
            : `Crown holds at ${result.crown}. A perfect replay raises it.`;
        return {
          heading: "Lesson complete",
          lede,
          xp: result.xp,
          accuracy: result.accuracy,
          foot: result.streakLine,
        };
      }}
    />
  );
}
