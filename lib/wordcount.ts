import type { OutputData } from "@editorjs/editorjs";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ");
}

function countInText(text: string): number {
  const cleaned = stripHtml(text).trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

/**
 * Walks Editor.js output blocks and counts words across the text-bearing
 * fields of every block type we support, including the custom citation tool.
 */
export function countWords(data: OutputData): number {
  if (!data?.blocks?.length) return 0;

  let total = 0;
  for (const block of data.blocks) {
    const d = block.data as Record<string, unknown>;
    switch (block.type) {
      case "paragraph":
      case "header":
        total += countInText((d.text as string) ?? "");
        break;
      case "quote":
        total += countInText((d.text as string) ?? "");
        total += countInText((d.caption as string) ?? "");
        break;
      case "list": {
        const items = (d.items as unknown[]) ?? [];
        const walk = (list: unknown[]) => {
          for (const item of list) {
            if (typeof item === "string") {
              total += countInText(item);
            } else if (item && typeof item === "object") {
              const obj = item as { content?: string; items?: unknown[] };
              total += countInText(obj.content ?? "");
              if (obj.items?.length) walk(obj.items);
            }
          }
        };
        walk(items);
        break;
      }
      case "code":
        total += countInText((d.code as string) ?? "");
        break;
      case "table": {
        const content = (d.content as string[][]) ?? [];
        for (const row of content) for (const cell of row) total += countInText(cell);
        break;
      }
      case "citation":
        total += countInText((d.author as string) ?? "");
        total += countInText((d.source as string) ?? "");
        break;
      default:
        break;
    }
  }
  return total;
}
