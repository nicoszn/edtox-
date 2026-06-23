"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDocument } from "@/lib/storage/documents";

export default function NewDocumentButton() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    setCreating(true);
    try {
      const doc = await createDocument();
      router.push(`/editor/${doc.id}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <button
      onClick={handleCreate}
      disabled={creating}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-ink)] text-[var(--color-paper)] text-sm font-medium hover:bg-[var(--color-umber)] active:scale-[0.98] transition-all disabled:opacity-60"
    >
      <span className="text-base leading-none">+</span>
      {creating ? "Creating…" : "New document"}
    </button>
  );
}
