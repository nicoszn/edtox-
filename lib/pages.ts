import type { OutputData, OutputBlockData } from "@editorjs/editorjs";

export const PAGEBREAK_TYPE = "pagebreak";

/** Total pages = number of pagebreak blocks + 1. */
export function countPages(data: OutputData): number {
  if (!data?.blocks?.length) return 1;
  const breaks = data.blocks.filter((b) => b.type === PAGEBREAK_TYPE).length;
  return breaks + 1;
}

/**
 * Splits the flat block array into page groups, for export pipelines that
 * need to render one page at a time (e.g. PDF, docx page breaks).
 */
export function splitIntoPages(data: OutputData): OutputBlockData[][] {
  const pages: OutputBlockData[][] = [[]];
  for (const block of data.blocks) {
    if (block.type === PAGEBREAK_TYPE) {
      pages.push([]);
      continue;
    }
    pages[pages.length - 1].push(block);
  }
  return pages;
}

/** Which page (1-indexed) a given block index falls on. */
export function pageForBlockIndex(data: OutputData, blockIndex: number): number {
  let page = 1;
  for (let i = 0; i < blockIndex; i++) {
    if (data.blocks[i]?.type === PAGEBREAK_TYPE) page++;
  }
  return page;
}
