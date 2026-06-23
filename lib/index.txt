import Header from "@editorjs/header";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import Code from "@editorjs/code";
import Table from "@editorjs/table";
import Delimiter from "@editorjs/delimiter";
import InlineCode from "@editorjs/inline-code";
import Marker from "@editorjs/marker";
import Citation from "@/lib/tools/citation";

export const EDITOR_TOOLS = {
  header: {
    class: Header,
    config: { levels: [1, 2, 3], defaultLevel: 2, placeholder: "Heading" },
  },
  list: {
    class: List,
    inlineToolbar: true,
    config: { defaultStyle: "unordered" },
  },
  quote: {
    class: Quote,
    inlineToolbar: true,
    config: { quotePlaceholder: "Quote", captionPlaceholder: "Attribution" },
  },
  code: { class: Code },
  table: {
    class: Table,
    inlineToolbar: true,
    config: { rows: 2, cols: 2 },
  },
  delimiter: Delimiter,
  inlineCode: InlineCode,
  marker: Marker,
  citation: { class: Citation },
};
