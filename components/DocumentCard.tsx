"use client";

import { useRouter } from "next/navigation";
import type { DocumentMeta } from "@/types/document";
import { deleteDocument } from "@/lib/storage/documents";

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function DocumentCard({
  doc,
  onDeleted,
}: {
  doc: DocumentMeta;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(`Delete "${doc.title}"? This can't be undone.`)) return;
    await deleteDocument(doc.id);
    onDeleted(doc.id);
  }

  return (
    <button
      onClick={() => router.push(`/editor/${doc.id}`)}
      className="group w-full text-left flex items-center gap-4 px-4 py-4 sm:px-5 rounded-lg border border-[var(--color-rule)] bg-white/40 hover:bg-white hover:border-[var(--color-umber-soft)] transition-colors"
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-[family-name:var(--font-display)] text-base sm:text-lg text-[var(--color-ink)] truncate">
          {doc.title || "Untitled document"}
        </h3>
        <p className="mt-1 text-xs font-[family-name:var(--font-mono)] text-[var(--color-ink-soft)]">
          {formatDate(doc.updatedAt)} · {doc.wordCount} {doc.wordCount === 1 ? "word" : "words"} ·{" "}
          {doc.pageCount} {doc.pageCount === 1 ? "page" : "pages"}
        </p>
      </div>
      <span
        onClick={handleDelete}
        role="button"
        aria-label={`Delete ${doc.title}`}
        className="shrink-0 text-[var(--color-ink-soft)] hover:text-[var(--color-danger)] active:text-[var(--color-danger)] text-xs font-[family-name:var(--font-mono)] px-2 py-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
      >
        delete
      </span>
    </button>
  );
}
