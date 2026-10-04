import type { Track } from "@/data/placement";

export type CampaignRecord = { accuracy: number; at: string };

export type LearnerSnapshot = {
  displayName: string;
  level: Track;
  placementScore: number;
  placementTotal: number;
  dailyGoal: 50 | 100 | 150;
  sound: boolean;
  xp: number;
  todayXp: number;
  todayDate: string;
  streak: number;
  longestStreak: number;
  lastPracticeDate: string | null;
  hearts: number;
  heartUpdatedAt: number;
  gems: number;
  shields: number;
  grace: number;
  correctCount: number;
  attemptCount: number;
  perfectLessons: number;
  crowns: Record<string, number>;
  mistakes: string[];
  placed: Record<string, boolean>;
  campaigns: Record<string, CampaignRecord>;
};

export type PlacementInput = {
  name: string;
  goal: 50 | 100 | 150;
  replace: boolean;
  answers: { id: string; choice: string }[];
};
