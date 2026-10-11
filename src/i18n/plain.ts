import type { Locale } from "@/i18n/messages";

type Plain = { title: string; plain: string; hint?: string };

const foundations: Record<string, Record<Locale, Plain>> = {
  "foundations-meaning": {
    en: {
      title: "What “AI” points at",
      plain: "AI usually means a program that got better from examples. It is not a person, and it is not a rule someone typed by hand.",
      hint: "Ask: did a person write the exact rule, or did the program change after seeing examples?",
    },
    fr: {
      title: "Ce que veut dire « IA »",
      plain: "IA veut souvent dire un programme qui s’est amélioré avec des exemples. Ce n’est pas une personne, ni une règle écrite à la main.",
      hint: "Demandez-vous : une personne a-t-elle écrit la règle, ou le programme a-t-il changé après des exemples ?",
    },
    fa: {
      title: "«هوش مصنوعی» به چه چیزی اشاره دارد",
      plain: "هوش مصنوعی معمولاً یعنی برنامه‌ای که با دیدن مثال بهتر شده است. نه یک انسان است و نه قانونی که کسی با دست نوشته باشد.",
      hint: "بپرسید: یک نفر قانون دقیق را نوشته، یا برنامه بعد از دیدن مثال‌ها عوض شده؟",
    },
  },
  "foundations-models": {
    en: {
      title: "Models, not magic",
      plain: "A model is the learned part: numbers that turn an input into an output. The app you tap is the model plus buttons and rules around it.",
    },
    fr: {
      title: "Un modèle, pas de la magie",
      plain: "Le modèle est la partie apprise : des nombres qui transforment une entrée en sortie. L’application est ce modèle, plus des boutons et des règles.",
    },
    fa: {
      title: "مدل، نه جادو",
      plain: "مدل همان بخشِ یادگرفته است: عددهایی که یک ورودی را به خروجی تبدیل می‌کنند. برنامه‌ای که باز می‌کنید مدل است به‌اضافهٔ دکمه‌ها و قانون‌های دور آن.",
    },
  },
  "foundations-phases": {
    en: {
      title: "Training and using",
      plain: "Training is when the model learns from examples. Using it afterwards, on a new question, is a different step.",
    },
    fr: {
      title: "Apprendre, puis utiliser",
      plain: "L’entraînement, c’est quand le modèle apprend avec des exemples. L’utiliser ensuite, sur une question nouvelle, est une autre étape.",
    },
    fa: {
      title: "آموزش و استفاده",
      plain: "آموزش یعنی وقتی مدل از مثال‌ها یاد می‌گیرد. استفادهٔ بعدی، روی یک سؤال تازه، مرحلهٔ دیگری است.",
    },
  },
  "foundations-wave": {
    en: {
      title: "Why this wave",
      plain: "This boom is three things at once: a huge pile of examples, fast computers, and apps people can actually open.",
    },
    fr: {
      title: "Pourquoi cette vague",
      plain: "Cet essor, ce sont trois choses ensemble : beaucoup d’exemples, des ordinateurs rapides, et des applications que les gens peuvent ouvrir.",
    },
    fa: {
      title: "چرا این موج",
      plain: "این موج سه چیز با هم است: انبوهی از مثال‌ها، رایانه‌های سریع، و برنامه‌هایی که مردم واقعاً باز می‌کنند.",
    },
  },
  "foundations-narrow": {
    en: {
      title: "Narrow, on purpose",
      plain: "Each tool is built for one kind of job. A translator does not become a doctor just because both are called AI.",
    },
    fr: {
      title: "Étroit, exprès",
      plain: "Chaque outil est fait pour un type de travail. Un traducteur ne devient pas médecin parce que les deux s’appellent IA.",
    },
    fa: {
      title: "عمداً محدود",
      plain: "هر ابزار برای یک جور کار ساخته شده. مترجم، پزشک نمی‌شود فقط چون هر دو را هوش مصنوعی می‌نامند.",
    },
  },
  "foundations-data": {
    en: {
      title: "The pile of examples",
      plain: "A model only learns what was in the examples. If night photos were missing, night is a skill it does not have.",
    },
    fr: {
      title: "La pile d’exemples",
      plain: "Un modèle n’apprend que ce qui était dans les exemples. Sans photos de nuit, la nuit est une compétence absente.",
    },
    fa: {
      title: "تودهٔ مثال‌ها",
      plain: "مدل فقط همان چیزی را یاد می‌گیرد که در مثال‌ها بوده. اگر عکس شب نبوده، مهارت شب را ندارد.",
    },
  },
  "foundations-around": {
    en: {
      title: "You already use this",
      plain: "Photo search, spam filters, and recommendations already learned from examples. A calculator is usually just a rule.",
    },
    fr: {
      title: "Vous l’utilisez déjà",
      plain: "La recherche de photos, le filtre anti-spam et les recommandations ont déjà appris avec des exemples. Une calculatrice n’est en général qu’une règle.",
    },
    fa: {
      title: "همین حالا از آن استفاده می‌کنید",
      plain: "جستجوی عکس، فیلتر هرزنامه و پیشنهادها از مثال یاد گرفته‌اند. ماشین‌حساب معمولاً فقط یک قانون است.",
    },
  },
};

