"use client";

import { useRouter } from "next/navigation";
import { createDocument } from "@/lib/storage";

export default function NewDocumentButton() {
  const router = useRouter();

  function handleCreate() {
    const doc = createDocument();
    router.push(`/editor/${doc.id}`);
  }

  return (
    <button
      onClick={handleCreate}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-ink)] text-[var(--color-paper)] text-sm font-medium hover:bg-[var(--color-umber)] active:scale-[0.98] transition-all"
    >
      <span className="text-base leading-none">+</span>
      New document
    </button>
  );
}
