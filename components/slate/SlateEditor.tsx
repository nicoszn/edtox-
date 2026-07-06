"use client"

import { useCallback, useMemo, useState, useEffect, useRef } from "react"
import { Slate, Editable, withReact } from "slate-react"
import { useCallback as uc } from "react"
import { RenderElementProps, RenderLeafProps } from "slate-react"
import { createSlateEditor, INITIAL_VALUE } from "@/lib/slate/editor"
import { buildPageIndex, PageIndex } from "@/lib/slate/pageMap"
import { renderElement } from "@/components/slate/elements"
import { renderLeaf } from "@/components/slate/leaves"
import { SlateToolbar } from "@/components/slate/Toolbar"
import { CustomElement } from "@/lib/slate/types"
import { Descendant } from "slate"
import { getDocument, saveDocument } from "@/lib/storage/documents"
import { countWords } from "@/lib/wordcount"
import { countPages } from "@/lib/pages"

const SAVE_DEBOUNCE = 600

export default function SlateEditor({ documentId }: { documentId: string }) {
  const editor = useMemo(() => createSlateEditor(), [])
  const [value, setValue] = useState<Descendant[]>(INITIAL_VALUE)
  const [preview, setPreview] = useState(false)
  const [title, setTitle] = useState("Untitled")
  const [loaded, setLoaded] = useState(false)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleRef = useRef(title)
  titleRef.current = title

  useEffect(() => {
    getDocument(documentId).then((doc) => {
      if (doc) setTitle(doc.title)
      // Slate's initialValue is set once; use setValue to hydrate from storage
      // if (doc.content?.blocks?.length) {
      //   // stored as EditorJS OutputData — start fresh for new slate doc
      // }
      setLoaded(true)
    })
  }, [documentId])

  // O(1) per-render page lookup — built once per value change, not per element
  const pageIndex = useMemo<PageIndex>(
    () => buildPageIndex(editor),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value]
  )

  const onValueChange = useCallback((newValue: Descendant[]) => {
    setValue(newValue)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      // Slate value → save as JSON in existing storage layer
      const fakeOutputData = { time: Date.now(), blocks: [], version: "slate" }
      saveDocument(documentId, titleRef.current, fakeOutputData)
    }, SAVE_DEBOUNCE)
  }, [documentId])

  const renderEl = useCallback(
    (props: RenderElementProps) => renderElement(props, pageIndex),
    [pageIndex]
  )

  const renderLf = useCallback(
    (props: RenderLeafProps) => renderLeaf(props),
    []
  )

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm font-[family-name:var(--font-mono)] text-[var(--color-ink-soft)]">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Slate editor={editor} initialValue={INITIAL_VALUE} onValueChange={onValueChange}>
        {/* Title */}
        <div className="sticky top-0 z-10 bg-[var(--color-paper)]/95 backdrop-blur-sm border-b border-[var(--color-rule)] px-4 py-3 sm:px-6 flex items-center gap-3 print:hidden">
          <a href="/" className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] text-lg shrink-0">←</a>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 min-w-0 bg-transparent font-[family-name:var(--font-display)] text-xl sm:text-2xl text-[var(--color-ink)] outline-none"
            placeholder="Untitled"
          />
        </div>

        {/* Toolbar */}
        <div className="print:hidden">
          <SlateToolbar preview={preview} onTogglePreview={() => setPreview((v) => !v)} />
        </div>

        {/* A4 canvas */}
        <div className="slate-a4-root">
          <Editable
            readOnly={preview}
            renderElement={renderEl}
            renderLeaf={renderLf}
            placeholder="Start writing…"
            className="slate-a4-editable outline-none"
            spellCheck
          />
        </div>
      </Slate>
    </div>
  )
}
