"use client"

import { useCallback, useState, useRef, useEffect } from "react"
import { Transforms } from "slate"
import { RenderElementProps, useSlateStatic, useSelected } from "slate-react"
import katex from "katex"
import mermaid from "mermaid"
import { CustomElement, PageBreakElement as PageBreakType } from "@/lib/slate/types"
import { PageIndex } from "@/lib/slate/pageMap"

// ─── Mermaid init (once) ────────────────────────────────────────────────────
if (typeof window !== "undefined") {
  mermaid.initialize({ startOnLoad: false, theme: "base",
    themeVariables: { background: "#fafaf8", primaryColor: "#e8e4dc", lineColor: "#8b5a3c" }
  })
}

// ─── Inline Math ─────────────────────────────────────────────────────────────
export function InlineMathElement({ attributes, children, element }: RenderElementProps) {
  const editor = useSlateStatic()
  const selected = useSelected()
  const el = element as CustomElement & { latex: string }
  const [editing, setEditing] = useState(!el.latex)
  const [draft, setDraft] = useState(el.latex)

  const html = useCallback(() => {
    try { return katex.renderToString(el.latex || "\\square", { throwOnError: false, displayMode: false }) }
    catch { return el.latex }
  }, [el.latex])

  const commit = () => {
    Transforms.setNodes(editor, { latex: draft } as Partial<CustomElement>, {
      match: (n) => n === element,
    })
    setEditing(false)
  }

  return (
    <span {...attributes} contentEditable={false} className="inline-math-void">
      {editing || selected ? (
        <input
          className="inline-math-input"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit() } }}
        />
      ) : (
        <span
          className="inline-math-preview"
          onClick={() => setEditing(true)}
          dangerouslySetInnerHTML={{ __html: html() }}
        />
      )}
      {children}
    </span>
  )
}

// ─── Block Math ──────────────────────────────────────────────────────────────
export function BlockMathElement({ attributes, children, element }: RenderElementProps) {
  const editor = useSlateStatic()
  const el = element as CustomElement & { latex: string }
  const [editing, setEditing] = useState(!el.latex)
  const [draft, setDraft] = useState(el.latex)

  const html = useCallback(() => {
    try { return katex.renderToString(draft || "\\square", { throwOnError: false, displayMode: true, output: "html" }) }
    catch { return draft }
  }, [draft])

  const commit = () => {
    Transforms.setNodes(editor, { latex: draft } as Partial<CustomElement>, {
      match: (n) => n === element,
    })
    setEditing(false)
  }

  return (
    <div {...attributes} contentEditable={false} className="mermaid-block">
      <div className="mermaid-toolbar">
        <button type="button" className="mermaid-toggle" onClick={() => setEditing((v) => !v)}>
          {editing ? "Preview" : "Edit"}
        </button>
      </div>
      {editing ? (
        <textarea
          className="mermaid-source"
          style={{ display: "block" }}
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
        />
      ) : (
        <div
          className="math-block-preview"
          onClick={() => setEditing(true)}
          dangerouslySetInnerHTML={{ __html: html() }}
        />
      )}
      {children}
    </div>
  )
}

// ─── Diagram ─────────────────────────────────────────────────────────────────
let diagramCounter = 0

export function DiagramElement({ attributes, children, element }: RenderElementProps) {
  const editor = useSlateStatic()
  const el = element as CustomElement & { source: string }
  const [editing, setEditing] = useState(!el.source)
  const [draft, setDraft] = useState(el.source)
  const [svg, setSvg] = useState("")
  const [error, setError] = useState("")
  const baseId = useRef(`sd-${Math.random().toString(36).slice(2, 9)}`)

  useEffect(() => {
    if (!el.source.trim()) return
    const id = `${baseId.current}-${diagramCounter++}`
    mermaid.render(id, el.source)
      .then(({ svg }) => { setSvg(svg); setError("") })
      .catch(() => setError("Invalid syntax"))
  }, [el.source])

  const commit = () => {
    Transforms.setNodes(editor, { source: draft } as Partial<CustomElement>, {
      match: (n) => n === element,
    })
    setEditing(false)
  }

  return (
    <div {...attributes} contentEditable={false} className="mermaid-block">
      <div className="mermaid-toolbar">
        <button type="button" className="mermaid-toggle" onClick={() => setEditing((v) => !v)}>
          {editing ? "Preview" : "Edit source"}
        </button>
      </div>
      <textarea
        className="mermaid-source"
        style={{ display: editing ? "block" : "none" }}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
      />
      <div className="mermaid-preview" style={{ display: editing ? "none" : "flex" }}>
        {error
          ? <p className="mermaid-error">{error}</p>
          : <div dangerouslySetInnerHTML={{ __html: svg }} />}
      </div>
      {children}
    </div>
  )
}

// ─── Page Break ──────────────────────────────────────────────────────────────
export function PageBreakEl({
  attributes, children, element, pageIndex,
}: RenderElementProps & { pageIndex: PageIndex }) {
  const el = element as CustomElement
  const pageNum = pageIndex.pageOf.get(el) ?? 1
  const total = pageIndex.total

  return (
    <div {...attributes} contentEditable={false} className="pagebreak-block">
      <div className="pagebreak-line" />
      <span className="pagebreak-label">Page {pageNum} of {total}</span>
      <div className="pagebreak-line" />
      {children}
    </div>
  )
}

// ─── Router ──────────────────────────────────────────────────────────────────
export function renderElement(
  props: RenderElementProps,
  pageIndex: PageIndex
): JSX.Element {
  const el = props.element as CustomElement
  switch (el.type) {
    case "heading-1":    return <h1 {...props.attributes} className="ce-header">{props.children}</h1>
    case "heading-2":    return <h2 {...props.attributes} className="ce-header">{props.children}</h2>
    case "heading-3":    return <h3 {...props.attributes} className="ce-header">{props.children}</h3>
    case "quote":        return <blockquote {...props.attributes} className="cdx-quote">{props.children}</blockquote>
    case "code":         return <pre {...props.attributes} className="ce-code__textarea">{props.children}</pre>
    case "bulleted-list":return <ul {...props.attributes}>{props.children}</ul>
    case "numbered-list":return <ol {...props.attributes}>{props.children}</ol>
    case "list-item":    return <li {...props.attributes}>{props.children}</li>
    case "block-math":   return <BlockMathElement {...props} />
    case "inline-math":  return <InlineMathElement {...props} />
    case "diagram":      return <DiagramElement {...props} />
    case "page-break":   return <PageBreakEl {...props} pageIndex={pageIndex} />
    case "link": {
      const link = el as CustomElement & { url: string }
      return <a {...props.attributes} href={link.url} className="simple-link-url">{props.children}</a>
    }
    default:             return <p {...props.attributes} className="ce-paragraph">{props.children}</p>
  }
}
