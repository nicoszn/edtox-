"use client";

import { useState, useRef, useEffect } from "react";
import {
  Scissors, ChevronsRight, Maximize2, Archive, Gauge,
  RotateCcw, Film, FlipHorizontal, Rewind,
  Music, Image, Ratio, RefreshCw, Volume2,
  RotateCw, Sparkles, Play, Upload, Plus, Trash2, Layers
} from "lucide-react";
import { MediaFile, OperationConfig, OperationType } from "@/lib/EditorOrchestrator";

// "merge" is handled via the separate onMerge callback — it is intentionally
// NOT part of OperationType (the orchestrator's single-file process() never
// receives it). It still needs a tile in the switcher, so it's modeled here
// as a UI-only pseudo-tool.
type ToolId = OperationType | "merge";

const TOOLS: { id: ToolId; label: string; icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
  { id: "trim", label: "Trim", icon: Scissors },
  { id: "split", label: "Split", icon: ChevronsRight },
  { id: "merge", label: "Merge", icon: Layers },
  { id: "resize", label: "Resize", icon: Maximize2 },
  { id: "compress", label: "Compress", icon: Archive },
  { id: "speed", label: "Speed", icon: Gauge },
  { id: "loop", label: "Loop", icon: RotateCcw },
  { id: "fps", label: "FPS", icon: Film },
  { id: "flip", label: "Flip", icon: FlipHorizontal },
  { id: "reverse", label: "Reverse", icon: Rewind },
  { id: "extract_audio", label: "Audio", icon: Music },
  { id: "extract_frames", label: "Frames", icon: Image },
  { id: "aspect_ratio", label: "Aspect", icon: Ratio },
  { id: "format_convert", label: "Convert", icon: RefreshCw },
  { id: "volume", label: "Volume", icon: Volume2 },
  { id: "rotate", label: "Rotate", icon: RotateCw },
  { id: "denoise", label: "Denoise", icon: Sparkles },
];

interface Props {
  activeOp: OperationType;
  setActiveOp: (op: OperationType) => void;
  media: MediaFile;
  onProcess: (config: OperationConfig) => void;
  onMerge: (files: File[]) => void;
  busy: boolean;
  /** When set, the tool switcher grid is hidden and only this operation's
   *  config form renders. Used by dedicated SEO pages (/split-video etc). */
  lockedOp?: OperationType;
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      fontFamily: "DM Mono, monospace",
      fontSize: "10px",
      color: "var(--color-text-muted)",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      display: "block",
      marginBottom: "6px",
    }}>
      {children}
    </label>
  );
}

function Slider({
  value, min, max, step, onChange, format,
}: {
  value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format?: (v: number) => string;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "var(--color-text-muted)" }}>{min}</span>
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: "13px", fontWeight: 500, color: "#7C3AED" }}>
          {format ? format(value) : value}
        </span>
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "var(--color-text-muted)" }}>{max}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#7C3AED", cursor: "pointer" }}
      />
    </div>
  );
}

function Select({
  value, options, onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", padding: "10px 12px", background: "var(--color-card)",
        border: "1px solid var(--color-border-bright)", borderRadius: "8px",
        color: "#F1F5F9", fontFamily: "Inter, sans-serif", fontSize: "13px", cursor: "pointer", outline: "none",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function TimeInput({
  label, value, max, onChange,
}: {
  label: string; value: number; max?: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="number"
        min={0}
        max={max}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%", padding: "10px 12px", background: "var(--color-card)",
          border: "1px solid var(--color-border-bright)", borderRadius: "8px",
          color: "#F1F5F9", fontFamily: "DM Mono, monospace", fontSize: "13px", outline: "none",
        }}
      />
    </div>
  );
}

function fmtClock(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ─── Operation config forms ───────────────────────────────────────────────────

function TrimForm({ media, onRun, busy }: { media: MediaFile; onRun: (c: OperationConfig) => void; busy: boolean }) {
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(media.duration ?? 60);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <TimeInput label="Start (seconds)" value={start} max={media.duration} onChange={setStart} />
      <TimeInput label="End (seconds)" value={end} max={media.duration} onChange={setEnd} />
      <RunButton busy={busy} onClick={() => onRun({ type: "trim", trimStart: start, trimEnd: end })} />
    </div>
  );
}

// ─── SplitForm — supports any number of cut points (1 cut = legacy binary split) ─

