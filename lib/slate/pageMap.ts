import { Editor, Element, NodeEntry } from "slate"
import { CustomEditor, CustomElement } from "@/lib/slate/types"

export interface PageIndex {
  /** WeakMap for O(1) lookup: element object → page number */
  pageOf: WeakMap<CustomElement, number>
  total: number
}

/**
 * Single O(n) pass over the document.
 * Built once per value change, outside renderElement.
 */
export function buildPageIndex(editor: CustomEditor): PageIndex {
  const pageOf = new WeakMap<CustomElement, number>()
  let page = 1

  for (const [node] of Editor.nodes<CustomElement>(editor, {
    at: [],
    match: (n) => Element.isElement(n) && !editor.isInline(n as CustomElement),
  })) {
    pageOf.set(node, page)
    if (node.type === "page-break") page++
  }

  return { pageOf, total: page }
}