const units: Record<string, Record<Locale, { title: string; blurb: string }>> = {
  foundations: {
    en: { title: "Foundations", blurb: "What the word AI is actually doing." },
    fr: { title: "Fondations", blurb: "Ce que le mot IA fait vraiment." },
    fa: { title: "پایه‌ها", blurb: "کلمهٔ هوش مصنوعی واقعاً چه می‌کند." },
  },
  learning: {
    en: { title: "Learning", blurb: "How a machine picks up a pattern." },
    fr: { title: "Apprentissage", blurb: "Comment une machine attrape un motif." },
    fa: { title: "یادگیری", blurb: "ماشین چطور یک الگو را برمی‌دارد." },
  },
  networks: {
    en: { title: "Networks", blurb: "Weights, error, and attention." },
    fr: { title: "Réseaux", blurb: "Poids, erreur et attention." },
    fa: { title: "شبکه‌ها", blurb: "وزن، خطا و توجه." },
  },
  language: {
    en: { title: "Language", blurb: "Tokens, guesses, and context." },
    fr: { title: "Langage", blurb: "Jetons, suppositions et contexte." },
    fa: { title: "زبان", blurb: "قطعه‌ها، حدس‌ها و زمینه." },
  },
  craft: {
    en: { title: "Craft", blurb: "Prompts, grounding, and tools." },
    fr: { title: "Métier", blurb: "Consignes, sources et outils." },
    fa: { title: "فن", blurb: "دستور، تکیه بر منبع و ابزار." },
  },
  judgment: {
    en: { title: "Judgment", blurb: "Evidence, harm, and choosing." },
    fr: { title: "Jugement", blurb: "Preuves, dégâts et choix." },
    fa: { title: "داوری", blurb: "شاهد، آسیب و انتخاب." },
  },
  workshop: {
    en: { title: "Workshop", blurb: "How you ship a model without trusting a demo." },
    fr: { title: "Atelier", blurb: "Livrer un modèle sans croire une démo." },
    fa: { title: "کارگاه", blurb: "چطور یک مدل را بدون اعتماد به نمایش تحویل بدهید." },
  },
  frontier: {
    en: { title: "Frontier", blurb: "The arguments that start once the basics are solid." },
    fr: { title: "Frontière", blurb: "Les débats qui commencent quand les bases tiennent." },
    fa: { title: "مرز", blurb: "بحث‌هایی که بعد از محکم شدن پایه‌ها شروع می‌شوند." },
  },
};

export function lessonPlain(id: string, locale: Locale): Plain | null {
  return foundations[id]?.[locale] ?? null;
}

export function unitCopy(id: string, locale: Locale) {
  return units[id]?.[locale] ?? null;
}
