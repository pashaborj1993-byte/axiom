export type ChoiceExercise = {
  id: string;
  type: "choice";
  prompt: string;
  options: string[];
  answer: string;
  explain: string;
};

export type TrueFalseExercise = {
  id: string;
  type: "truefalse";
  prompt: string;
  answer: boolean;
  explain: string;
};

export type FillExercise = {
  id: string;
  type: "fill";
  prompt: string;
  answer: string;
  accept?: string[];
  explain: string;
};

export type MatchExercise = {
  id: string;
  type: "match";
  prompt: string;
  pairs: { left: string; right: string }[];
  explain: string;
};

export type OrderExercise = {
  id: string;
  type: "order";
  prompt: string;
  items: string[];
  explain: string;
};

export type Exercise =
  | ChoiceExercise
  | TrueFalseExercise
  | FillExercise
  | MatchExercise
  | OrderExercise;

export type Lesson = {
  id: string;
  title: string;
  idea: string;
  /** A short aside from Quill, shown before the questions. */
  spark?: string;
  checkpoint?: boolean;
  exercises: Exercise[];
};

export type Unit = {
  id: string;
  title: string;
  blurb: string;
  guide: string[];
  lessons: Lesson[];
};
