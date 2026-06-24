"use client";

import { Shield, Cpu, Zap, Globe } from "lucide-react";

const FEATURES = [
  { icon: Shield, title: "100% private", desc: "Files never leave your machine — all processing runs locally via WebAssembly.", color: "#10B981" },
  { icon: Cpu, title: "Real FFmpeg", desc: "The same engine professional tools use, compiled to run in the browser.", color: "#7C3AED" },
  { icon: Zap, title: "No install", desc: "Open the browser, drop a file, done. No account, no paywall.", color: "#F59E0B" },
  { icon: Globe, title: "Works offline", desc: "After the first load, processing works with no internet connection.", color: "#06B6D4" },
];

export default function Features() {
  return (
    <section id="features" style={{ padding: "100px 24px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "#06B6D4", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            // why vforge
          </span>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-1px", color: "#F1F5F9", marginTop: "12px" }}>
            Built differently
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                style={{ padding: "28px 24px", background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "14px" }}
              >
                <div style={{
                  width: "44px", height: "44px", background: `${f.color}15`, borderRadius: "10px",
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px",
                }}>
                  <Icon size={20} color={f.color} />
                </div>
                <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "16px", fontWeight: 600, color: "#F1F5F9", marginBottom: "6px" }}>
                  {f.title}
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                  {f.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
