import { Suspense } from "react";
import EditorShell from "@/components/EditorShell";

export const metadata = {
  title: "Editor — VForge",
  description: "Browser-native media editing tools",
};

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
        fontFamily: "DM Mono, monospace",
        color: "var(--color-text-muted)",
        fontSize: "13px",
      }}>
        Loading editor…
      </div>
    }>
      <EditorShell />
    </Suspense>
  );
}
