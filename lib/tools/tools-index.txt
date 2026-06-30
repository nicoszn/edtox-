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
// @ts-expect-error -- package ships no types; CommonJS default export
import TOC from "@phigoro/editorjs-toc";
// @ts-expect-error -- package ships no types
import AlignmentTune from "editorjs-text-alignment-blocktune";
import { InlineMathTool } from "editorjs-mathcyou";
import katex from "katex";
import "katex/dist/katex.min.css";
import Citation from "@/lib/tools/citation";
import PageBreak from "@/lib/tools/pagebreak";
import SimpleLink from "@/lib/tools/simplelink";
import Mermaid from "@/lib/tools/mermaid";
import MathBlock from "@/lib/tools/mathblock";
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
    paragraph: {
      class: asBlockTool(Paragraph),
      inlineToolbar: true,
      tunes: ["alignment"],
    },
    header: {
      class: asBlockTool(Header),
      config: { levels: [1, 2, 3], defaultLevel: 2, placeholder: "Heading" },
      tunes: ["alignment"],
    },
    list: {
      class: asBlockTool(EditorjsList),
      inlineToolbar: true,
      config: { defaultStyle: "unordered" },
      tunes: ["alignment"],
    },
    quote: {
      class: asBlockTool(Quote),
      inlineToolbar: true,
      config: { quotePlaceholder: "Quote", captionPlaceholder: "Attribution" },
      tunes: ["alignment", "footnotes"],
    },
    code: { class: asBlockTool(Code) },
    table: {
      class: asBlockTool(Table),
      inlineToolbar: true,
      config: { rows: 2, cols: 2 },
      tunes: ["alignment"],
    },
    delimiter: asBlockTool(Delimiter),
    inlineCode: asInlineTool(InlineCode),
    marker: asInlineTool(Marker),
    underline: asInlineTool(Underline),

    image: {
      class: asBlockTool(ImageTool),
      config: {
        uploader: createIndexedDbUploader(documentId),
      },
      tunes: ["alignment"],
    },
    attaches: {
      class: asBlockTool(AttachesTool),
      config: {
        uploader: createAttachesUploader(documentId),
      },
    },
    linkTool: { class: asBlockTool(SimpleLink) },

    inlineMath: { class: asInlineTool(InlineMathTool) },
    mathBlock: { class: asBlockTool(MathBlock) },
    mermaid: { class: asBlockTool(Mermaid) },

    toc: { class: asBlockTool(TOC) },

    footnotes: {
      class: asTune(FootnotesTune),
      config: { placeholder: "Footnote text" },
    },
    alignment: {
      class: asTune(AlignmentTune),
      config: { default: "left" },
    },

    citation: { class: asBlockTool(Citation) },
    pagebreak: { class: asBlockTool(PageBreak) },
  };
}

export const ALL_TUNES = ["alignment", "footnotes"];
