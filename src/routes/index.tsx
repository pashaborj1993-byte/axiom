import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LearnerGate } from "@/components/learner-gate";
import { LessonPlayer, type RoundSummary } from "@/components/lesson-player";
import { PathView } from "@/components/path-view";
import { Placement } from "@/components/placement";
import { PracticeView, makeDrill, type DrillSession } from "@/components/practice-view";
import { ProfileView } from "@/components/profile-view";
import { Shell, type TabId } from "@/components/shell";
import type { CampaignPlay } from "@/data/campaigns";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type { Graded } from "@/lib/progress";
import { useProgress } from "@/lib/progress";

type HomeSearch = {
  tab: TabId;
  focus?: string;
  drill?: "repair";
};

type PlaySession = DrillSession | CampaignPlay;

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const tab = search.tab === "practice" || search.tab === "you" ? search.tab : "path";
    const focus = typeof search.focus === "string" ? search.focus.slice(0, 80) : undefined;
    const drill = search.drill === "repair" ? "repair" : undefined;
    return { tab, focus, drill };
  },
  component: Home,
});

function Home() {
  return (
    <LearnerGate>
      <HomeReady />
    </LearnerGate>
  );
}

function HomeReady() {
  const onboarded = useProgress((state) => state.onboarded);
  const user = useCurrentUser();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [session, setSession] = useState<PlaySession | null>(null);
  const [phase, setPhase] = useState<"quiz" | "app">(() =>
    useProgress.getState().onboarded ? "app" : "quiz",
  );
  const drillStarted = useRef(false);

  useEffect(() => {
    if (phase !== "app" || !onboarded || search.drill !== "repair" || drillStarted.current) return;
    drillStarted.current = true;
    const next = makeDrill("repair");
    if (next) setSession(next);
    void navigate({ to: "/", search: { tab: "practice" }, replace: true });
  }, [phase, onboarded, search.drill, navigate]);

  if (phase === "quiz") {
    return (
      <Placement
        replace={onboarded}
        defaultName={useProgress.getState().name || user?.displayName || ""}
        onCancel={onboarded ? () => setPhase("app") : undefined}
        onFinished={() => setPhase("app")}
      />
    );
  }

  if (session) {
    return (
      <LessonPlayer
        title={session.title}
        kicker={session.kicker}
        idea={session.idea}
        exercises={session.exercises}
        stakeHearts={false}
        onExit={() => setSession(null)}
        onComplete={(graded) => reward(session, graded)}
      />
    );
  }

  return (
    <Shell
      tab={search.tab}
      onTab={(tab) => {
        void navigate({ to: "/", search: { tab } });
      }}
    >
      {search.tab === "path" ? <PathView focus={search.focus} onPlay={setSession} /> : null}
      {search.tab === "practice" ? <PracticeView onStart={setSession} /> : null}
      {search.tab === "you" ? <ProfileView onRetake={() => setPhase("quiz")} /> : null}
    </Shell>
  );
}

function reward(session: PlaySession, graded: Graded[]): RoundSummary {
  if (session.kind === "campaign") {
    const result = useProgress.getState().finishCampaign({
      id: session.campaignId,
      graded,
      rewardXp: session.rewardXp,
      rewardGems: session.rewardGems,
      passAt: session.passAt,
      grantsShield: session.grantsShield,
    });
    return {
      heading: result.passed ? "Campaign cleared" : "Campaign finished",
      lede: result.shieldAwarded
        ? "A streak shield is banked."
        : result.passed
          ? "Full reward. Gems land once per campaign."
          : `Need ${session.passAt}% for the prize. This round can be replayed.`,
      xp: result.xp,
      gems: result.gems,
      accuracy: result.accuracy,
      foot: result.streakLine,
    };
  }
  if (session.kind === "repair") {
    const result = useProgress.getState().finishDrill({ graded, xpEach: 5, awardHeart: true });
    return {
      heading: result.heartAwarded ? "Heart earned" : "Drill finished",
      lede: result.heartAwarded
        ? "One heart is back."
        : "Two of three right earns a heart. This round came up short.",
      xp: result.xp,
      accuracy: result.accuracy,
      foot: result.streakLine,
    };
  }
  if (session.kind === "review") {
    const result = useProgress.getState().finishDrill({ graded, xpEach: 8 });
    return {
      heading: "Review complete",
      lede: "Correct answers left the miss pile.",
      xp: result.xp,
      accuracy: result.accuracy,
      foot: result.streakLine,
    };
  }
  const result = useProgress.getState().finishDrill({ graded, xpEach: 8, perfectBonus: 10 });
  return {
    heading: "Drill complete",
    lede: result.accuracy === 100 ? "Clean run." : "A pass over lessons you have already cleared.",
    xp: result.xp,
    accuracy: result.accuracy,
    foot: result.streakLine,
  };
}
