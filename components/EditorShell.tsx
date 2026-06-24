"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Zap, Upload, X, ChevronLeft, Download,
  AlertCircle, Loader2, CheckCircle2, Terminal, ChevronDown, ChevronUp,
  Undo2, History as HistoryIcon
} from "lucide-react";
import { useEditor, HistoryEntry } from "@/hooks/useEditor";
import {
  OperationConfig, OperationType, ProcessResult,
  SplitResult, FramesResult
} from "@/lib/EditorOrchestrator";
import OperationPanel from "@/components/OperationPanel";
import MediaPreview from "@/components/MediaPreview";

interface EditorShellProps {
  /** When set, locks the editor to a single operation and hides the tool switcher.
   *  Used by dedicated SEO landing pages (e.g. /split-video → lockedOp="split"). */
  lockedOp?: OperationType;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function isSplitResult(r: ProcessResult): r is SplitResult {
  return r.success && "segments" in r;
}

function isFramesResult(r: ProcessResult): r is FramesResult {
  return r.success && "frameUrls" in r;
}

// ─── DropZone ─────────────────────────────────────────────────────────────────

function DropZone({ onFile }: { onFile: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Drop media file or click to browse"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        width: "100%",
        maxWidth: "560px",
        aspectRatio: "16/9",
        border: `2px dashed ${dragging ? "#7C3AED" : "var(--color-border-bright)"}`,
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        cursor: "pointer",
        background: dragging ? "rgba(124,58,237,0.06)" : "var(--color-card)",
        transition: "all 0.2s",
        padding: "40px",
      }}
    >
      <div style={{
        width: "56px", height: "56px", background: "rgba(124,58,237,0.12)",
        borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center",
        border: "1px solid rgba(124,58,237,0.25)",
      }}>
        <Upload size={24} color="#7C3AED" />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "15px", fontWeight: 600, color: "#F1F5F9", marginBottom: "6px" }}>
          Drop a file here
        </div>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "var(--color-text-muted)" }}>
          or click to browse — MP4, MOV, WebM, MP3, WAV, and more
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*,audio/*"
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
    </div>
  );
}

// ─── HistoryStrip ─────────────────────────────────────────────────────────────

function HistoryStrip({ history, canUndo, onUndo }: {
  history: HistoryEntry[];
  canUndo: boolean;
  onUndo: () => void;
}) {
  if (history.length <= 1) return null;

  return (
    <div style={{ width: "100%", maxWidth: "560px", display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "6px", flex: 1, overflowX: "auto",
        padding: "8px 10px", background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px",
      }}>
        <HistoryIcon size={12} color="#475569" style={{ flexShrink: 0 }} />
        {history.map((entry, i) => {
          const isActive = i === history.length - 1;
          return (
            <div key={entry.media.id} style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              {i > 0 && <span style={{ color: "var(--color-text-muted)", fontSize: "10px" }}>→</span>}
              <span style={{
                fontFamily: "DM Mono, monospace", fontSize: "10px", padding: "3px 8px", borderRadius: "100px",
                background: isActive ? "rgba(124,58,237,0.18)" : "transparent",
                color: isActive ? "#8B5CF6" : "var(--color-text-muted)",
                border: isActive ? "1px solid rgba(124,58,237,0.4)" : "1px solid transparent",
                whiteSpace: "nowrap",
              }}>
                {entry.label}
              </span>
            </div>
          );
        })}
      </div>
      <button
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo last operation"
        style={{
          display: "flex", alignItems: "center", gap: "5px", padding: "8px 12px",
          background: canUndo ? "rgba(239,68,68,0.1)" : "var(--color-card)",
          border: `1px solid ${canUndo ? "rgba(239,68,68,0.3)" : "var(--color-border)"}`,
          borderRadius: "8px", color: canUndo ? "#EF4444" : "var(--color-text-muted)",
          cursor: canUndo ? "pointer" : "not-allowed", fontFamily: "Inter, sans-serif", fontSize: "12px", flexShrink: 0,
        }}
      >
        <Undo2 size={13} /> Undo
      </button>
    </div>
  );
}

// ─── SegmentPicker ────────────────────────────────────────────────────────────

function SegmentPicker({ entry, onSelect }: {
  entry: HistoryEntry;
  onSelect: (index: number) => void;
}) {
  if (!entry.siblings || entry.siblings.length < 2) return null;

  return (
    <div style={{
      width: "100%", maxWidth: "560px", display: "flex", flexWrap: "wrap", gap: "6px",
      padding: "10px", background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px",
    }}>
      {entry.siblings.map((seg, i) => {
        const isActive = i === entry.activeSiblingIndex;
        return (
          <button
            key={seg.id}
            onClick={() => onSelect(i)}
            style={{
              padding: "6px 12px", borderRadius: "100px",
              border: `1px solid ${isActive ? "#7C3AED" : "var(--color-border)"}`,
              background: isActive ? "rgba(124,58,237,0.18)" : "transparent",
              color: isActive ? "#8B5CF6" : "var(--color-text-secondary)",
              fontFamily: "DM Mono, monospace", fontSize: "11px", cursor: "pointer",
            }}
          >
            Segment {i + 1}
          </button>
        );
      })}
    </div>
  );
}

// ─── LogPanel ─────────────────────────────────────────────────────────────────

function LogPanel({ logs }: { logs: string[] }) {
  const [expanded, setExpanded] = useState(false);

  const useful = logs.filter((l) => {
    const t = l.trim();
    if (!t) return false;
    if (t.startsWith("ffmpeg version")) return false;
    if (t.startsWith("built with")) return false;
    if (t.startsWith("configuration:")) return false;
    if (t.startsWith("lib")) return false;
    return true;
  });

  if (useful.length === 0) return null;

  const preview = useful[useful.length - 1];

  return (
    <div style={{
      width: "100%", maxWidth: "560px", background: "rgba(10,10,15,0.8)",
      border: "1px solid var(--color-border)", borderRadius: "10px", overflow: "hidden",
    }}>
      <button
        onClick={() => setExpanded((x) => !x)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px",
          background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <Terminal size={13} color="#475569" />
        <span style={{
          flex: 1, fontFamily: "DM Mono, monospace", fontSize: "11px", color: "var(--color-text-muted)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {preview}
        </span>
        {expanded ? <ChevronUp size={13} color="#475569" /> : <ChevronDown size={13} color="#475569" />}
      </button>

      {expanded && (
        <div style={{ maxHeight: "200px", overflowY: "auto", padding: "0 14px 12px", borderTop: "1px solid var(--color-border)" }}>
          {useful.map((line, i) => (
            <div
              key={i}
              style={{
                fontFamily: "DM Mono, monospace", fontSize: "10px",
                color: line.includes("Error") || line.includes("error")
                  ? "#EF4444"
                  : line.includes("Warning") || line.includes("warning")
                  ? "#F59E0B"
                  : "#475569",
                lineHeight: 1.8, borderBottom: "1px solid rgba(42,42,62,0.4)", paddingTop: "3px",
              }}
            >
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const downloadBtnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px",
  background: "#10B981", color: "#fff", borderRadius: "8px", textDecoration: "none",
  fontFamily: "Space Grotesk, sans-serif", fontSize: "13px", fontWeight: 600,
  whiteSpace: "nowrap", flexShrink: 0,
};

// ─── ResultPanel ──────────────────────────────────────────────────────────────

function ResultPanel({ result }: { result: ProcessResult }) {
  if (!result.success) return null;

  if (isSplitResult(result)) {
    return (
      <div style={{
        width: "100%", maxWidth: "560px", background: "rgba(16,185,129,0.08)",
        border: "1px solid rgba(16,185,129,0.3)", borderRadius: "12px", padding: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <CheckCircle2 size={18} color="#10B981" />
          <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "14px", fontWeight: 600, color: "#10B981" }}>
            {result.segments.length} segments ready · {formatBytes(result.outputSize)}
          </span>
        </div>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "var(--color-text-muted)", margin: "0 0 12px" }}>
          Segment 1 is now active below. Select any segment to preview it or run another operation on it.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {result.segments.map((seg, i) => {
            const hue = 260 + i * 22;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px",
                background: "var(--color-card)", borderRadius: "8px", border: "1px solid var(--color-border)",
              }}>
                <div style={{ width: "4px", height: "32px", background: `hsla(${hue}, 70%, 55%, 0.9)`, borderRadius: "2px", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "12px", fontWeight: 600, color: "#F1F5F9" }}>
                    Segment {i + 1}
                  </div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: "10px", color: "var(--color-text-muted)" }}>
                    {fmtTime(seg.startTime)} → {fmtTime(seg.endTime)} · {formatBytes(seg.size)}
                  </div>
                </div>
                <a href={seg.url} download={seg.name} style={downloadBtnStyle}>
                  <Download size={13} />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (isFramesResult(result)) {
    return (
      <div style={{
        width: "100%", maxWidth: "560px", background: "rgba(16,185,129,0.08)",
        border: "1px solid rgba(16,185,129,0.3)", borderRadius: "12px", padding: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <CheckCircle2 size={18} color="#10B981" />
          <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "14px", fontWeight: 600, color: "#10B981" }}>
            {result.outputName}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
          {result.frameUrls.map((url, i) => (
            <a key={i} href={url} download={`frame_${String(i + 1).padStart(4, "0")}.jpg`}>
              <img
                src={url}
                alt={`Frame ${i + 1}`}
                style={{ width: "100%", height: "60px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--color-border)", display: "block" }}
              />
            </a>
          ))}
        </div>
      </div>
    );
  }

  if ("outputUrl" in result && result.outputUrl) {
    const isAudioOut = !!result.outputName?.match(/\.(mp3|wav|aac|ogg|flac)$/i);
    return (
      <div style={{
        width: "100%", maxWidth: "560px", background: "rgba(16,185,129,0.08)",
        border: "1px solid rgba(16,185,129,0.3)", borderRadius: "12px", padding: "16px",
        display: "flex", flexDirection: "column", gap: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <CheckCircle2 size={20} color="#10B981" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "13px", fontWeight: 600, color: "#10B981" }}>Done</div>
            <div style={{
              fontFamily: "DM Mono, monospace", fontSize: "10px", color: "var(--color-text-muted)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {result.outputName}{result.outputSize ? ` · ${formatBytes(result.outputSize)}` : ""}
            </div>
          </div>
          <a href={result.outputUrl} download={result.outputName} style={downloadBtnStyle}>
            <Download size={14} /> Download
          </a>
        </div>

        <div style={{ borderRadius: "8px", overflow: "hidden", background: "#000" }}>
          {isAudioOut ? (
            <audio src={result.outputUrl} controls style={{ width: "100%", padding: "8px" }} />
          ) : (
            <video src={result.outputUrl} controls style={{ width: "100%", maxHeight: "240px", display: "block" }} />
          )}
        </div>

        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "var(--color-text-muted)", margin: 0 }}>
          This result is now the active file — run another operation on it, or use Undo to go back.
        </p>
      </div>
    );
  }

  return null;
}

// ─── EditorShell ──────────────────────────────────────────────────────────────

export default function EditorShell({ lockedOp }: EditorShellProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialOp = lockedOp ?? ((searchParams.get("op") ?? "trim") as OperationType);
  const [activeOp, setActiveOp] = useState<OperationType>(initialOp);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  const {
    mediaFile, history, activeEntry, canUndo, result, progress, progressMessage,
    isLoading, isProcessing, error, logs,
    loadFile, processFile, mergeFiles, selectSibling, undo, clearResult, clearFile,
  } = useEditor();

  const busy = isLoading || isProcessing;

  const handleSetActiveOp = useCallback((op: OperationType) => {
    if (lockedOp) return; // locked pages never switch operations
    setActiveOp(op);
    const params = new URLSearchParams(searchParams.toString());
    params.set("op", op);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams, lockedOp]);

  const handleFile = useCallback(async (file: File) => {
    clearResult();
    await loadFile(file);
  }, [loadFile, clearResult]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", display: "flex", flexDirection: "column" }}>

      <header style={{
        height: "56px", borderBottom: "1px solid var(--color-border)",
        display: "flex", alignItems: "center", padding: "0 16px", gap: "12px", flexShrink: 0,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "var(--color-text-secondary)", fontFamily: "Inter, sans-serif", fontSize: "13px" }}>
          <ChevronLeft size={16} /> Back
        </Link>
        <div style={{ width: "1px", height: "20px", background: "var(--color-border)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "22px", height: "22px", background: "linear-gradient(135deg, #7C3AED, #06B6D4)", borderRadius: "5px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={11} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "15px", color: "#F1F5F9" }}>VForge</span>
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "var(--color-text-muted)", marginLeft: "4px" }}>
            / {lockedOp ?? "editor"}
          </span>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          {isLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Loader2 size={13} color="#7C3AED" style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "var(--color-text-muted)" }}>Loading FFmpeg…</span>
            </div>
          )}
          {isProcessing && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Loader2 size={13} color="#06B6D4" style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "#06B6D4" }}>{progressMessage || "Processing…"}</span>
            </div>
          )}
          {mediaFile && !busy && (
            <span style={{
              fontFamily: "DM Mono, monospace", fontSize: "11px", color: "var(--color-text-muted)",
              maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {mediaFile.name} · {formatBytes(mediaFile.size)}
            </span>
          )}
          {mediaFile && !lockedOp && (
            <button
              onClick={() => setIsMobilePanelOpen((x) => !x)}
              className="mobile-panel-toggle"
              style={{
                display: "none", alignItems: "center", gap: "4px", padding: "6px 12px",
                background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)",
                borderRadius: "8px", color: "#8B5CF6", fontFamily: "Inter, sans-serif", fontSize: "12px", cursor: "pointer",
              }}
            >
              Tools
            </button>
          )}
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        <div style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: !mediaFile ? "center" : "flex-start",
          padding: "32px 24px", overflowY: "auto", gap: "16px", minWidth: 0,
        }}>
          {!mediaFile ? (
            <div style={{ textAlign: "center", width: "100%" }}>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "var(--color-text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "24px" }}>
                drop a file to begin
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <DropZone onFile={handleFile} />
              </div>
            </div>
          ) : (
            <>
              <HistoryStrip history={history} canUndo={canUndo} onUndo={undo} />

              {activeEntry && (
                <SegmentPicker entry={activeEntry} onSelect={selectSibling} />
              )}

              <MediaPreview media={mediaFile} />

              {isProcessing && (
                <div style={{ width: "100%", maxWidth: "560px", background: "var(--color-card)", borderRadius: "8px", border: "1px solid var(--color-border)", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "var(--color-text-secondary)" }}>{progressMessage}</span>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "#7C3AED" }}>{progress}%</span>
                  </div>
                  <div style={{ height: "4px", background: "var(--color-border)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #7C3AED, #06B6D4)", borderRadius: "2px", transition: "width 0.3s ease" }} />
                  </div>
                </div>
              )}

              {result && result.success && <ResultPanel result={result} />}

              {error && (
                <div style={{ width: "100%", maxWidth: "560px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "16px 20px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <AlertCircle size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: "1px" }} />
                  <div>
                    <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "13px", fontWeight: 600, color: "#EF4444", marginBottom: "4px" }}>Error</div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "var(--color-text-muted)", wordBreak: "break-word" }}>{error}</div>
                  </div>
                </div>
              )}

              <LogPanel logs={logs} />

              <button
                onClick={clearFile}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "8px", color: "var(--color-text-muted)", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: "12px" }}
              >
                <X size={12} /> Start over
              </button>
            </>
          )}
        </div>

        {mediaFile && !lockedOp && (
          <div className="side-panel" style={{ width: "340px", flexShrink: 0, borderLeft: "1px solid var(--color-border)", overflowY: "auto", padding: "24px 20px" }}>
            <OperationPanel activeOp={activeOp} setActiveOp={handleSetActiveOp} media={mediaFile} onProcess={processFile} onMerge={mergeFiles} busy={busy} />
          </div>
        )}

        {/* Locked single-op panel — no tool grid, just the config form */}
        {mediaFile && lockedOp && (
          <div className="side-panel locked-panel" style={{ width: "340px", flexShrink: 0, borderLeft: "1px solid var(--color-border)", overflowY: "auto", padding: "24px 20px" }}>
            <OperationPanel
              activeOp={activeOp}
              setActiveOp={handleSetActiveOp}
              media={mediaFile}
              onProcess={processFile}
              onMerge={mergeFiles}
              busy={busy}
              lockedOp={lockedOp}
            />
          </div>
        )}

        {mediaFile && isMobilePanelOpen && !lockedOp && (
          <div className="mobile-panel-overlay" onClick={() => setIsMobilePanelOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200 }}>
            <div onClick={(e) => e.stopPropagation()} style={{
              position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--color-surface)",
              borderTop: "1px solid var(--color-border)", borderRadius: "16px 16px 0 0",
              padding: "24px 20px", maxHeight: "80vh", overflowY: "auto",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "15px", fontWeight: 600, color: "#F1F5F9" }}>Operations</span>
                <button onClick={() => setIsMobilePanelOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", alignItems: "center" }}>
                  <X size={18} />
                </button>
              </div>
              <OperationPanel
                activeOp={activeOp}
                setActiveOp={(op) => { handleSetActiveOp(op); setIsMobilePanelOpen(false); }}
                media={mediaFile}
                onProcess={async (c) => { await processFile(c); setIsMobilePanelOpen(false); }}
                onMerge={mergeFiles}
                busy={busy}
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .side-panel { display: none !important; }
          .mobile-panel-toggle { display: flex !important; }
        }
        @media (max-width: 768px) {
          .side-panel.locked-panel {
            display: block !important;
            width: 100% !important;
            border-left: none !important;
            border-top: 1px solid var(--color-border);
          }
        }
      `}</style>
    </div>
  );
}
