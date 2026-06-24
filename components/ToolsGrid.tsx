"use client";

import Link from "next/link";
import { Scissors, Archive, RefreshCw, Layers, ArrowRight } from "lucide-react";
import { TOOLS_CONFIG } from "@/lib/toolsConfig";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  split: Layers,
  compress: Archive,
  format_convert: RefreshCw,
  trim: Scissors,
};

const COLOR_MAP: Record<string, string> = {
  split: "#06B6D4",
  compress: "#EF4444",
  format_convert: "#10B981",
  trim: "#7C3AED",
};

export default function ToolsGrid() {
  return (
    <section id="tools" style={{ padding: "100px 24px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <span style={{
            fontFamily: "DM Mono, monospace",
            fontSize: "11px",
            color: "#06B6D4",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>
            // tool suite
          </span>
          <h2 style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 700,
            letterSpacing: "-1.2px",
            color: "#F1F5F9",
            marginTop: "12px",
            marginBottom: "12px",
          }}>
            Pick a tool
          </h2>
          <p style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "15px",
            color: "var(--color-text-secondary)",
            maxWidth: "440px",
            margin: "0 auto",
            lineHeight: 1.6,
          }}>
            Each tool runs entirely in your browser — no upload, no account, no limits.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}>
          {TOOLS_CONFIG.map((tool) => {
            const Icon = ICON_MAP[tool.op] ?? Layers;
            const color = COLOR_MAP[tool.op] ?? "#7C3AED";
            return (
              <Link
                key={tool.slug}
                href={`/${tool.slug}`}
                style={{
                  display: "block",
                  padding: "28px 24px",
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "14px",
                  textDecoration: "none",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.borderColor = `${color}44`;
                  e.currentTarget.style.boxShadow = `0 8px 30px rgba(0,0,0,0.3), 0 0 0 1px ${color}22`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  width: "44px",
                  height: "44px",
                  background: `${color}18`,
                  border: `1px solid ${color}33`,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}>
                  <Icon size={20} color={color} />
                </div>
                <div style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#F1F5F9",
                  marginBottom: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}>
                  {tool.label} <ArrowRight size={13} color="var(--color-text-muted)" />
                </div>
                <div style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.5,
                }}>
                  {tool.tagline}
                </div>
              </Link>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <Link
            href="/editor"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "var(--color-text-muted)",
              textDecoration: "underline",
            }}
          >
            Or open the full editor with all tools →
          </Link>
        </div>
      </div>
    </section>
  );
}