function SplitForm({ media, onRun, busy }: { media: MediaFile; onRun: (c: OperationConfig) => void; busy: boolean }) {
  const duration = media.duration ?? 60;
  const [points, setPoints] = useState<number[]>([Math.round(duration / 2)]);

  const addPoint = () => {
    const sorted = [...points].sort((a, b) => a - b);
    const boundaries = [0, ...sorted, duration];
    let maxGap = 0;
    let insertAt = duration / 2;
    for (let i = 0; i < boundaries.length - 1; i++) {
      const gap = boundaries[i + 1] - boundaries[i];
      if (gap > maxGap) {
        maxGap = gap;
        insertAt = Math.round((boundaries[i] + boundaries[i + 1]) / 2);
      }
    }
    setPoints((prev) => [...prev, insertAt].sort((a, b) => a - b));
  };

  const removePoint = (idx: number) => setPoints((prev) => prev.filter((_, i) => i !== idx));

  const updatePoint = (idx: number, val: number) => {
    setPoints((prev) => {
      const next = [...prev];
      next[idx] = Math.max(0.1, Math.min(val, duration - 0.1));
      return next;
    });
  };

  const sorted = [...points].sort((a, b) => a - b);
  const segmentCount = sorted.length + 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: "10px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {segmentCount} segment{segmentCount !== 1 ? "s" : ""}
        </span>
        <button
          onClick={addPoint}
          disabled={points.length >= 9}
          style={{
            display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px",
            background: points.length >= 9 ? "var(--color-card)" : "rgba(124,58,237,0.12)",
            border: `1px solid ${points.length >= 9 ? "var(--color-border)" : "rgba(124,58,237,0.3)"}`,
            borderRadius: "6px", color: points.length >= 9 ? "var(--color-text-muted)" : "#8B5CF6",
            fontFamily: "DM Mono, monospace", fontSize: "10px", cursor: points.length >= 9 ? "not-allowed" : "pointer",
          }}
        >
          <Plus size={11} /> Add cut
        </button>
      </div>

      {/* Timeline visualisation */}
      <div style={{ position: "relative", height: "32px", background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "6px", overflow: "hidden" }}>
        {[0, ...sorted, duration].map((_, i, arr) => {
          if (i === arr.length - 1) return null;
          const left = (arr[i] / duration) * 100;
          const width = ((arr[i + 1] - arr[i]) / duration) * 100;
          const hue = 260 + i * 22;
          return (
            <div key={i} style={{
              position: "absolute", top: 0, bottom: 0, left: `${left}%`, width: `${width}%`,
              background: `hsla(${hue}, 70%, 55%, 0.25)`,
              borderRight: i < arr.length - 2 ? "1px solid rgba(124,58,237,0.5)" : "none",
            }}>
              <span style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", fontFamily: "DM Mono, monospace", fontSize: "9px", color: "#8B5CF6" }}>
                {i + 1}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {points.map((pt, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <input
                type="range"
                min={0.1}
                max={duration - 0.1}
                step={0.1}
                value={pt}
                onChange={(e) => updatePoint(i, Number(e.target.value))}
                style={{ width: "100%", accentColor: "#7C3AED", cursor: "pointer" }}
              />
            </div>
            <input
              type="number"
              min={0.1}
              max={duration - 0.1}
              step={0.1}
              value={Number(pt.toFixed(1))}
              onChange={(e) => updatePoint(i, Number(e.target.value))}
              style={{
                width: "60px", padding: "5px 8px", background: "var(--color-card)",
                border: "1px solid var(--color-border-bright)", borderRadius: "6px",
                color: "#F1F5F9", fontFamily: "DM Mono, monospace", fontSize: "11px", textAlign: "right",
              }}
            />
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: "10px", color: "var(--color-text-muted)", width: "36px", flexShrink: 0 }}>
              {fmtClock(pt)}
            </span>
            <button
              onClick={() => removePoint(i)}
              disabled={points.length === 1}
              style={{
                background: "none", border: "none", cursor: points.length === 1 ? "not-allowed" : "pointer",
                color: points.length === 1 ? "var(--color-border)" : "#EF4444",
                display: "flex", alignItems: "center", padding: "4px", flexShrink: 0,
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      <RunButton busy={busy} onClick={() => onRun({ type: "split", splitPoints: sorted })} />
    </div>
  );
}

function MergeForm({ onMerge, busy }: { onMerge: (files: File[]) => void; busy: boolean }) {
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = "merge-file-input";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <label
        htmlFor={inputId}
        style={{
          border: "1px dashed var(--color-border-bright)", borderRadius: "8px", padding: "16px",
          textAlign: "center", cursor: "pointer", color: "var(--color-text-muted)",
          fontFamily: "Inter, sans-serif", fontSize: "13px", display: "block",
        }}
      >
        <Upload size={16} style={{ margin: "0 auto 6px", display: "block" }} />
        {files.length === 0 ? "Select files to merge" : `${files.length} files selected`}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept="video/*,audio/*"
          style={{ display: "none" }}
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
      </label>
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {files.map((f, i) => (
            <div key={i} style={{ fontFamily: "DM Mono, monospace", fontSize: "11px", color: "var(--color-text-secondary)" }}>
              {f.name}
            </div>
          ))}
        </div>
      )}
      <RunButton busy={busy} disabled={files.length < 2} onClick={() => onMerge(files)} />
    </div>
  );
}

function ResizeForm({ onRun, busy }: { onRun: (c: OperationConfig) => void; busy: boolean }) {
  const [w, setW] = useState(1280);
  const [h, setH] = useState(-2);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <TimeInput label="Width (px, use -2 to auto)" value={w} onChange={setW} />
      <TimeInput label="Height (px, use -2 to auto)" value={h} onChange={setH} />
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
        Set one dimension to -2 to maintain aspect ratio automatically.
      </p>
      <RunButton busy={busy} onClick={() => onRun({ type: "resize", width: w, height: h })} />
    </div>
  );
}

function CompressForm({ onRun, busy }: { onRun: (c: OperationConfig) => void; busy: boolean }) {
  const [crf, setCrf] = useState(28);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <Label>Quality (CRF — lower = better, larger file)</Label>
        <Slider value={crf} min={18} max={45} step={1} onChange={setCrf} />
      </div>
      <RunButton busy={busy} onClick={() => onRun({ type: "compress", crf })} />
    </div>
  );
}

function SpeedForm({ onRun, busy }: { onRun: (c: OperationConfig) => void; busy: boolean }) {
  const [factor, setFactor] = useState(1.5);
  const fmt = (v: number) => `${v}×`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <Label>Speed multiplier</Label>
        <Slider value={factor} min={0.25} max={4} step={0.25} onChange={setFactor} format={fmt} />
      </div>
      <RunButton busy={busy} onClick={() => onRun({ type: "speed", speedFactor: factor })} />
    </div>
  );
}

