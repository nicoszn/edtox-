import type { OutputBlockData } from "@editorjs/editorjs";

function inlineMdToHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/__(.+?)__/g, "<b>$1</b>")
    .replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, "<i>$1</i>")
    .replace(/(?<!_)_(?!_)(.+?)_(?!_)/g, "<i>$1</i>")
    .replace(/`(.+?)`/g, "<code class=\"inline-code\">$1</code>")
    .replace(/\[(.+?)\]\((\S+?)\)/g, '<a href="$2">$1</a>');
}

function block(type: string, data: Record<string, unknown>): OutputBlockData {
  return { id: crypto.randomUUID().slice(0, 10), type, data };
}

interface ListNode {
  content: string;
  items: ListNode[];
}

/** Groups consecutive same-style list lines (by indent) into a nested list structure. */
function buildListItems(lines: { indent: number; text: string }[]): ListNode[] {
  const root: ListNode[] = [];
  const stack: { indent: number; node: ListNode }[] = [];

  for (const line of lines) {
    const node: ListNode = { content: inlineMdToHtml(line.text), items: [] };
    while (stack.length && stack[stack.length - 1].indent >= line.indent) stack.pop();
    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].node.items.push(node);
    }
    stack.push({ indent: line.indent, node });
  }
  return root;
}

/**
 * Parses a markdown string into Editor.js OutputBlockData[]. Covers the
 * subset our registered tools render: headings, paragraphs, bold/italic/
 * inline-code/links, ordered & unordered lists (with indentation nesting),
 * blockquotes, fenced code blocks, tables, and horizontal rules.
 */
export function markdownToBlocks(markdown: string): OutputBlockData[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: OutputBlockData[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    // Fenced code block — check language tag first for mermaid, otherwise generic code
    if (/^```/.test(line.trim())) {
      const fenceLine = line.trim();
      const lang = fenceLine.replace(/^```/, "").trim().toLowerCase();
      const contentLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        contentLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence

      if (lang === "mermaid") {
        blocks.push(block("mermaid", { source: contentLines.join("\n") }));
      } else {
        blocks.push(block("code", { code: contentLines.join("\n") }));
      }
      continue;
    }

    // Block math: $$...$$ on its own (possibly multi-line)
    if (/^\$\$/.test(line.trim())) {
      const firstLine = line.trim();
      if (firstLine.length > 2 && firstLine.endsWith("$$")) {
        // single-line $$...$$ 
        blocks.push(block("mathBlock", { latex: firstLine.slice(2, -2).trim() }));
        i++;
        continue;
      }
      const mathLines: string[] = [firstLine.replace(/^\$\$/, "")];
      i++;
      while (i < lines.length && !/\$\$\s*$/.test(lines[i])) {
        mathLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) {
        mathLines.push(lines[i].replace(/\$\$\s*$/, ""));
        i++;
      }
      blocks.push(block("mathBlock", { latex: mathLines.join("\n").trim() }));
      continue;
    }

    // Heading
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 3); // our Header tool caps at 3
      blocks.push(block("header", { text: inlineMdToHtml(headingMatch[2]), level }));
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push(block("delimiter", {}));
      i++;
      continue;
    }

    // Blockquote (collect consecutive '>' lines)
    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push(block("quote", { text: inlineMdToHtml(quoteLines.join(" ")), caption: "" }));
      continue;
    }

    // Table (header row + separator row + body rows, pipe-delimited)
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      const rows: string[][] = [];
      const parseRow = (raw: string) =>
        raw
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim());
      rows.push(parseRow(line));
      i += 2; // skip header + separator
      while (i < lines.length && lines[i].includes("|")) {
        rows.push(parseRow(lines[i]));
        i++;
      }
      blocks.push(block("table", { withHeadings: true, content: rows }));
      continue;
    }

    // Lists (- * + for unordered, "1." for ordered), with indentation nesting
    const listLineRe = /^(\s*)([-*+]|\d+\.)\s+(.*)$/;
    if (listLineRe.test(line)) {
      const firstMatch = listLineRe.exec(line)!;
      const ordered = /\d+\./.test(firstMatch[2]);
      const collected: { indent: number; text: string }[] = [];
      while (i < lines.length) {
        const m = listLineRe.exec(lines[i]);
        if (!m) break;
        collected.push({ indent: m[1].length, text: m[3] });
        i++;
      }
      blocks.push(
        block("list", { style: ordered ? "ordered" : "unordered", items: buildListItems(collected) })
      );
      continue;
    }

    // Paragraph: collect consecutive plain lines until a blank line or new construct
    const paraLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^>/.test(lines[i]) &&
      !listLineRe.test(lines[i]) &&
      !/^```/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push(block("paragraph", { text: inlineMdToHtml(paraLines.join(" ")) }));
  }

  return blocks;
}

/** Quick heuristic: does this pasted text look like markdown worth auto-converting? */
export function looksLikeMarkdown(text: string): boolean {
  if (!text || text.length < 2) return false;
  const signals = [
    /^#{1,6}\s+\S/m,
    /\*\*[^*]+\*\*/,
    /^[-*+]\s+\S/m,
    /^\d+\.\s+\S/m,
    /^>\s?\S/m,
    /^```/m,
    /^\|.+\|$/m,
    /^\$\$/m,
    /^```mermaid/m,
  ];
  return signals.some((re) => re.test(text));
}
