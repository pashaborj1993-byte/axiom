import { units } from "./curriculum";

export const TRACKS = ["beginner", "intermediate", "advanced"] as const;
export type Track = (typeof TRACKS)[number];

export type PlacementQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explain: string;
};

export const placementQuestions: PlacementQuestion[] = [
  {
    id: "place-rule",
    prompt: "A weather widget always shows rain when humidity is above 80%, because a person wrote that condition. What is it?",
    options: ["A learned model", "A written rule", "A general intelligence"],
    answer: "A written rule",
    explain: "If a person wrote the condition, it is a rule. A learned model adjusts from examples instead.",
  },
  {
    id: "place-train",
    prompt: "In plain words, “training” a model mostly means…",
    options: [
      "Asking it a question",
      "Adjusting it from examples",
      "Deleting the data when you are done",
    ],
    answer: "Adjusting it from examples",
    explain: "Training is the learning phase. Using the finished model later is called inference.",
  },
  {
    id: "place-invent",
    prompt: "A chatbot names a research paper that does not exist. The closest name for that failure is…",
    options: ["Hallucination", "Encryption", "A longer context window"],
    answer: "Hallucination",
    explain: "Fluent text is not a source. Invented specifics are a known failure, often called hallucination.",
  },
  {
    id: "place-next",
    prompt: "A language model’s basic move is closest to…",
    options: [
      "Looking up a stored essay and pasting it",
      "Scoring possible next pieces of text",
      "Searching the live web by default",
    ],
    answer: "Scoring possible next pieces of text",
    explain: "It continues text by scoring what tends to come next. It is not a library of finished essays.",
  },
  {
    id: "place-rag",
    prompt: "Retrieval-augmented generation (RAG) is best described as…",
    options: [
      "Making the model larger",
      "Fetching source text and asking the model to use it",
      "Turning randomness off permanently",
    ],
    answer: "Fetching source text and asking the model to use it",
    explain: "RAG brings in documents at question time so the answer can be grounded in those sources.",
  },
  {
    id: "place-temp",
    prompt: "Raising a model’s temperature…",
    options: [
      "Adds facts the model did not know",
      "Makes the choice among likely words more random",
      "Always raises accuracy",
    ],
    answer: "Makes the choice among likely words more random",
    explain: "Temperature changes sampling, not knowledge. Hotter is more varied, not more correct.",
  },
  {
    id: "place-eval",
    prompt: "If you only grade a model on examples it already trained on, you mostly measure…",
    options: ["Memorization", "How it acts on new cases", "Whether it is safe to deploy"],
    answer: "Memorization",
    explain: "A fair check uses examples the model did not train on. Otherwise you mostly see recall.",
  },
  {
    id: "place-agent",
    prompt: "Giving a model tools (send email, run code, move money) is riskier than chat mainly because…",
    options: [
      "The sentences get longer",
      "It can take actions, not only write text",
      "Tools always make it more accurate",
    ],
    answer: "It can take actions, not only write text",
    explain: "The danger is side effects. A wrong sentence is cheap. A wrong action can be expensive.",
  },
  {
    id: "place-holdout",
    prompt: "A holdout (test) set is for…",
    options: [
      "A final grade on examples the model did not train on",
      "The examples the model learns from",
      "Choosing the logo",
    ],
    answer: "A final grade on examples the model did not train on",
    explain: "If you train on the test, you are grading a memory, not a skill.",
  },
  {
    id: "place-embed",
    prompt: "An embedding is closest to…",
    options: [
      "A list of numbers that stands in for a word or image",
      "A printed citation",
      "A longer chat history stored forever",
    ],
    answer: "A list of numbers that stands in for a word or image",
    explain: "Similar things land near each other. Near is the model’s geometry, not a dictionary.",
  },
  {
    id: "place-rail",
    prompt: "A guardrail in a product is…",
    options: [
      "A check around the model that limits what it can do",
      "Proof the model has become careful",
      "A higher temperature",
    ],
    answer: "A check around the model that limits what it can do",
    explain: "Rails contain damage. They do not make the model wise.",
  },
  {
    id: "place-adapt",
    prompt: "A prompt and a fine-tune differ because…",
    options: [
      "A prompt changes one call. A fine-tune changes the model with extra examples",
      "They are two names for temperature",
      "A fine-tune is just a longer system note",
    ],
    answer: "A prompt changes one call. A fine-tune changes the model with extra examples",
    explain: "Use a prompt when you can show the material each time. Train when the behavior has to stick, and you can test it.",
  },
];

export function gradePlacement(answers: { id: string; choice: string }[]) {
  const byId = new Map(answers.map((item) => [item.id, item.choice]));
  let score = 0;
  const detail = placementQuestions.map((question) => {
    const correct = byId.get(question.id) === question.answer;
    if (correct) score += 1;
    return { id: question.id, correct };
  });
  return { score, total: placementQuestions.length, detail };
}

export function trackFor(score: number): Track {
  if (score >= 10) return "advanced";
  if (score >= 6) return "intermediate";
  return "beginner";
}

export function placedLessonIds(track: Track) {
  const skip = track === "beginner" ? [] : track === "intermediate" ? ["foundations"] : ["foundations", "learning"];
  return units.filter((unit) => skip.includes(unit.id)).flatMap((unit) => unit.lessons.map((lesson) => lesson.id));
}

export function trackCopy(track: Track) {
  if (track === "beginner") {
    return {
      title: "Beginner path",
      lede: "You start at the first lesson. Quill explains the words, your first misses are free, and the path runs from “what is a model” through how to ship one.",
    };
  }
  if (track === "intermediate") {
    return {
      title: "Intermediate path",
      lede: "You placed out of Foundations. The map opens at Learning: piles of examples, scores, and how a model leans.",
    };
  }
  return {
    title: "Advanced path",
    lede: "You placed out of Foundations and Learning. The map opens at Networks and keeps going through Workshop and Frontier. Replay anything you want a real crown on.",
  };
}