function LoopForm({ onRun, busy }: { onRun: (c: OperationConfig) => void; busy: boolean }) {
  const [count, setCount] = useState(3);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <Label>Repeat count</Label>
        <Slider value={count} min={2} max={10} step={1} onChange={setCount} />
      </div>
      <RunButton busy={busy} onClick={() => onRun({ type: "loop", loopCount: count })} />
    </div>
  );
}

function FpsForm({ onRun, busy }: { onRun: (c: OperationConfig) => void; busy: boolean }) {
  const [fps, setFps] = useState(30);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <Label>Target FPS</Label>
        <Slider value={fps} min={1} max={120} step={1} onChange={setFps} />
      </div>
      <RunButton busy={busy} onClick={() => onRun({ type: "fps", targetFps: fps })} />
    </div>
  );
}

function FlipForm({ onRun, busy }: { onRun: (c: OperationConfig) => void; busy: boolean }) {
  const [dir, setDir] = useState<"horizontal" | "vertical" | "both">("horizontal");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <Label>Direction</Label>
        <div style={{ display: "flex", gap: "8px" }}>
          {(["horizontal", "vertical", "both"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDir(d)}
              style={{
                flex: 1, padding: "10px 8px", background: dir === d ? "rgba(124,58,237,0.15)" : "var(--color-card)",
                border: `1px solid ${dir === d ? "#7C3AED" : "var(--color-border)"}`, borderRadius: "8px",
                color: dir === d ? "#8B5CF6" : "var(--color-text-secondary)", fontFamily: "Inter, sans-serif",
                fontSize: "12px", cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s",
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <RunButton busy={busy} onClick={() => onRun({ type: "flip", flipDirection: dir })} />
    </div>
  );
}

function AspectForm({ onRun, busy }: { onRun: (c: OperationConfig) => void; busy: boolean }) {
  const [ratio, setRatio] = useState<"16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "21:9" | "custom">("16:9");
  const [cw, setCw] = useState(1920);
  const [ch, setCh] = useState(1080);
  const RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "custom"] as const;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <Label>Target aspect ratio</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
          {RATIOS.map((r) => (
            <button
              key={r}
              onClick={() => setRatio(r)}
              style={{
                padding: "8px", background: ratio === r ? "rgba(124,58,237,0.15)" : "var(--color-card)",
                border: `1px solid ${ratio === r ? "#7C3AED" : "var(--color-border)"}`, borderRadius: "6px",
                color: ratio === r ? "#8B5CF6" : "var(--color-text-secondary)", fontFamily: "DM Mono, monospace",
                fontSize: "11px", cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      {ratio === "custom" && (
        <>
          <TimeInput label="Custom width (px)" value={cw} onChange={setCw} />
          <TimeInput label="Custom height (px)" value={ch} onChange={setCh} />
        </>
      )}
      <RunButton busy={busy} onClick={() => onRun({
        type: "aspect_ratio", aspectRatio: ratio, customAspectW: cw, customAspectH: ch,
      })} />
    </div>
  );
}

function FormatForm({ media, onRun, busy }: { media: MediaFile; onRun: (c: OperationConfig) => void; busy: boolean }) {
  const isAudio = media.type.startsWith("audio/");
  const [fmt, setFmt] = useState(isAudio ? "mp3" : "mp4");
  const videoFmts = [
    { value: "mp4", label: "MP4 (H.264)" },
    { value: "webm", label: "WebM (VP8)" },
    { value: "mov", label: "MOV (QuickTime)" },
    { value: "avi", label: "AVI" },
    { value: "mkv", label: "MKV" },
    { value: "gif", label: "GIF" },
  ];
  const audioFmts = [
    { value: "mp3", label: "MP3" },
    { value: "wav", label: "WAV" },
    { value: "aac", label: "AAC" },
    { value: "ogg", label: "OGG" },
    { value: "flac", label: "FLAC" },
  ];
  const opts = isAudio ? audioFmts : [...videoFmts, ...audioFmts];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <Label>Output format</Label>
        <Select value={fmt} options={opts} onChange={setFmt} />
      </div>
      <RunButton busy={busy} onClick={() => onRun({ type: "format_convert", outputFormat: fmt })} />
    </div>
  );
}

function VolumeForm({ onRun, busy }: { onRun: (c: OperationConfig) => void; busy: boolean }) {
  const [vol, setVol] = useState(1.5);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <Label>Volume level</Label>
        <Slider value={vol} min={0} max={3} step={0.1} onChange={setVol} format={(v) => `${v.toFixed(1)}×`} />
      </div>
      <RunButton busy={busy} onClick={() => onRun({ type: "volume", volumeLevel: vol })} />
    </div>
  );
}

function RotateForm({ onRun, busy }: { onRun: (c: OperationConfig) => void; busy: boolean }) {
  const [deg, setDeg] = useState<90 | 180 | 270>(90);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <Label>Degrees</Label>
        <div style={{ display: "flex", gap: "8px" }}>
          {([90, 180, 270] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDeg(d)}
              style={{
                flex: 1, padding: "10px", background: deg === d ? "rgba(124,58,237,0.15)" : "var(--color-card)",
                border: `1px solid ${deg === d ? "#7C3AED" : "var(--color-border)"}`, borderRadius: "8px",
                color: deg === d ? "#8B5CF6" : "var(--color-text-secondary)", fontFamily: "DM Mono, monospace",
                fontSize: "12px", cursor: "pointer",
              }}
            >
              {d}°
            </button>
          ))}
        </div>
      </div>
      <RunButton busy={busy} onClick={() => onRun({ type: "rotate", rotateDegrees: deg })} />
    </div>
  );
}

function DenoiseForm({ onRun, busy }: { onRun: (c: OperationConfig) => void; busy: boolean }) {
  const [str, setStr] = useState(5);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <Label>Denoise strength</Label>
        <Slider value={str} min={1} max={15} step={1} onChange={setStr} />
      </div>
      <RunButton busy={busy} onClick={() => onRun({ type: "denoise", denoiseStrength: str })} />
    </div>
  );
}

