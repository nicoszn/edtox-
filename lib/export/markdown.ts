import type { OutputData } from "@editorjs/editorjs";
import { toExportNodes, type ExportListItem, type ExportNode } from "@/lib/export/model";

function listToMarkdown(items: ExportListItem[], ordered: boolean, depth = 0): string[] {
  return items.flatMap((item, i) => {
    const prefix = ordered ? `${i + 1}.` : "-";
    const indent = "  ".repeat(depth);
    const line = `${indent}${prefix} ${item.text}`;
    return [line, ...listToMarkdown(item.items, ordered, depth + 1)];
  });
}

function nodeToMarkdown(node: ExportNode): string {
  switch (node.kind) {
    case "heading":
      return `${"#".repeat(node.level)} ${node.text}`;
    case "paragraph":
      return node.text;
    case "quote":
      return node.caption ? `> ${node.text}\n> — ${node.caption}` : `> ${node.text}`;
    case "list":
      return listToMarkdown(node.items, node.ordered).join("\n");
    case "code":
      return "```\n" + node.code + "\n```";
    case "table": {
      if (!node.rows.length) return "";
      const [head, ...body] = node.rows;
      return [
        `| ${head.join(" | ")} |`,
        `| ${head.map(() => "---").join(" | ")} |`,
        ...body.map((r) => `| ${r.join(" | ")} |`),
      ].join("\n");
    }
    case "delimiter":
      return "---";
    case "citation":
      return `> **${node.author}** (${node.year}). *${node.source}*`;
    case "pagebreak":
      return "\n\\pagebreak\n";
    case "math":
      return `$$${node.latex}$$`;
    case "toc":
      return node.items.map((i) => `${"  ".repeat(i.level - 1)}- ${i.text}`).join("\n");
    case "image":
      return node.caption ? `![${node.caption}](${node.url ?? ""})` : `![](${node.url ?? ""})`;
    case "attachment":
      return `[📎 ${node.name}](${node.assetId ?? ""})`;
    case "link":
      return node.label ? `[${node.label}](${node.url})` : node.url;
    default:
      return "";
  }
}

export function toMarkdown(title: string, data: OutputData): string {
  const body = toExportNodes(data).map(nodeToMarkdown).filter(Boolean).join("\n\n");
  return `# ${title || "Untitled document"}\n\n${body}\n`;
}
