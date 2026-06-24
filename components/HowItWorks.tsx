"use client";

import { Upload, Settings2, Download } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: Upload,
    title: "Drop your file",
    desc: "Drag and drop any video or audio file. It loads directly into the browser — nothing is sent anywhere.",
    color: "#7C3AED",
  },
  {
    n: "02",
    icon: Settings2,
    title: "Configure the operation",
    desc: "Set your parameters — cut points, quality level, target format — and run it.",
    color: "#06B6D4",
  },
  {
    n: "03",
    icon: Download,
    title: "Preview and download",
    desc: "FFmpeg compiled to WebAssembly processes the file locally. Preview the result, then download.",
    color: "#10B981",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" style={{
      padding: "100px 24px",
      background: "var(--color-surface)",
      borderTop: "1px solid var(--color-border)",
      borderBottom: "1px solid var(--color-border)",
    }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <span style={{
            fontFamily: "DM Mono, monospace",
            fontSize: "11px",
            color: "#06B6D4",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>
            // workflow
          </span>
          <h2 style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 700,
            letterSpacing: "-1px",
            color: "#F1F5F9",
            marginTop: "12px",
          }}>
            How it works
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "32px",
        }}>
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.n} style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <div style={{ flexShrink: 0, position: "relative" }}>
                  <div style={{
                    width: "52px",
                    height: "52px",
                    background: `${step.color}15`,
                    border: `1px solid ${step.color}33`,
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Icon size={22} color={step.color} />
                  </div>
                  <div style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    width: "18px",
                    height: "18px",
                    background: step.color,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "DM Mono, monospace",
                    fontSize: "9px",
                    color: "#fff",
                  }}>
                    {i + 1}
                  </div>
                </div>
                <div>
                  <div style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#F1F5F9",
                    marginBottom: "6px",
                  }}>
                    {step.title}
                  </div>
                  <div style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.65,
                  }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
