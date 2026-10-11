export type FieldNote = {
  id: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  publishedOn: string;
};

export type HouseAd = {
  id: string;
  title: string;
  body: string;
  placement: "hearts" | "lesson_end";
  rewardHearts: number;
  rewardGems: number;
  rewardXp: number;
  active: boolean;
};

export type BankQuestion = {
  id: string;
  lessonId: string;
  kind: string;
  prompt: string;
  explain: string;
  active: boolean;
};

export type AdReward = {
  hearts: number;
  gems: number;
  xp: number;
  todayXp: number;
  todayDate: string;
  gainedHearts: number;
  gainedGems: number;
  gainedXp: number;
};

export type NoteInput = {
  id?: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  publishedOn: string;
};