function SimpleRunForm({ label, op, onRun, busy }: {
  label: string; op: OperationType; onRun: (c: OperationConfig) => void; busy: boolean;
}) {
  return (
    <div>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.7, marginBottom: "20px" }}>
        {label}
      </p>
      <RunButton busy={busy} onClick={() => onRun({ type: op })} />
    </div>
  );
}

function RunButton({ busy, onClick, disabled }: { busy: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={busy || disabled}
      style={{
        width: "100%", padding: "13px",
        background: busy || disabled ? "var(--color-card)" : "linear-gradient(135deg, #7C3AED, #5B21B6)",
        color: busy || disabled ? "var(--color-text-muted)" : "#fff",
        border: `1px solid ${busy || disabled ? "var(--color-border)" : "rgba(139,92,246,0.4)"}`,
        borderRadius: "10px", fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: "14px",
        cursor: busy || disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        transition: "all 0.2s", boxShadow: busy || disabled ? "none" : "0 0 20px rgba(124,58,237,0.25)",
      }}
    >
      <Play size={14} /> {busy ? "Processing…" : "Run"}
    </button>
  );
}

// ─── Config form dispatch — shared by both locked and full panel modes ──────────

function ConfigForm({ op, media, onProcess, onMerge, busy }: {
  op: ToolId; media: MediaFile; onProcess: (c: OperationConfig) => void;
  onMerge: (files: File[]) => void; busy: boolean;
}) {
  switch (op) {
    case "trim": return <TrimForm media={media} onRun={onProcess} busy={busy} />;
    case "split": return <SplitForm media={media} onRun={onProcess} busy={busy} />;
    case "merge": return <MergeForm onMerge={onMerge} busy={busy} />;
    case "resize": return <ResizeForm onRun={onProcess} busy={busy} />;
    case "compress": return <CompressForm onRun={onProcess} busy={busy} />;
    case "speed": return <SpeedForm onRun={onProcess} busy={busy} />;
    case "loop": return <LoopForm onRun={onProcess} busy={busy} />;
    case "fps": return <FpsForm onRun={onProcess} busy={busy} />;
    case "flip": return <FlipForm onRun={onProcess} busy={busy} />;
    case "reverse":
      return (
        <SimpleRunForm
          label="Plays the video backwards with the audio reversed. Works best on short clips."
          op="reverse" onRun={onProcess} busy={busy}
        />
      );
    case "extract_audio":
      return (
        <SimpleRunForm
          label="Extracts the audio track from the video and exports it as MP3 at 192kbps."
          op="extract_audio" onRun={onProcess} busy={busy}
        />
      );
    case "extract_frames":
      return (
        <SimpleRunForm
          label="Exports one frame per second as JPEG images."
          op="extract_frames" onRun={onProcess} busy={busy}
        />
      );
    case "aspect_ratio": return <AspectForm onRun={onProcess} busy={busy} />;
    case "format_convert": return <FormatForm media={media} onRun={onProcess} busy={busy} />;
    case "volume": return <VolumeForm onRun={onProcess} busy={busy} />;
    case "rotate": return <RotateForm onRun={onProcess} busy={busy} />;
    case "denoise": return <DenoiseForm onRun={onProcess} busy={busy} />;
    default: return null;
  }
}

