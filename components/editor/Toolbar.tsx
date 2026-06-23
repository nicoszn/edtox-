"use client";

import { useState } from "react";
import type { OutputData } from "@editorjs/editorjs";
import { runExport, type ExportFormat } from "@/lib/export";

const TOOL_HINTS = [
  { key: "/", label: "block menu" },
  { key: "Tab", label: "indent list" },
  { key: "Cmd+B", label: "bold" },
  { key: "Cmd+U", label: "underline" },
];

const EXPORT_OPTIONS: { format: ExportFormat; label: string }[] = [
  { format: "pdf", label: "PDF (print)" },
  { format: "docx", label: "Word (.docx)" },
  { format: "md", label: "Markdown (.md)" },
  { format: "txt", label: "Plain text (.txt)" },
  { format: "zip", label: "Everything (.zip)" },
];

export default function Toolbar({
  documentId,
  title,
  getContent,
}: {
  documentId: string;
  title: string;
  getContent: () => Promise<OutputData | null>;
}) {
  const [hintsOpen, setHintsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  async function handleExport(format: ExportFormat) {
    const data = await getContent();
    if (!data) return;
    setExporting(format);
    try {
      await runExport(format, documentId, title, data);
    } finally {
      setExporting(null);
      setExportOpen(false);
    }
  }

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-20 bg-[var(--color-paper)]/95 backdrop-blur-sm border-t border-[var(--color-rule)] px-4 py-3 sm:px-6 flex items-center justify-between print:hidden">
        <button
          onClick={() => {
            setHintsOpen((v) => !v);
            setExportOpen(false);
          }}
          className="text-xs font-[family-name:var(--font-mono)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
        >
          {hintsOpen ? "hide shortcuts" : "shortcuts"}
        </button>

        <button
          onClick={() => {
            setExportOpen((v) => !v);
            setHintsOpen(false);
          }}
          className="px-3 py-1.5 rounded-md bg-[var(--color-moss)] text-white text-xs font-medium hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Export ▾
        </button>
      </div>

      {hintsOpen && (
        <div className="fixed bottom-[52px] inset-x-0 z-20 bg-[var(--color-paper)] border-t border-[var(--color-rule)] px-4 py-3 sm:px-6 print:hidden">
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

      {exportOpen && (
        <div className="fixed bottom-[52px] right-4 z-20 bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-lg shadow-lg overflow-hidden min-w-[180px] print:hidden">
          {EXPORT_OPTIONS.map((opt) => (
            <button
              key={opt.format}
              onClick={() => handleExport(opt.format)}
              disabled={exporting !== null}
              className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-ink)] hover:bg-[var(--color-rule)] transition-colors disabled:opacity-50 border-b border-[var(--color-rule)] last:border-b-0"
            >
              {exporting === opt.format ? "Exporting…" : opt.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
