import type { OutputData } from "@editorjs/editorjs";
import { toExportNodes, type ExportListItem, type ExportNode } from "@/lib/export/model";

function listToText(items: ExportListItem[], ordered: boolean, depth = 0): string[] {
  return items.flatMap((item, i) => {
    const prefix = ordered ? `${i + 1}.` : "•";
    const indent = "  ".repeat(depth);
    return [`${indent}${prefix} ${item.text}`, ...listToText(item.items, ordered, depth + 1)];
  });
}

function nodeToText(node: ExportNode): string {
  switch (node.kind) {
    case "heading":
      return node.text.toUpperCase();
    case "paragraph":
      return node.text;
    case "quote":
      return node.caption ? `"${node.text}" — ${node.caption}` : `"${node.text}"`;
    case "list":
      return listToText(node.items, node.ordered).join("\n");
    case "code":
      return node.code;
    case "table":
      return node.rows.map((r) => r.join("\t")).join("\n");
    case "delimiter":
      return "----------";
    case "citation":
      return `${node.author} (${node.year}). ${node.source}`;
    case "pagebreak":
      return "\f";
    case "math":
      return node.latex;
    case "toc":
      return node.items.map((i) => `${"  ".repeat(i.level - 1)}${i.text}`).join("\n");
    case "image":
      return node.caption ? `[Image: ${node.caption}]` : "[Image]";
    case "attachment":
      return `[Attachment: ${node.name}]`;
    case "link":
      return node.label ? `${node.label} (${node.url})` : node.url;
    case "diagram":
      return `[Diagram]\n${node.source}`;
    default:
      return "";
  }
}

export function toPlainText(title: string, data: OutputData): string {
  const body = toExportNodes(data).map(nodeToText).filter(Boolean).join("\n\n");
  return `${(title || "Untitled document").toUpperCase()}\n\n${body}\n`;
}
