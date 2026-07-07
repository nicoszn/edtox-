"use client"

import { useCallback, useMemo, useState, useEffect, useRef } from "react"
import { Slate, Editable } from "slate-react"
import type { RenderElementProps, RenderLeafProps } from "slate-react"
import type { Descendant } from "slate"
import { createSlateEditor, INITIAL_VALUE } from "@/lib/slate/editor"
import { buildPageIndex, type PageIndex } from "@/lib/slate/pageMap"
import { renderElement } from "@/components/slate/elements"
import { renderLeaf } from "@/components/slate/leaves"
import { SlateToolbar } from "@/components/slate/Toolbar"
import { getDocument, saveDocument } from "@/lib/storage/documents"
import { useRouter } from "next/navigation"

const SAVE_DEBOUNCE = 600

export default function SlateEditor({ documentId }: { documentId: string }) {
  const editor = useMemo(() => createSlateEditor(), [])
  const router = useRouter()

  // Slate requires a stable initialValue reference. We load from storage once
  // and set it here before mounting <Slate>. Until it's ready we show loading.
  const [initialValue, setInitialValue] = useState<Descendant[] | null>(null)
  const [title, setTitle] = useState("Untitled")
  const [preview, setPreview] = useState(false)

  const titleRef = useRef(title)
  titleRef.current = title
  const valueRef = useRef<Descendant[]>(INITIAL_VALUE)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    getDocument(documentId).then((doc) => {
      if (doc?.title) setTitle(doc.title)

      // A brand-new document has no slate content yet — start with INITIAL_VALUE.
      // An existing document would have serialized Slate JSON stored; for now
      // we start fresh since EditorJS OutputData is a different format.
      setInitialValue(INITIAL_VALUE)
    })
  }, [documentId])

  const [value, setValue] = useState<Descendant[]>(INITIAL_VALUE)

  const pageIndex = useMemo<PageIndex>(
    () => buildPageIndex(editor),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value]
  )

  const onValueChange = useCallback(
    (newValue: Descendant[]) => {
      setValue(newValue)
      valueRef.current = newValue
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        // Persist title + placeholder OutputData so home page shows the doc
        saveDocument(documentId, titleRef.current, {
          time: Date.now(),
          blocks: [],
          version: "slate",
        })
      }, SAVE_DEBOUNCE)
    },
    [documentId]
  )

  function handleTitleChange(t: string) {
    setTitle(t)
    titleRef.current = t
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveDocument(documentId, t, { time: Date.now(), blocks: [], version: "slate" })
    }, SAVE_DEBOUNCE)
  }

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveDocument(documentId, titleRef.current, {
          time: Date.now(),
          blocks: [],
          version: "slate",
        })
      }
    }
  }, [documentId])

  const renderEl = useCallback(
    (props: RenderElementProps) => renderElement(props, pageIndex),
    [pageIndex]
  )

  const renderLf = useCallback(
    (props: RenderLeafProps) => renderLeaf(props),
    []
  )

  // Don't mount <Slate> until initialValue is resolved — avoids the
  // hydration mismatch that causes undo/redo to break.
  if (!initialValue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm font-[family-name:var(--font-mono)] text-[var(--color-ink-soft)]">
          Loading…
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Slate
        editor={editor}
        initialValue={initialValue}
        onValueChange={onValueChange}
      >
        {/* Title bar */}
        <div className="sticky top-0 z-10 bg-[var(--color-paper)]/95 backdrop-blur-sm border-b border-[var(--color-rule)] px-4 py-3 sm:px-6 flex items-center gap-3 print:hidden">
          <button
            onClick={() => router.push("/")}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-ink-soft)] hover:bg-[var(--color-rule)] hover:text-[var(--color-ink)] transition-colors text-lg"
          >
            ←
          </button>
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="flex-1 min-w-0 bg-transparent font-[family-name:var(--font-display)] text-xl sm:text-2xl text-[var(--color-ink)] outline-none"
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
