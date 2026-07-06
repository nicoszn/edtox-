import { createEditor, Transforms, Editor, Element, Range } from "slate"
import { withReact } from "slate-react"
import { withHistory } from "slate-history"
import { VOID_TYPES, INLINE_TYPES, CustomElement } from "@/lib/slate/types"

export function createSlateEditor() {
  const editor = withHistory(withReact(createEditor()))

  const { isVoid, isInline, insertBreak } = editor

  editor.isVoid = (element) =>
    VOID_TYPES.includes((element as CustomElement).type) || isVoid(element)

  editor.isInline = (element) =>
    INLINE_TYPES.includes((element as CustomElement).type) || isInline(element)

  // Enter on a void block → insert paragraph after, don't break inside
  editor.insertBreak = () => {
    const [match] = Editor.nodes(editor, {
      match: (n) =>
        Element.isElement(n) && editor.isVoid(n) && !editor.isInline(n),
    })
    if (match) {
      const [, path] = match
      Transforms.insertNodes(
        editor,
        { type: "paragraph", children: [{ text: "" }] } as CustomElement,
        { at: [path[0] + 1], select: true }
      )
      return
    }
    insertBreak()
  }

  return editor
}

export const INITIAL_VALUE: CustomElement[] = [
  { type: "paragraph", children: [{ text: "" }] },
]