// ─── Main Panel ────────────────────────────────────────────────────────────────

export default function OperationPanel({ activeOp, setActiveOp, media, onProcess, onMerge, busy, lockedOp }: Props) {
  // Local UI-only selection that can hold "merge" (a pseudo-tool with no
  // OperationType). Kept in sync with `activeOp` for every real operation;
  // only diverges when the user picks "merge".
  const [localOp, setLocalOp] = useState<ToolId>(activeOp);
  const currentOp: ToolId = lockedOp ?? localOp;

  useEffect(() => {
    setLocalOp(activeOp);
  }, [activeOp]);

  const selectTool = (id: ToolId) => {
    setLocalOp(id);
    if (id !== "merge") setActiveOp(id as OperationType);
  };

  // Locked mode (SEO single-tool pages): no switcher grid, just the form.
  if (lockedOp) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{
          fontFamily: "DM Mono, monospace", fontSize: "10px", color: "var(--color-text-muted)",
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          // configure
        </div>
        <ConfigForm op={currentOp} media={media} onProcess={onProcess} onMerge={onMerge} busy={busy} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Tool selector */}
      <div>
        <div style={{
          fontFamily: "DM Mono, monospace", fontSize: "10px", color: "var(--color-text-muted)",
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px",
        }}>
          // operation
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const active = currentOp === t.id;
            return (
              <button
                key={t.id}
                onClick={() => selectTool(t.id)}
                title={t.label}
                style={{
                  padding: "8px 4px",
                  background: active ? "rgba(124,58,237,0.15)" : "var(--color-card)",
                  border: `1px solid ${active ? "rgba(124,58,237,0.5)" : "var(--color-border)"}`,
                  borderRadius: "8px", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                  transition: "all 0.15s",
                }}
              >
                <Icon size={14} color={active ? "#8B5CF6" : "#475569"} />
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: "9px", color: active ? "#8B5CF6" : "#475569", letterSpacing: "0.02em" }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ height: "1px", background: "var(--color-border)" }} />

      <div>
        <div style={{
          fontFamily: "DM Mono, monospace", fontSize: "10px", color: "var(--color-text-muted)",
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px",
        }}>
          // configure
        </div>
        <ConfigForm op={currentOp} media={media} onProcess={onProcess} onMerge={onMerge} busy={busy} />
      </div>
    </div>
  );
}
