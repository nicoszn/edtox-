"use client"

import { useCallback } from "react"
import { Editor, Transforms, Element } from "slate"
import { useSlate } from "slate-react"
import { CustomEditor, CustomElement, CustomText, BlockType } from "@/lib/slate/types"

// Reusable type helper that excludes the 'text' key from formatting actions
type MarkFormat = keyof Omit<CustomText, "text">

function isMarkActive(editor: CustomEditor, format: MarkFormat) {
  const marks = Editor.marks(editor)
  return marks ? marks[format] === true : false
}

function toggleMark(editor: CustomEditor, format: MarkFormat) {
  if (isMarkActive(editor, format)) Editor.removeMark(editor, format)
  else Editor.addMark(editor, format, true)
}

function isBlockActive(editor: CustomEditor, type: BlockType) {
  const [match] = Editor.nodes(editor, {
    match: (n) => Element.isElement(n) && (n as CustomElement).type === type,
  })
  return !!match
}

function toggleBlock(editor: CustomEditor, type: BlockType) {
  const active = isBlockActive(editor, type)
  Transforms.setNodes(
    editor,
    { type: active ? "paragraph" : type } as Partial<CustomElement>,
    { match: (n) => Element.isElement(n) && Editor.isBlock(editor, n as CustomElement) }
  )
}

function insertVoid(editor: CustomEditor, type: "block-math" | "diagram" | "page-break") {
  const defaults: Record<string, Partial<CustomElement>> = {
    "block-math": { type: "block-math", latex: "" },
    "diagram":    { type: "diagram", source: "" },
    "page-break": { type: "page-break" },
  }
  Transforms.insertNodes(editor, { ...defaults[type], children: [{ text: "" }] } as CustomElement)
  Transforms.insertNodes(editor, { type: "paragraph", children: [{ text: "" }] } as CustomElement)
}

interface ToolbarProps {
  preview: boolean
  onTogglePreview: () => void
}

export function SlateToolbar({ preview, onTogglePreview }: ToolbarProps) {
  const editor = useSlate()

  return (
    <div className="slate-toolbar">
      {(["bold", "italic", "underline", "code", "highlight"] as MarkFormat[]).map((mark) => (
        <button
          key={mark}
          type="button"
          className={`slate-toolbar-btn ${isMarkActive(editor, mark) ? "active" : ""}`}
          onMouseDown={(e) => { e.preventDefault(); toggleMark(editor, mark) }}
        >
          {{ bold: "B", italic: "I", underline: "U", code: "</>", highlight: "H" }[mark]}
        </button>
      ))}

      <span className="slate-toolbar-divider" />

      {(["heading-1", "heading-2", "heading-3", "quote", "code", "bulleted-list", "numbered-list"] as BlockType[]).map((t) => (
        <button
          key={t}
          type="button"
          className={`slate-toolbar-btn ${isBlockActive(editor, t) ? "active" : ""}`}
          onMouseDown={(e) => { e.preventDefault(); toggleBlock(editor, t) }}
        >
          {{ "heading-1": "H1", "heading-2": "H2", "heading-3": "H3",
             "quote": "❝", "code": "{ }", "bulleted-list": "•–", "numbered-list": "1." }[t]}
        </button>
      ))}

      <span className="slate-toolbar-divider" />

      <button type="button" className="slate-toolbar-btn" onMouseDown={(e) => { e.preventDefault(); insertVoid(editor, "block-math") }}>∑</button>
      <button type="button" className="slate-toolbar-btn" onMouseDown={(e) => { e.preventDefault(); insertVoid(editor, "diagram") }}>⬡</button>
      <button type="button" className="slate-toolbar-btn" onMouseDown={(e) => { e.preventDefault(); insertVoid(editor, "page-break") }}>⊟</button>

      <span className="slate-toolbar-divider" />

      <button type="button" className="slate-toolbar-btn preview-btn" onMouseDown={(e) => { e.preventDefault(); onTogglePreview() }}>
        {preview ? "Edit" : "Preview"}
      </button>
    </div>
  )
}
