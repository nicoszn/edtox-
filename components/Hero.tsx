"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section style={{
      position: "relative", minHeight: "92vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "120px 24px 80px", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(rgba(124,58,237,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.07) 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent)",
      }} />

      <div style={{ position: "relative", maxWidth: "820px", width: "100%", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px",
          background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: "100px", marginBottom: "28px",
        }}>
          <div style={{ width: "6px", height: "6px", background: "#7C3AED", borderRadius: "50%", boxShadow: "0 0 8px rgba(124,58,237,0.8)" }} />
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "#8B5CF6", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Browser-native · Zero uploads · Free
          </span>
        </div>

        <h1 style={{
          fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(38px, 6vw, 68px)", fontWeight: 700,
          lineHeight: 1.08, letterSpacing: "-1.8px", color: "#F1F5F9", marginBottom: "24px",
        }}>
          Edit video and audio
          <br />
          <span style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 60%, #8B5CF6 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            without uploading a thing
          </span>
        </h1>

        <p style={{
          fontFamily: "Inter, sans-serif", fontSize: "clamp(15px, 2vw, 18px)", color: "var(--color-text-secondary)",
          lineHeight: 1.7, maxWidth: "560px", margin: "0 auto 36px",
        }}>
          Split, trim, compress, and convert video and audio directly in your browser.
          Your files stay on your device — nothing is sent to a server.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/editor" style={{
            display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 28px",
            background: "linear-gradient(135deg, #7C3AED, #5B21B6)", color: "#fff", borderRadius: "10px",
            textDecoration: "none", fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: "15px",
            border: "1px solid rgba(139,92,246,0.4)", boxShadow: "0 0 30px rgba(124,58,237,0.3)",
          }}>
            Open the editor <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
