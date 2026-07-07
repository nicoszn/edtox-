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
import InlineMathTool from "@/lib/tools/inlineMath";
import Citation from "@/lib/tools/citation";
import PageBreak from "@/lib/tools/pagebreak";
import SimpleLink from "@/lib/tools/simplelink";
import MermaidBlock from "@/lib/tools/mermaid";
import MathBlock from "@/lib/tools/mathblock";

import { createIndexedDbUploader, createAttachesUploader } from "@/lib/storage/uploader";

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
      inlineToolbar: ["bold", "italic", "underline", "marker", "inlineMath"],
      tunes: ["alignment"],
      config: {
        preserveBlank: true, // Stops automatic creation of new blocks on simple empty breaks
      },
    },
    header: {
      class: Header,
      inlineToolbar: ["bold", "italic", "underline", "inlineMath"],
      config: {
        levels: [1, 2, 3, 4, 5],
        defaultLevel: 2,
        config: { placeholder: "Enter a heading..." },
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
        captionPlaceholder: "Attribution",
      },
      tunes: ["alignment", "footnotes"],
    },
    code: {
      class: Code,
    },
    table: {
      class: Table,
      inlineToolbar: true,
      config: { rows: 2, cols: 2 },
      tunes: ["alignment"],
    },
    delimiter: {
      class: Delimiter,
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
      class: SimpleLink,
    },
    toc: {
      class: TOC,
    },
    citation: {
      class: Citation,
    },
    pagebreak: {
      class: PageBreak,
    },
    mermaid: {
      class: MermaidBlock,
    },
    math: {
      class: MathBlock,
      inlineToolbar: true,
    },

    // ---------- INLINE TOOLS ----------
    inlineCode: {
      class: InlineCode,
    },
    marker: {
      class: Marker,
    },
    underline: {
      class: Underline,
    },
    inlineMath: {
      class: InlineMathTool,
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
