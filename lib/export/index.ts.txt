import { saveAs } from "file-saver";
import type { OutputData } from "@editorjs/editorjs";
import { toMarkdown } from "@/lib/export/markdown";
import { toPlainText } from "@/lib/export/plaintext";
import { toDocx } from "@/lib/export/docx";
import { toZipBundle } from "@/lib/export/zip";
import { exportToPdf } from "@/lib/export/pdf";

export type ExportFormat = "md" | "txt" | "docx" | "pdf" | "zip";

function safeName(title: string): string {
  return (title || "untitled").trim().replace(/\s+/g, "-").toLowerCase();
}

export async function runExport(
  format: ExportFormat,
  documentId: string,
  title: string,
  data: OutputData
): Promise<void> {
  const base = safeName(title);

  switch (format) {
    case "md": {
      const text = toMarkdown(title, data);
      saveAs(new Blob([text], { type: "text/markdown;charset=utf-8" }), `${base}.md`);
      return;
    }
    case "txt": {
      const text = toPlainText(title, data);
      saveAs(new Blob([text], { type: "text/plain;charset=utf-8" }), `${base}.txt`);
      return;
    }
    case "docx": {
      const blob = await toDocx(title, data);
      saveAs(blob, `${base}.docx`);
      return;
    }
    case "zip": {
      const blob = await toZipBundle(documentId, title, data);
      saveAs(blob, `${base}.zip`);
      return;
    }
    case "pdf": {
      exportToPdf();
      return;
    }
  }
}
