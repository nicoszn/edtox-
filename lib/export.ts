import type { OutputData } from "@editorjs/editorjs";

function blockToMarkdown(block: OutputData["blocks"][number]): string {
  const d = block.data as Record<string, unknown>;
  switch (block.type) {
    case "header": {
      const level = Number(d.level) || 2;
      return `${"#".repeat(level)} ${stripTags(String(d.text ?? ""))}`;
    }
    case "paragraph":
      return stripTags(String(d.text ?? ""));
    case "quote": {
      const text = stripTags(String(d.text ?? ""));
      const caption = stripTags(String(d.caption ?? ""));
      return caption ? `> ${text}\n> — ${caption}` : `> ${text}`;
    }
    case "list": {
      const items = (d.items as unknown[]) ?? [];
      const ordered = d.style === "ordered";
      const render = (list: unknown[], depth: number): string[] =>
        list.flatMap((item, i) => {
          const obj = typeof item === "string" ? { content: item, items: [] } : (item as { content?: string; items?: unknown[] });
          const prefix = ordered ? `${i + 1}.` : "-";
          const indent = "  ".repeat(depth);
          const line = `${indent}${prefix} ${stripTags(obj.content ?? "")}`;
          const children = obj.items?.length ? render(obj.items, depth + 1) : [];
          return [line, ...children];
        });
      return render(items, 0).join("\n");
    }
    case "code":
      return "```\n" + String(d.code ?? "") + "\n```";
    case "table": {
      const rows = (d.content as string[][]) ?? [];
      if (!rows.length) return "";
      const [head, ...body] = rows;
      const headRow = `| ${head.map(stripTags).join(" | ")} |`;
      const sep = `| ${head.map(() => "---").join(" | ")} |`;
      const bodyRows = body.map((r) => `| ${r.map(stripTags).join(" | ")} |`);
      return [headRow, sep, ...bodyRows].join("\n");
    }
    case "delimiter":
      return "---";
    case "citation": {
      const author = String(d.author ?? "");
      const year = String(d.year ?? "");
      const source = String(d.source ?? "");
      return `> **${author}** (${year}). *${source}*`;
    }
    default:
      return "";
  }
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

export function toMarkdown(data: OutputData): string {
  return data.blocks.map(blockToMarkdown).filter(Boolean).join("\n\n");
}

export function exportMarkdown(title: string, data: OutputData): void {
  const body = toMarkdown(data);
  const content = `# ${title || "Untitled document"}\n\n${body}\n`;
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(title || "untitled").trim().replace(/\s+/g, "-").toLowerCase()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
