import SlateEditor from "@/components/slate/SlateEditor"

export default function SlatePage({ params }: { params: { id: string } }) {
  return <SlateEditor documentId={params.id} />
}
