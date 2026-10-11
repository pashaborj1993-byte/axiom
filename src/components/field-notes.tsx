import { useEffect, useState } from "react";
import { useT } from "@/i18n/use-t";
import type { FieldNote } from "@/lib/bank-types";

export function FieldNotes() {
  const t = useT();
  const [notes, setNotes] = useState<FieldNote[] | null>(null);

  useEffect(() => {
    let cancel = false;
    void (async () => {
      try {
        const { loadNotes } = await import("@/lib/bank.functions");
        const rows = await loadNotes();
        if (!cancel) setNotes(rows);
      } catch {
        if (!cancel) setNotes([]);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (!notes || notes.length === 0) return null;

  return (
    <section className="rise mb-5">
      <h2 className="font-serif text-xl">{t("fieldNotes")}</h2>
      <p className="mt-1 text-sm text-pretty text-muted">{t("fieldNotesLede")}</p>
      <ul className="mt-3 space-y-3">
        {notes.map((note) => (
          <li key={note.id} className="surface-card rounded-2xl px-4 py-3">
            <p className="text-xs font-semibold tracking-widest text-pine uppercase">{note.publishedOn}</p>
            <p className="mt-1 font-semibold">{note.title}</p>
            <p className="mt-1 text-sm text-pretty text-muted">{note.summary}</p>
            <a
              href={note.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm font-semibold text-pine"
            >
              {note.sourceName}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
