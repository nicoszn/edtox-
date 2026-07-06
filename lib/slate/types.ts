import { BaseEditor, BaseElement, BaseText } from "slate"
import { ReactEditor } from "slate-react"
import { HistoryEditor } from "slate-history"

export type BlockType =
  | "paragraph"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "quote"
  | "code"
  | "bulleted-list"
  | "numbered-list"
  | "list-item"
  | "block-math"
  | "diagram"
  | "page-break"

export type InlineType = "inline-math" | "link"

export type ElementType = BlockType | InlineType

export interface ParagraphElement extends BaseElement {
  type: "paragraph"
  align?: "left" | "center" | "right"
  children: CustomText[]
}
export interface HeadingElement extends BaseElement {
  type: "heading-1" | "heading-2" | "heading-3"
  children: CustomText[]
}
export interface QuoteElement extends BaseElement {
  type: "quote"
  children: CustomText[]
}
export interface CodeElement extends BaseElement {
  type: "code"
  children: CustomText[]
}
export interface ListElement extends BaseElement {
  type: "bulleted-list" | "numbered-list"
  children: ListItemElement[]
}
export interface ListItemElement extends BaseElement {
  type: "list-item"
  children: CustomText[]
}
export interface BlockMathElement extends BaseElement {
  type: "block-math"
  latex: string
  children: [{ text: "" }]
}
export interface InlineMathElement extends BaseElement {
  type: "inline-math"
  latex: string
  children: [{ text: "" }]
}
export interface DiagramElement extends BaseElement {
  type: "diagram"
  source: string
  children: [{ text: "" }]
}
export interface PageBreakElement extends BaseElement {
  type: "page-break"
  children: [{ text: "" }]
}
export interface LinkElement extends BaseElement {
  type: "link"
  url: string
  children: CustomText[]
}

export type CustomElement =
  | ParagraphElement
  | HeadingElement
  | QuoteElement
  | CodeElement
  | ListElement
  | ListItemElement
  | BlockMathElement
  | InlineMathElement
  | DiagramElement
  | PageBreakElement
  | LinkElement

export interface CustomText extends BaseText {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  code?: boolean
  highlight?: boolean
}

export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor

declare module "slate" {
  interface CustomTypes {
    Editor: CustomEditor
    Element: CustomElement
    Text: CustomText
  }
}

export const VOID_TYPES: ElementType[] = ["block-math", "inline-math", "diagram", "page-break"]
export const INLINE_TYPES: ElementType[] = ["inline-math", "link"]
