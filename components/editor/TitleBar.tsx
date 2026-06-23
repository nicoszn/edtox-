"use client";

import { useRouter } from "next/navigation";

const WORD_TARGET_DEFAULT = 500;

export default function TitleBar({
  title,
  wordCount,
  pageCount,
  saveState,
  onTitleChange,
  target = WORD_TARGET_DEFAULT,
}: {
  title: string;
  wordCount: number;
  pageCount: number;
  saveState: "idle" | "saving" | "saved";
  onTitleChange: (title: string) => void;
  target?: number;
}) {
  const router = useRouter();
  const progress = Math.min(100, Math.round((wordCount / target) * 100));

  return (
    <div className="sticky top-0 z-10 bg-[var(--color-paper)]/95 backdrop-blur-sm border-b border-[var(--color-rule)] print:hidden">
      <div className="flex items-center gap-3 px-4 pt-3 sm:px-6">
        <button
          onClick={() => router.push("/")}
          aria-label="Back to documents"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] hover:text-[var(--color-ink)] transition-colors text-lg"
        >
          ←
        </button>

        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled document"
          aria-label="Document title"
          className="flex-1 min-w-0 bg-transparent font-[family-name:var(--font-display)] text-xl sm:text-2xl text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)]/50 outline-none truncate"
        />

        <span
          className="shrink-0 text-xs font-[family-name:var(--font-mono)] text-[var(--color-ink-soft)] tabular-nums w-16 text-right"
          aria-live="polite"
        >
          {saveState === "saving" ? "saving…" : saveState === "saved" ? "saved" : ""}
        </span>
      </div>

      <div className="flex items-center gap-3 px-4 pb-2 pt-1.5 sm:px-6">
        <div className="flex-1 h-[2px] bg-[var(--color-rule)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-umber)] transition-[width] duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-[family-name:var(--font-mono)] text-[var(--color-ink-soft)] tabular-nums">
          {wordCount} / {target}
        </span>
        <span className="shrink-0 text-xs font-[family-name:var(--font-mono)] text-[var(--color-ink-soft)] tabular-nums border-l border-[var(--color-rule)] pl-3">
          {pageCount} {pageCount === 1 ? "page" : "pages"}
        </span>
      </div>
    </div>
  );
}
