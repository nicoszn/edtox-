"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Zap } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between",
      transition: "all 0.3s ease",
      background: scrolled ? "rgba(10,10,15,0.92)" : "transparent",
      backdropFilter: scrolled ? "blur(16px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(124,58,237,0.2)" : "none",
    }}>
      <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{
          width: "32px", height: "32px", background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
          borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Zap size={16} color="#fff" fill="#fff" />
        </div>
        <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "18px", color: "#F1F5F9", letterSpacing: "-0.3px" }}>
          VForge
        </span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "32px" }} className="desktop-nav">
        {[{ label: "Split", href: "/split-video" }, { label: "Compress", href: "/compress-video" }, { label: "Convert", href: "/convert-video" }, { label: "Trim", href: "/trim-video" }].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "var(--color-text-secondary)", textDecoration: "none" }}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <Link
        href="/editor"
        style={{
          fontFamily: "Space Grotesk, sans-serif", fontSize: "14px", fontWeight: 600, color: "#fff",
          textDecoration: "none", padding: "8px 20px",
          background: "linear-gradient(135deg, #7C3AED, #5B21B6)", borderRadius: "8px",
          border: "1px solid rgba(139,92,246,0.4)", boxShadow: "0 0 20px rgba(124,58,237,0.2)",
        }}
      >
        Open Editor
      </Link>

      <style>{`
        @media (max-width: 768px) { .desktop-nav { display: none !important; } }
      `}</style>
    </nav>
  );
}
