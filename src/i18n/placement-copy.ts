import type { Locale } from "@/i18n/messages";
import { placementQuestions, type PlacementQuestion } from "@/data/placement";

type View = { prompt: string; options: { label: string; value: string }[]; explain: string };

const copy: Record<string, Record<Exclude<Locale, "en">, { prompt: string; options: string[]; explain: string }>> = {
  "place-rule": {
    fr: {
      prompt: "Un widget météo montre toujours la pluie quand l’humidité dépasse 80 %, parce qu’une personne a écrit cette condition. Qu’est-ce que c’est ?",
      options: ["Un modèle appris", "Une règle écrite", "Une intelligence générale"],
      explain: "Si une personne a écrit la condition, c’est une règle. Un modèle appris s’ajuste avec des exemples.",
    },
    fa: {
      prompt: "یک ابزار هواشناسی همیشه وقتی رطوبت از ۸۰٪ بیشتر است باران نشان می‌دهد، چون یک نفر آن شرط را نوشته. این چیست؟",
      options: ["یک مدلِ یادگرفته", "یک قانونِ نوشته", "یک هوش عمومی"],
      explain: "اگر یک نفر شرط را نوشته باشد، قانون است. مدلِ یادگرفته با مثال تنظیم می‌شود.",
    },
  },
  "place-train": {
    fr: {
      prompt: "En mots simples, « entraîner » un modèle veut surtout dire…",
      options: ["Lui poser une question", "L’ajuster à partir d’exemples", "Effacer les données à la fin"],
      explain: "L’entraînement est la phase d’apprentissage. S’en servir ensuite s’appelle l’inférence.",
    },
    fa: {
      prompt: "به زبان ساده، «آموزش» یک مدل بیشتر یعنی…",
      options: ["از آن سؤال پرسیدن", "تنظیم کردنش با مثال‌ها", "پاک کردن داده‌ها در پایان"],
      explain: "آموزش همان مرحلهٔ یادگیری است. استفادهٔ بعدی را استنباط می‌نامند.",
    },
  },
  "place-invent": {
    fr: {
      prompt: "Un chatbot cite un article de recherche qui n’existe pas. Le nom le plus proche de cet échec est…",
      options: ["Hallucination", "Chiffrement", "Une fenêtre de contexte plus longue"],
      explain: "Un texte fluide n’est pas une source. Inventer des détails est un échec connu.",
    },
    fa: {
      prompt: "یک چت‌بات نام مقاله‌ای را می‌گوید که وجود ندارد. نزدیک‌ترین نام این خطا چیست؟",
      options: ["توهم", "رمزنگاری", "پنجرهٔ زمینهٔ بلندتر"],
      explain: "متن روان منبع نیست. جزئیات ساختگی یک خطای شناخته‌شده است.",
    },
  },
  "place-next": {
    fr: {
      prompt: "Le geste de base d’un modèle de langue est le plus proche de…",
      options: [
        "Retrouver une copie enregistrée et la coller",
        "Noter les prochains morceaux de texte possibles",
        "Chercher le web en direct par défaut",
      ],
      explain: "Il continue le texte en notant ce qui a tendance à suivre. Ce n’est pas une bibliothèque de copies.",
    },
    fa: {
      prompt: "کار اصلی یک مدل زبانی نزدیک‌تر است به…",
      options: ["پیدا کردن یک متن ذخیره‌شده و چسباندنش", "امتیاز دادن به تکه‌های بعدیِ ممکن", "جستجوی زندهٔ وب، به‌طور پیش‌فرض"],
      explain: "متن را با امتیاز دادن به آنچه معمولاً بعد می‌آید ادامه می‌دهد. کتابخانهٔ مقاله‌های آماده نیست.",
    },
  },
  "place-rag": {
    fr: {
      prompt: "La génération augmentée par recherche (RAG) se décrit le mieux comme…",
      options: [
        "Rendre le modèle plus gros",
        "Aller chercher un texte source et demander au modèle de s’en servir",
        "Couper le hasard pour toujours",
      ],
      explain: "Le RAG apporte des documents au moment de la question, pour appuyer la réponse sur ces sources.",
    },
    fa: {
      prompt: "تولیدِ تقویت‌شده با بازیابی (RAG) بهتر است این‌طور توصیف شود…",
      options: ["بزرگ‌تر کردن مدل", "آوردن متن منبع و خواستن از مدل که از آن استفاده کند", "خاموش کردن تصادف برای همیشه"],
      explain: "RAG هنگام سؤال سند می‌آورد تا جواب به همان منبع تکیه کند.",
    },
  },
  "place-temp": {
    fr: {
      prompt: "Augmenter la température d’un modèle…",
      options: [
        "Ajoute des faits que le modèle ignorait",
        "Rend le choix parmi les mots probables plus aléatoire",
        "Augmente toujours la justesse",
      ],
      explain: "La température change le tirage, pas le savoir. Plus chaud veut dire plus varié, pas plus juste.",
    },
    fa: {
      prompt: "بالا بردن دمای مدل…",
      options: ["واقعیتی اضافه می‌کند که مدل نمی‌دانست", "انتخاب بین واژه‌های محتمل را تصادفی‌تر می‌کند", "همیشه دقت را بالا می‌برد"],
      explain: "دما نوع انتخاب را عوض می‌کند، نه دانش را. داغ‌تر یعنی متنوع‌تر، نه درست‌تر.",
    },
  },
  "place-eval": {
    fr: {
      prompt: "Si vous ne notez un modèle que sur des exemples déjà vus à l’entraînement, vous mesurez surtout…",
      options: ["La mémorisation", "Son comportement sur des cas nouveaux", "S’il est sûr à déployer"],
      explain: "Un contrôle honnête utilise des exemples absents de l’entraînement. Sinon vous voyez surtout la mémoire.",
    },
    fa: {
      prompt: "اگر مدل را فقط با مثال‌هایی بسنجید که در آموزش دیده، بیشتر چه چیزی را اندازه می‌گیرید؟",
      options: ["حفظ کردن", "رفتارش روی موردهای تازه", "اینکه پخش کردنش امن است"],
      explain: "سنجش منصفانه از مثال‌هایی استفاده می‌کند که مدل با آن‌ها آموزش ندیده. وگرنه بیشتر حافظه را می‌بینید.",
    },
  },
  "place-agent": {
    fr: {
      prompt: "Donner des outils à un modèle (envoyer un e-mail, lancer du code, déplacer de l’argent) est plus risqué que le chat surtout parce que…",
      options: ["Les phrases deviennent plus longues", "Il peut agir, pas seulement écrire", "Les outils le rendent toujours plus juste"],
      explain: "Le danger, ce sont les effets. Une mauvaise phrase coûte peu. Une mauvaise action peut coûter cher.",
    },
    fa: {
      prompt: "دادن ابزار به مدل (فرستادن ایمیل، اجرای کد، جابه‌جایی پول) از چت خطرناک‌تر است، بیشتر چون…",
      options: ["جمله‌ها بلندتر می‌شوند", "می‌تواند کار انجام دهد، نه فقط بنویسد", "ابزار همیشه آن را دقیق‌تر می‌کند"],
      explain: "خطر در اثر کار است. جملهٔ غلط ارزان است. کار غلط می‌تواند گران باشد.",
    },
  },
  "place-holdout": {
    fr: {
      prompt: "Un jeu de test (holdout) sert à…",
      options: [
        "Une note finale sur des exemples que le modèle n’a pas utilisés pour apprendre",
        "Les exemples avec lesquels le modèle apprend",
        "Choisir le logo",
      ],
      explain: "Si vous entraînez sur le test, vous notez une mémoire, pas une compétence.",
    },
    fa: {
      prompt: "مجموعهٔ آزمون (holdout) برای این است که…",
      options: ["نمرهٔ نهایی روی مثال‌هایی که مدل با آن‌ها یاد نگرفته", "مثال‌هایی که مدل از آن‌ها یاد می‌گیرد", "انتخاب نشان"],
      explain: "اگر روی آزمون آموزش بدهید، حافظه را نمره می‌دهید نه مهارت را.",
    },
  },
  "place-embed": {
    fr: {
      prompt: "Un plongement (embedding) est le plus proche de…",
      options: [
        "Une liste de nombres qui représente un mot ou une image",
        "Une citation imprimée",
        "Un historique de chat gardé pour toujours",
      ],
      explain: "Les choses semblables se retrouvent près les unes des autres. « Près » est la géométrie du modèle, pas un dictionnaire.",
    },
    fa: {
      prompt: "یک تعبیه (embedding) نزدیک‌تر است به…",
      options: ["فهرستی از عددها که جای یک واژه یا تصویر می‌ایستد", "یک نقل‌قول چاپی", "تاریخچهٔ چتی که برای همیشه مانده"],
      explain: "چیزهای شبیه کنار هم می‌نشینند. «نزدیک» هندسهٔ مدل است، نه تعریف فرهنگ لغت.",
    },
  },
  "place-rail": {
    fr: {
      prompt: "Un garde-fou dans un produit est…",
      options: [
        "Un contrôle autour du modèle qui limite ce qu’il peut faire",
        "La preuve que le modèle est devenu prudent",
        "Une température plus haute",
      ],
      explain: "Les garde-fous limitent les dégâts. Ils ne rendent pas le modèle sage.",
    },
    fa: {
      prompt: "یک حفاظ در محصول یعنی…",
      options: ["کنترلی دور مدل که محدود می‌کند چه کارهایی بکند", "اثبات اینکه مدل محتاط شده", "دمای بالاتر"],
      explain: "حفاظ آسیب را محدود می‌کند. مدل را دانا نمی‌کند.",
    },
  },
  "place-adapt": {
    fr: {
      prompt: "Une consigne et un affinage diffèrent parce que…",
      options: [
        "Une consigne change un appel. Un affinage change le modèle avec des exemples en plus",
        "Ce sont deux noms pour la température",
        "Un affinage n’est qu’une note système plus longue",
      ],
      explain: "Utilisez une consigne quand vous pouvez montrer le matériel à chaque fois. Entraînez quand le comportement doit rester, et que vous pouvez le tester.",
    },
    fa: {
      prompt: "یک دستور و یک تنظیم دقیق فرق دارند چون…",
      options: [
        "دستور یک بار صدا زدن را عوض می‌کند. تنظیم دقیق خود مدل را با مثال اضافه عوض می‌کند",
        "دو نام برای دما هستند",
        "تنظیم دقیق فقط یک یادداشت سیستمی بلندتر است",
      ],
      explain: "وقتی هر بار می‌توانید ماده را نشان دهید از دستور استفاده کنید. وقتی رفتار باید بماند و می‌توانید آن را بیازمایید، آموزش دهید.",
    },
  },
};

export function placementView(question: PlacementQuestion, locale: Locale): View {
  const translated = locale === "en" ? null : copy[question.id]?.[locale];
  const labels = translated?.options ?? question.options;
  return {
    prompt: translated?.prompt ?? question.prompt,
    explain: translated?.explain ?? question.explain,
    options: question.options.map((value, index) => ({ value, label: labels[index] ?? value })),
  };
}

export function placementList(locale: Locale) {
  return placementQuestions.map((question) => ({ question, view: placementView(question, locale) }));
}
