import type { BlockToolConstructable, InlineToolConstructable, BlockTuneConstructable } from "@editorjs/editorjs";
import Header from "@editorjs/header";
import Paragraph from "@editorjs/paragraph";
import EditorjsList from "@editorjs/list";
import Quote from "@editorjs/quote";
import Code from "@editorjs/code";
import Table from "@editorjs/table";
import Delimiter from "@editorjs/delimiter";
import InlineCode from "@editorjs/inline-code";
import Marker from "@editorjs/marker";
import Underline from "@editorjs/underline";
import ImageTool from "@editorjs/image";
import AttachesTool from "@editorjs/attaches";
import FootnotesTune from "@editorjs/footnotes";
import TOC from "@phigoro/editorjs-toc";
import AlignmentTune from "editorjs-text-alignment-blocktune";
import { InlineMathTool, MathBlockTool } from "editorjs-mathcyou";
import katex from "katex";
import "katex/dist/katex.min.css";
import Citation from "@/lib/tools/citation";
import PageBreak from "@/lib/tools/pagebreak";
import SimpleLink from "@/lib/tools/simplelink";
import { createIndexedDbUploader, createAttachesUploader } from "@/lib/storage/uploader";

if (typeof window !== "undefined") {
  // editorjs-mathcyou expects KaTeX on window for static/bundled builds.
  (window as unknown as { katex: typeof katex }).katex = katex;
}

/**
 * Several third-party Editor.js tool packages ship type declarations that
 * are looser or stricter than the core BlockToolConstructable/
 * InlineToolConstructable/BlockTuneConstructable interfaces expect — this is
 * the actual source of the TypeScript 6 "config is required" build error.
 * The correct fix (per Editor.js's own docs) is to assert each tool's
 * constructable shape at the point of use, which preserves every package's
 * real config typing instead of erasing it with hand-rolled ambient module
 * declarations.
 */
const asBlockTool = (tool: unknown) => tool as BlockToolConstructable;
const asInlineTool = (tool: unknown) => tool as InlineToolConstructable;
const asTune = (tool: unknown) => tool as BlockTuneConstructable;

/**
 * Tools that need to know which document they belong to (image/attaches,
 * for their IndexedDB uploaders) are built per-document rather than as one
 * static config object.
 */
export function buildEditorTools(documentId: string) {
  return {
  // ---------- BLOCK TOOLS ----------
  paragraph: {
    class: Paragraph,
    inlineToolbar: true,
    tunes: ["alignment"],
  },
  header: {
    class: Header,
    inlineToolbar: true,
    config: { 
      levels:, 
      defaultLevel: 2, 
      placeholder: "Heading" 
    },
    tunes: ["alignment"],
  },
  list: {
    class: EditorjsList,
    inlineToolbar: true,
    config: { defaultStyle: "unordered" },
    tunes: ["alignment"],
  },
  quote: {
    class: Quote,
    inlineToolbar: true,
    config: { 
      quotePlaceholder: "Quote", 
      captionPlaceholder: "Attribution" 
    },
    tunes: ["alignment", "footnotes"],
  },
  code: { 
    class: Code 
  },
  table: {
    class: Table,
    inlineToolbar: true,
    config: { rows: 2, cols: 2 },
    tunes: ["alignment"],
  },
  delimiter: {
    class: Delimiter
  },
  image: {
    class: ImageTool,
    config: {
      uploader: createIndexedDbUploader(documentId),
    },
    tunes: ["alignment"],
  },
  attaches: {
    class: AttachesTool,
    config: {
      uploader: createAttachesUploader(documentId),
    },
  },
  linkTool: { 
    class: SimpleLink 
  },
  mathBlock: { 
    class: MathBlockTool 
  },
  toc: { 
    class: TOC 
  },
  citation: { 
    class: Citation 
  },
  pagebreak: { 
    class: PageBreak 
  },

  // ---------- INLINE TOOLS ----------
  inlineCode: {
    class: InlineCode
  },
  marker: {
    class: Marker
  },
  underline: {
    class: Underline
  },
  inlineMath: { 
    class: InlineMathTool 
  },

  // ---------- BLOCK TUNES ----------
  footnotes: {
    class: FootnotesTune,
    config: { placeholder: "Footnote text" },
  },
  alignment: {
    class: AlignmentTune,
    config: { default: "left" },
  },
};

}

//export const ALL_TUNES = ["alignment", "footnotes"];
