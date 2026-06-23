"use client";

import { useState } from "react";
import type { OutputData } from "@editorjs/editorjs";
import { exportMarkdown } from "@/lib/export";

const TOOL_HINTS = [
  { key: "/", label: "block menu" },
  { key: "Tab", label: "indent list" },
  { key: "Cmd+B", label: "bold" },
  { key: "Cmd+I", label: "italic" },
];

export default function Toolbar({
  title,
  getContent,
}: {
  title: string;
  getContent: () => Promise<OutputData | null>;
}) {
  const [open, setOpen] = useState(false);

  async function handleExport() {
    const data = await getContent();
    if (!data) return;
    exportMarkdown(title, data);
  }

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-20 bg-[var(--color-paper)]/95 backdrop-blur-sm border-t border-[var(--color-rule)] px-4 py-3 sm:px-6 flex items-center justify-between">
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-xs font-[family-name:var(--font-mono)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
        >
          {open ? "hide shortcuts" : "shortcuts"}
        </button>

        <button
          onClick={handleExport}
          className="px-3 py-1.5 rounded-md bg-[var(--color-moss)] text-white text-xs font-medium hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Export .md
        </button>
      </div>

      {open && (
        <div className="fixed bottom-[52px] inset-x-0 z-20 bg-[var(--color-paper)] border-t border-[var(--color-rule)] px-4 py-3 sm:px-6">
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TOOL_HINTS.map((hint) => (
              <li key={hint.key} className="text-xs text-[var(--color-ink-soft)]">
                <span className="font-[family-name:var(--font-mono)] text-[var(--color-ink)]">
                  {hint.key}
                </span>{" "}
                {hint.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
