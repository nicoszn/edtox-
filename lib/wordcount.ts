import type { OutputData } from "@editorjs/editorjs";
import { toExportNodes, type ExportListItem, type ExportNode } from "@/lib/export/model";

function wc(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).filter(Boolean).length : 0;
}

function listWords(items: ExportListItem[]): number {
  return items.reduce((sum, item) => sum + wc(item.text) + listWords(item.items), 0);
}

function nodeWords(node: ExportNode): number {
  switch (node.kind) {
    case "heading":
    case "paragraph":
      return wc(node.text);
    case "quote":
      return wc(node.text) + wc(node.caption);
    case "list":
      return listWords(node.items);
    case "code":
      return wc(node.code);
    case "table":
      return node.rows.reduce((sum, row) => sum + row.reduce((s, cell) => s + wc(cell), 0), 0);
    case "citation":
      return wc(node.author) + wc(node.source);
    case "toc":
      return node.items.reduce((sum, i) => sum + wc(i.text), 0);
    case "image":
    case "attachment":
    case "link":
      return 0;
    case "math":
    case "delimiter":
    case "pagebreak":
      return 0;
    default:
      return 0;
  }
}

export function countWords(data: OutputData): number {
  if (!data?.blocks?.length) return 0;
  return toExportNodes(data).reduce((sum, node) => sum + nodeWords(node), 0);
}
