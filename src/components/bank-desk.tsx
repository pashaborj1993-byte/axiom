import { useEffect, useState, type FormEvent } from "react";
import { lessons } from "@/data/curriculum";
import type { BankQuestion, FieldNote, HouseAd } from "@/lib/bank-types";

type Desk = {
  lessonId: string;
  questions: BankQuestion[];
  notes: FieldNote[];
  ads: HouseAd[];
  counts: { accounts: number; questions: number; notes: number };
};

export function BankDesk() {
  const [lessonId, setLessonId] = useState(lessons[0]?.id ?? "");
  const [desk, setDesk] = useState<Desk | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function load(id: string) {
    const { loadBankDesk } = await import("@/lib/bank.functions");
    const next = await loadBankDesk({ data: id });
    setDesk(next);
    setLessonId(next.lessonId);
  }

  useEffect(() => {
    let cancel = false;
    void (async () => {
      try {
        const { loadBankDesk } = await import("@/lib/bank.functions");
        const next = await loadBankDesk({ data: lessonId });
        if (!cancel) setDesk(next);
      } catch (caught) {
        if (!cancel) setError(caught instanceof Error ? caught.message : "The bank didn’t open.");
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  async function run(task: () => Promise<void>) {
    setPending(true);
    setError("");
    try {
      await task();
      await load(lessonId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That didn’t save.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="font-serif text-2xl">Bank</h2>
      <p className="mt-1 max-w-xl text-sm text-pretty text-muted">
        Questions, ads, and field notes live in SQL. Edit them here. A field note needs a date and an https source. Do not write a claim you cannot point at.
      </p>
      {desk ? (
        <p className="mt-2 text-sm tabular-nums text-muted">
          {desk.counts.accounts} accounts · {desk.counts.questions} questions · {desk.counts.notes} live notes
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-copper">{error}</p> : null}

      <form
        className="surface-card mt-4 space-y-2 rounded-2xl px-4 py-4"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          void run(async () => {
            const { publishNote } = await import("@/lib/bank.functions");
            await publishNote({
              data: {
                title: String(data.get("title") ?? ""),
                summary: String(data.get("summary") ?? ""),
                sourceName: String(data.get("sourceName") ?? ""),
                sourceUrl: String(data.get("sourceUrl") ?? ""),
                publishedOn: String(data.get("publishedOn") ?? ""),
              },
            });
            event.currentTarget.reset();
          });
        }}
      >
        <h3 className="font-serif text-xl">New field note</h3>
        <input name="title" required placeholder="Title" className="h-11 w-full rounded-xl bg-paper px-3" />
        <textarea name="summary" required placeholder="What is true, and what it does not claim" className="h-20 w-full rounded-xl bg-paper px-3 py-2" />
        <div className="grid gap-2 sm:grid-cols-2">
          <input name="sourceName" required placeholder="Source name" className="h-11 rounded-xl bg-paper px-3" />
          <input name="publishedOn" required type="date" className="h-11 rounded-xl bg-paper px-3" />
        </div>
        <input name="sourceUrl" required placeholder="https://…" className="h-11 w-full rounded-xl bg-paper px-3" />
        <button type="submit" disabled={pending} className="press h-11 rounded-xl bg-pine px-4 text-sm font-semibold text-paper disabled:opacity-60">
          Publish note
        </button>
      </form>

      {desk ? (
        <ul className="mt-3 space-y-2">
          {desk.notes.map((note) => (
            <li key={note.id} className="surface-card rounded-xl px-4 py-3 text-sm">
              <p className="font-semibold">{note.title}</p>
              <p className="text-muted">{note.publishedOn} · {note.sourceName}</p>
              <button
                type="button"
                className="mt-2 font-semibold text-copper"
                onClick={() =>
                  void run(async () => {
                    const { retireNote } = await import("@/lib/bank.functions");
                    await retireNote({ data: { id: note.id, active: false } });
                  })
                }
              >
                Retire
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-8">
        <label className="text-sm font-semibold" htmlFor="bank-lesson">
          Lesson questions
        </label>
        <select
          id="bank-lesson"
          value={lessonId}
          className="mt-2 h-11 w-full rounded-xl bg-paper px-3"
          onChange={(event) => {
            const id = event.target.value;
            setLessonId(id);
            void load(id).catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load."));
          }}
        >
          {lessons.map((lesson) => (
            <option key={lesson.id} value={lesson.id}>
              {lesson.title}
            </option>
          ))}
        </select>
        <ul className="mt-3 space-y-3">
          {desk?.questions.map((question) => (
            <li key={question.id}>
              <QuestionRow
                question={question}
                disabled={pending}
                onSave={(next) =>
                  void run(async () => {
                    const { editQuestion } = await import("@/lib/bank.functions");
                    await editQuestion({ data: next });
                  })
                }
              />
            </li>
          ))}
        </ul>
        <AddChoice
          lessonId={lessonId}
          disabled={pending}
          onAdd={(input) =>
            void run(async () => {
              const { addBankChoice } = await import("@/lib/bank.functions");
              await addBankChoice({ data: input });
            })
          }
        />
      </div>

      <div className="mt-8">
        <h3 className="font-serif text-xl">Ads</h3>
        <ul className="mt-3 space-y-2">
          {desk?.ads.map((ad) => (
            <li key={ad.id} className="surface-card rounded-xl px-4 py-3 text-sm">
              <p className="font-semibold">{ad.title}</p>
              <p className="text-muted">
                {ad.placement === "hearts" ? "Out of hearts" : "After a lesson"} · {ad.active ? "Running" : "Paused"}
                {ad.rewardHearts ? ` · ${ad.rewardHearts} heart` : ""}
                {ad.rewardGems ? ` · ${ad.rewardGems} gems` : ""}
              </p>
              <button
                type="button"
                className="mt-2 font-semibold text-pine"
                onClick={() =>
                  void run(async () => {
                    const { pauseAd } = await import("@/lib/bank.functions");
                    await pauseAd({ data: { id: ad.id, active: !ad.active } });
                  })
                }
              >
                {ad.active ? "Pause" : "Run"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function QuestionRow({
  question,
  disabled,
  onSave,
}: {
  question: BankQuestion;
  disabled: boolean;
  onSave: (next: { id: string; prompt: string; explain: string; active: boolean }) => void;
}) {
  const [prompt, setPrompt] = useState(question.prompt);
  const [explain, setExplain] = useState(question.explain);
  const [active, setActive] = useState(question.active);
  return (
    <form
      className="surface-card space-y-2 rounded-xl px-4 py-3"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        onSave({ id: question.id, prompt, explain, active });
      }}
    >
      <p className="text-xs font-semibold tracking-widest text-muted uppercase">{question.kind}</p>
      <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} className="h-16 w-full rounded-lg bg-paper px-3 py-2 text-sm" />
      <textarea value={explain} onChange={(event) => setExplain(event.target.value)} className="h-14 w-full rounded-lg bg-paper px-3 py-2 text-sm" />
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
          On the path
        </label>
        <button type="submit" disabled={disabled} className="text-sm font-semibold text-pine disabled:opacity-60">
          Save
        </button>
      </div>
    </form>
  );
}

function AddChoice({
  lessonId,
  disabled,
  onAdd,
}: {
  lessonId: string;
  disabled: boolean;
  onAdd: (input: { lessonId: string; prompt: string; options: string[]; answer: string; explain: string }) => void;
}) {
  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const options = [String(data.get("a") ?? ""), String(data.get("b") ?? ""), String(data.get("c") ?? "")].filter(Boolean);
        onAdd({
          lessonId,
          prompt: String(data.get("prompt") ?? ""),
          options,
          answer: String(data.get("answer") ?? ""),
          explain: String(data.get("explain") ?? ""),
        });
        event.currentTarget.reset();
      }}
    >
      <p className="text-sm font-semibold">Add a choice</p>
      <input name="prompt" placeholder="Prompt" className="h-11 w-full rounded-xl bg-paper px-3" />
      <input name="a" placeholder="Option A, the correct one" className="h-11 w-full rounded-xl bg-paper px-3" />
      <input name="b" placeholder="Option B" className="h-11 w-full rounded-xl bg-paper px-3" />
      <input name="c" placeholder="Option C, optional" className="h-11 w-full rounded-xl bg-paper px-3" />
      <input name="answer" placeholder="Paste the correct option" className="h-11 w-full rounded-xl bg-paper px-3" />
      <input name="explain" placeholder="Why" className="h-11 w-full rounded-xl bg-paper px-3" />
      <button type="submit" disabled={disabled} className="press h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-paper disabled:opacity-60">
        Add to this lesson
      </button>
    </form>
  );
}
