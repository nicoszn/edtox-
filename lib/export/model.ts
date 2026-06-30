import type { OutputData, OutputBlockData } from "@editorjs/editorjs";

export type ExportNode =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "quote"; text: string; caption: string }
  | { kind: "list"; ordered: boolean; items: ExportListItem[] }
  | { kind: "code"; code: string }
  | { kind: "table"; rows: string[][] }
  | { kind: "delimiter" }
  | { kind: "citation"; author: string; year: string; source: string }
  | { kind: "pagebreak" }
  | { kind: "math"; latex: string }
  | { kind: "toc"; items: { text: string; level: number }[] }
  | { kind: "image"; assetId?: string; url?: string; caption: string }
  | { kind: "attachment"; assetId?: string; name: string }
  | { kind: "link"; url: string; label: string }
  | { kind: "diagram"; source: string };

export interface ExportListItem {
  text: string;
  items: ExportListItem[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function listItems(raw: unknown[]): ExportListItem[] {
  return raw.map((item) => {
    if (typeof item === "string") return { text: stripHtml(item), items: [] };
    const obj = item as { content?: string; items?: unknown[] };
    return {
      text: stripHtml(obj.content ?? ""),
      items: obj.items?.length ? listItems(obj.items) : [],
    };
  });
}

/** Converts one Editor.js block into the normalized export node, or null for unrecognized/unsupported types. */
export function toExportNode(block: OutputBlockData): ExportNode | null {
  const d = block.data as Record<string, unknown>;
  switch (block.type) {
    case "header":
      return { kind: "heading", level: Number(d.level) || 2, text: stripHtml(String(d.text ?? "")) };
    case "paragraph":
      return { kind: "paragraph", text: stripHtml(String(d.text ?? "")) };
    case "quote":
      return {
        kind: "quote",
        text: stripHtml(String(d.text ?? "")),
        caption: stripHtml(String(d.caption ?? "")),
      };
    case "list":
      return {
        kind: "list",
        ordered: d.style === "ordered",
        items: listItems((d.items as unknown[]) ?? []),
      };
    case "code":
      return { kind: "code", code: String(d.code ?? "") };
    case "table":
      return {
        kind: "table",
        rows: ((d.content as string[][]) ?? []).map((row) => row.map(stripHtml)),
      };
    case "delimiter":
      return { kind: "delimiter" };
    case "citation":
      return {
        kind: "citation",
        author: String(d.author ?? ""),
        year: String(d.year ?? ""),
        source: String(d.source ?? ""),
      };
    case "pagebreak":
      return { kind: "pagebreak" };
    case "mathBlock":
      return { kind: "math", latex: String(d.latex ?? "") };
    case "toc":
      return {
        kind: "toc",
        items: ((d.items as { text: string; level: number }[]) ?? []).map((i) => ({
          text: stripHtml(i.text),
          level: i.level,
        })),
      };
    case "image": {
      const file = d.file as { assetId?: string; url?: string } | undefined;
      return {
        kind: "image",
        assetId: file?.assetId,
        url: file?.url,
        caption: stripHtml(String(d.caption ?? "")),
      };
    }
    case "attaches": {
      const file = d.file as { assetId?: string; name?: string } | undefined;
      return { kind: "attachment", assetId: file?.assetId, name: file?.name ?? "attachment" };
    }
    case "linkTool":
      return { kind: "link", url: String(d.url ?? ""), label: String(d.label ?? "") };
    case "mermaid":
      return { kind: "diagram", source: String(d.source ?? "") };
    default:
      return null;
  }
}

export function toExportNodes(data: OutputData): ExportNode[] {
  return data.blocks.map(toExportNode).filter((n): n is ExportNode => n !== null);
}
