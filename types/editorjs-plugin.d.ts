declare module '@editorjs/header' {
  import { BlockToolConstructable } from '@editorjs/editorjs';
  const Header: BlockToolConstructable;
  export default Header;
}

declare module '@editorjs/list' {
  import { BlockToolConstructable } from '@editorjs/editorjs';
  const List: BlockToolConstructable;
  export default List;
}

declare module '@editorjs/quote' {
  import { BlockToolConstructable } from '@editorjs/editorjs';
  const Quote: BlockToolConstructable;
  export default Quote;
}

declare module '@editorjs/code' {
  import { BlockToolConstructable } from '@editorjs/editorjs';
  const Code: BlockToolConstructable;
  export default Code;
}

declare module '@editorjs/table' {
  import { BlockToolConstructable } from '@editorjs/editorjs';
  const Table: BlockToolConstructable;
  export default Table;
}

declare module '@editorjs/delimiter' {
  import { BlockToolConstructable } from '@editorjs/editorjs';
  const Delimiter: BlockToolConstructable;
  export default Delimiter;
}

declare module '@editorjs/inline-code' {
  import { InlineToolConstructable } from '@editorjs/editorjs';
  const InlineCode: InlineToolConstructable;
  export default InlineCode;
}

declare module '@editorjs/marker' {
  import { InlineToolConstructable } from '@editorjs/editorjs';
  const Marker: InlineToolConstructable;
  export default Marker;
}

// Optional: Include this if your Citation tool is an installed package
declare module '@editorjs/citation' {
  import { BlockToolConstructable } from '@editorjs/editorjs';
  const Citation: BlockToolConstructable;
  export default Citation;
}
