import { RenderLeafProps } from "slate-react"

export function renderLeaf({ attributes, children, leaf }: RenderLeafProps) {
  if (leaf.bold)      children = <strong>{children}</strong>
  if (leaf.italic)    children = <em>{children}</em>
  if (leaf.underline) children = <u>{children}</u>
  if (leaf.code)      children = <code className="inline-code">{children}</code>
  if (leaf.highlight) children = <mark className="cdx-marker">{children}</mark>
  return <span {...attributes}>{children}</span>
}
