"use client";

import { MediaFile } from "@/lib/EditorOrchestrator";
import { Film, Music, Clock, HardDrive, Layers } from "lucide-react";

interface Props {
  media: MediaFile;
}

function formatDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

export default function MediaPreview({ media }: Props) {
  const isVideo = media.type.startsWith("video/");
  const isAudio = media.type.startsWith("audio/");

  return (
    <div style={{ width: "100%", maxWidth: "520px" }}>
      {/* Preview */}
      <div style={{
        width: "100%",
        background: "#000",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid var(--color-border)",
        marginBottom: "16px",
        aspectRatio: isAudio ? "auto" : "16/9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: isAudio ? "80px" : undefined,
      }}>
        {isVideo && (
          <video
            src={media.url}
            controls
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          />
        )}
        {isAudio && (
          <div style={{ width: "100%", padding: "20px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                background: "rgba(124,58,237,0.15)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Music size={20} color="#7C3AED" />
              </div>
              <div>
                <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "14px", fontWeight: 600, color: "#F1F5F9" }}>
                  {media.name}
                </div>
                <div style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "var(--color-text-muted)" }}>
                  {media.type}
                </div>
              </div>
            </div>
            <audio src={media.url} controls style={{ width: "100%", height: "36px" }} />
          </div>
        )}
        {!isVideo && !isAudio && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            padding: "40px",
            color: "var(--color-text-muted)",
          }}>
            <Film size={40} color="#475569" />
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: "11px" }}>
              Preview unavailable
            </span>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: "8px",
      }}>
        {[
          {
            icon: HardDrive,
            label: "Size",
            value: formatBytes(media.size),
            color: "#7C3AED",
          },
          ...(media.duration ? [{
            icon: Clock,
            label: "Duration",
            value: formatDuration(media.duration),
            color: "#06B6D4",
          }] : []),
          ...(media.width && media.height ? [{
            icon: Layers,
            label: "Resolution",
            value: `${media.width}×${media.height}`,
            color: "#10B981",
          }] : []),
        ].map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            style={{
              padding: "12px",
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <Icon size={12} color={color} />
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: "10px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {label}
              </span>
            </div>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "14px", fontWeight: 600, color: "#F1F5F9" }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
