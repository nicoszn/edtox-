import Link from "next/link";
import { Zap } from "lucide-react";
import { TOOLS_CONFIG } from "@/lib/toolsConfig";

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--color-border)", padding: "48px 24px 32px", background: "var(--color-surface)" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{
          display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "32px", marginBottom: "32px",
        }}>
          <div>
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <div style={{
                width: "26px", height: "26px", background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
                borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Zap size={13} color="#fff" fill="#fff" />
              </div>
              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "16px", color: "#F1F5F9" }}>VForge</span>
            </Link>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "var(--color-text-muted)", maxWidth: "260px", lineHeight: 1.6 }}>
              Browser-native media tools. No uploads, no servers, no watermarks.
            </p>
          </div>

          <div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>
              Tools
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {TOOLS_CONFIG.map((t) => (
                <Link key={t.slug} href={`/${t.slug}`} style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "var(--color-text-secondary)", textDecoration: "none" }}>
                  {t.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          paddingTop: "24px", borderTop: "1px solid var(--color-border)",
          fontFamily: "DM Mono, monospace", fontSize: "11px", color: "var(--color-text-muted)",
        }}>
          // browser-native media tools — no servers harmed
        </div>
      </div>
    </footer>
  );
}
