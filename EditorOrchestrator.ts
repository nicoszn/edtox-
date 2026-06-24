"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OperationType =
  | "trim"
  | "split"
  | "resize"
  | "compress"
  | "speed"
  | "loop"
  | "fps"
  | "flip"
  | "reverse"
  | "extract_audio"
  | "extract_frames"
  | "aspect_ratio"
  | "format_convert"
  | "volume"
  | "rotate"
  | "denoise";

export interface MediaFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  duration?: number;
  width?: number;
  height?: number;
  url: string;
}

export interface OperationConfig {
  type: OperationType;
  // Trim
  trimStart?: number;
  trimEnd?: number;
  // Split — provide splitAt for a single cut, or splitPoints for multiple
  splitAt?: number;
  splitPoints?: number[];
  // Resize
  width?: number;
  height?: number;
  // Compress
  crf?: number;
  audioBitrate?: string;
  // Speed
  speedFactor?: number;
  // Loop
  loopCount?: number;
  // FPS
  targetFps?: number;
  // Flip
  flipDirection?: "horizontal" | "vertical" | "both";
  // Aspect ratio
  aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "21:9" | "custom";
  customAspectW?: number;
  customAspectH?: number;
  // Format convert
  outputFormat?: string;
  // Volume
  volumeLevel?: number;
  // Rotate
  rotateDegrees?: 90 | 180 | 270;
  // Extract frames
  frameInterval?: number;
  // Denoise
  denoiseStrength?: number;
}

export interface SplitSegment {
  url: string;
  name: string;
  size: number;
  startTime: number;
  endTime: number;
}

export interface SplitResult {
  success: true;
  segments: SplitSegment[];
  outputName: string;
  outputSize: number;
}

export interface FramesResult {
  success: true;
  frameUrls: string[];
  outputName: string;
  outputSize: number;
}

export interface StandardResult {
  success: boolean;
  outputUrl?: string;
  outputName?: string;
  outputSize?: number;
  error?: string;
}

export type ProcessResult = StandardResult | SplitResult | FramesResult;

export type OrchestratorState = "idle" | "loading" | "ready" | "processing" | "done" | "error";

export type ProgressCallback = (progress: number, message: string) => void;
export type LogCallback = (message: string) => void;

// ─── EditorOrchestrator ───────────────────────────────────────────────────────

export class EditorOrchestrator {
  private static instance: EditorOrchestrator | null = null;
  private ffmpeg: FFmpeg;
  private state: OrchestratorState = "idle";
  private progressCb: ProgressCallback | null = null;
  private logCb: LogCallback | null = null;
  private loadPromise: Promise<void> | null = null;

  private constructor() {
    this.ffmpeg = new FFmpeg();
    this.ffmpeg.on("log", ({ message }) => {
      this.logCb?.(message);
    });
    this.ffmpeg.on("progress", ({ progress }) => {
      const pct = Math.min(99, Math.round(progress * 100));
      this.progressCb?.(pct, `Processing… ${pct}%`);
    });
  }

  static getInstance(): EditorOrchestrator {
    if (!EditorOrchestrator.instance) {
      EditorOrchestrator.instance = new EditorOrchestrator();
    }
    return EditorOrchestrator.instance;
  }

  getState(): OrchestratorState {
    return this.state;
  }

  onProgress(cb: ProgressCallback) {
    this.progressCb = cb;
  }

  onLog(cb: LogCallback) {
    this.logCb = cb;
  }

  async load(): Promise<void> {
    if (this.state === "ready") return;
    if (this.loadPromise) return this.loadPromise;

    this.state = "loading";
    this.loadPromise = (async () => {
      try {
        const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.15/dist/umd";
        await this.ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });
        this.state = "ready";
      } catch (e) {
        this.state = "error";
        this.loadPromise = null;
        throw new Error(`FFmpeg failed to load. Check network connectivity. (${e})`);
      }
    })();

    return this.loadPromise;
  }

  isLoaded(): boolean {
    return this.state === "ready" || this.state === "processing" || this.state === "done";
  }

  async probeMedia(file: File): Promise<Partial<MediaFile>> {
    return new Promise((resolve) => {
      const isVideo = file.type.startsWith("video/");
      const isAudio = file.type.startsWith("audio/");
      if (!isVideo && !isAudio) return resolve({});

      const el = document.createElement(isVideo ? "video" : "audio") as HTMLVideoElement;
      el.preload = "metadata";
      const url = URL.createObjectURL(file);
      el.onloadedmetadata = () => {
        resolve({
          duration: isFinite(el.duration) ? el.duration : undefined,
          width: isVideo ? (el.videoWidth || undefined) : undefined,
          height: isVideo ? (el.videoHeight || undefined) : undefined,
        });
        URL.revokeObjectURL(url);
      };
      el.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({});
      };
      el.src = url;
    });
  }

  // ─── process() — dispatches all single-file operations ───────────────────────

  async process(media: MediaFile, config: OperationConfig): Promise<ProcessResult> {
    if (!this.isLoaded()) await this.load();
    this.state = "processing";

    const inputName = `input_${Date.now()}.${this.getExtension(media.name)}`;

    try {
      await this.ffmpeg.writeFile(inputName, await fetchFile(media.file));

      let result: ProcessResult;

      if (config.type === "split") {
        result = await this.handleSplit(inputName, media, config);
      } else if (config.type === "extract_frames") {
        result = await this.handleExtractFrames(inputName, media, config);
      } else {
        result = await this.handleStandard(inputName, media, config);
      }

      return result;
    } catch (error) {
      this.state = "error";
      await this.cleanup([inputName]);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  // ─── Standard single-output operations ───────────────────────────────────────

  private async handleStandard(
    inputName: string,
    media: MediaFile,
    config: OperationConfig
  ): Promise<StandardResult> {
    const { outputName, args } = this.buildArgs(inputName, media, config);

    await this.ffmpeg.exec(["-threads", "1", ...args]);

    const data = await this.ffmpeg.readFile(outputName);
    const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(data as unknown as ArrayBuffer);
    const mimeType = this.getMimeType(outputName, media.type);
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);

    await this.cleanup([inputName, outputName]);
    this.state = "done";

    return { success: true, outputUrl: url, outputName, outputSize: blob.size };
  }

  // ─── split() — N cut points → N+1 segments, all returned ─────────────────────

  private async handleSplit(
    inputName: string,
    media: MediaFile,
    config: OperationConfig
  ): Promise<SplitResult | StandardResult> {
    const ext = this.getExtension(media.name);
    const duration = media.duration ?? 0;

    // Normalize input: either splitPoints[] (multisplit) or splitAt (single cut)
    const rawPoints = config.splitPoints && config.splitPoints.length > 0
      ? config.splitPoints
      : [config.splitAt ?? (duration ? duration / 2 : 30)];

    const cuts = [...new Set(rawPoints.map((t) => Math.max(0.1, Math.min(t, duration - 0.1))))]
      .sort((a, b) => a - b);

    const boundaries: Array<{ start: number; end: number }> = [];
    let prev = 0;
    for (const cut of cuts) {
      if (cut - prev > 0.05) boundaries.push({ start: prev, end: cut });
      prev = cut;
    }
    if (duration - prev > 0.05) boundaries.push({ start: prev, end: duration });

    if (boundaries.length < 2) {
      return { success: false, error: "Add at least one cut point to create multiple segments." };
    }

    const ts = Date.now();
    const outputNames = boundaries.map((_, i) => `split_${ts}_seg${i + 1}.${ext}`);
    const toClean = [inputName, ...outputNames];

    try {
      for (let i = 0; i < boundaries.length; i++) {
        const { start, end } = boundaries[i];
        this.progressCb?.(
          Math.round((i / boundaries.length) * 90),
          `Cutting segment ${i + 1} of ${boundaries.length}…`
        );
        await this.ffmpeg.exec([
          "-threads", "1",
          "-i", inputName,
          "-ss", String(start),
          "-to", String(end),
          "-c", "copy",
          outputNames[i],
        ]);
      }

      const segments: SplitSegment[] = [];
      for (let i = 0; i < boundaries.length; i++) {
        const data = await this.ffmpeg.readFile(outputNames[i]);
        const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(data as unknown as ArrayBuffer);
        const blob = new Blob([bytes], { type: media.type });
        segments.push({
          url: URL.createObjectURL(blob),
          name: outputNames[i],
          size: blob.size,
          startTime: boundaries[i].start,
          endTime: boundaries[i].end,
        });
      }

      await this.cleanup(toClean);
      this.state = "done";
      this.progressCb?.(100, "Done");

      return {
        success: true,
        segments,
        outputName: `${segments.length} segments`,
        outputSize: segments.reduce((acc, s) => acc + s.size, 0),
      };
    } catch (error) {
      await this.cleanup(toClean);
      this.state = "error";
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  // ─── extract_frames() — multiple output files ────────────────────────────────

  private async handleExtractFrames(
    inputName: string,
    media: MediaFile,
    config: OperationConfig
  ): Promise<FramesResult | StandardResult> {
    const interval = Math.max(1, config.frameInterval ?? 1);
    const duration = media.duration ?? 60;
    const expectedCount = Math.ceil(duration / interval);
    const base = `frames_${Date.now()}`;
    const pattern = `${base}_%04d.jpg`;

    try {
      await this.ffmpeg.exec([
        "-threads", "1",
        "-i", inputName,
        "-vf", `fps=1/${interval}`,
        "-q:v", "2",
        pattern,
      ]);

      const frameUrls: string[] = [];
      const toClean: string[] = [inputName];

      for (let i = 1; i <= expectedCount + 5; i++) {
        const frameName = `${base}_${String(i).padStart(4, "0")}.jpg`;
        try {
          const data = await this.ffmpeg.readFile(frameName);
          const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(data as unknown as ArrayBuffer);
          const blob = new Blob([bytes], { type: "image/jpeg" });
          frameUrls.push(URL.createObjectURL(blob));
          toClean.push(frameName);
        } catch {
          break; // no more frames at this index
        }
      }

      await this.cleanup(toClean);
      this.state = "done";

      if (frameUrls.length === 0) {
        return { success: false, error: "No frames were extracted from this file." };
      }

      return {
        success: true,
        frameUrls,
        outputName: `${frameUrls.length} frame${frameUrls.length !== 1 ? "s" : ""} extracted`,
        outputSize: 0,
      };
    } catch (error) {
      await this.cleanup([inputName]);
      this.state = "error";
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  // ─── mergeMultiple() ─────────────────────────────────────────────────────────

  async mergeMultiple(files: File[]): Promise<StandardResult> {
    if (!this.isLoaded()) await this.load();
    this.state = "processing";

    const ts = Date.now();
    const fileList: string[] = [];
    const outputName = `merged_${ts}.mp4`;

    try {
      for (let i = 0; i < files.length; i++) {
        const name = `merge_${ts}_${i}.${this.getExtension(files[i].name)}`;
        await this.ffmpeg.writeFile(name, await fetchFile(files[i]));
        fileList.push(name);
      }

      const concatContent = fileList.map((f) => `file '${f}'`).join("\n");
      await this.ffmpeg.writeFile("concat.txt", new TextEncoder().encode(concatContent));

      await this.ffmpeg.exec([
        "-threads", "1",
        "-f", "concat",
        "-safe", "0",
        "-i", "concat.txt",
        "-c", "copy",
        outputName,
      ]);

      const data = await this.ffmpeg.readFile(outputName);
      const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(data as unknown as ArrayBuffer);
      const blob = new Blob([bytes], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);

      await this.cleanup([...fileList, "concat.txt", outputName]);
      this.state = "done";

      return { success: true, outputUrl: url, outputName, outputSize: blob.size };
    } catch (error) {
      await this.cleanup([...fileList, "concat.txt", outputName]);
      this.state = "error";
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  // ─── buildArgs — pure arg construction, no side effects ──────────────────────

  private buildArgs(
    inputName: string,
    media: MediaFile,
    config: OperationConfig
  ): { outputName: string; args: string[] } {
    const ext = this.getExtension(media.name);
    const base = `out_${Date.now()}`;

    switch (config.type) {
      case "trim": {
        const outputName = `${base}_trim.${ext}`;
        const start = config.trimStart ?? 0;
        const end = config.trimEnd ?? media.duration ?? 60;
        return {
          outputName,
          args: ["-i", inputName, "-ss", String(start), "-to", String(end), "-c", "copy", outputName],
        };
      }

      case "resize": {
        const outputName = `${base}_resize.${ext}`;
        const w = config.width && config.width > 0 ? config.width : -2;
        const h = config.height && config.height > 0 ? config.height : -2;
        // Guard: both -2 is invalid — default to 1280 width maintain aspect
        const safeW = w === -2 && h === -2 ? 1280 : w;
        return {
          outputName,
          args: ["-i", inputName, "-vf", `scale=${safeW}:${h}`, "-c:a", "copy", outputName],
        };
      }

      case "compress": {
        const outputName = `${base}_compressed.mp4`;
        return {
          outputName,
          args: [
            "-i", inputName,
            "-c:v", "libx264",
            "-crf", String(config.crf ?? 28),
            "-preset", "fast",
            "-c:a", "aac",
            "-b:a", config.audioBitrate ?? "128k",
            outputName,
          ],
        };
      }

      case "speed": {
        const outputName = `${base}_speed.${ext}`;
        const factor = config.speedFactor ?? 1.5;
        const vPts = `setpts=${(1 / factor).toFixed(6)}*PTS`;
        const aTempo = this.buildAtempoChain(factor);
        // filter_complex is robust — handles audio-only and video-only streams too
        return {
          outputName,
          args: [
            "-i", inputName,
            "-filter_complex", `[0:v]${vPts}[v];[0:a]${aTempo}[a]`,
            "-map", "[v]",
            "-map", "[a]",
            outputName,
          ],
        };
      }

      case "loop": {
        const outputName = `${base}_loop.${ext}`;
        const count = Math.max(1, (config.loopCount ?? 3) - 1);
        return {
          outputName,
          args: ["-stream_loop", String(count), "-i", inputName, "-c", "copy", outputName],
        };
      }

      case "fps": {
        const outputName = `${base}_fps.${ext}`;
        return {
          outputName,
          args: ["-i", inputName, "-filter:v", `fps=${config.targetFps ?? 30}`, "-c:a", "copy", outputName],
        };
      }

      case "flip": {
        const outputName = `${base}_flip.${ext}`;
        const filterMap = { horizontal: "hflip", vertical: "vflip", both: "hflip,vflip" };
        return {
          outputName,
          args: [
            "-i", inputName,
            "-vf", filterMap[config.flipDirection ?? "horizontal"],
            "-c:a", "copy",
            outputName,
          ],
        };
      }

      case "reverse": {
        const outputName = `${base}_reverse.${ext}`;
        return {
          outputName,
          args: ["-i", inputName, "-vf", "reverse", "-af", "areverse", outputName],
        };
      }

      case "extract_audio": {
        const outputName = `${base}_audio.mp3`;
        return {
          outputName,
          args: ["-i", inputName, "-vn", "-acodec", "libmp3lame", "-ab", "192k", outputName],
        };
      }

      case "aspect_ratio": {
        const outputName = `${base}_aspect.${ext}`;
        const [aw, ah] = this.resolveAspectRatio(config);
        // scale-to-fit then pad — correct letterbox / pillarbox
        const vf = `scale=${aw}:${ah}:force_original_aspect_ratio=decrease,pad=${aw}:${ah}:(ow-iw)/2:(oh-ih)/2:black`;
        return {
          outputName,
          args: ["-i", inputName, "-vf", vf, "-c:a", "copy", outputName],
        };
      }

      case "format_convert": {
        const outExt = config.outputFormat ?? "mp4";
        const outputName = `${base}_converted.${outExt}`;
        return { outputName, args: ["-i", inputName, outputName] };
      }

      case "volume": {
        const outputName = `${base}_volume.${ext}`;
        return {
          outputName,
          args: ["-i", inputName, "-af", `volume=${config.volumeLevel ?? 1.5}`, "-c:v", "copy", outputName],
        };
      }

      case "rotate": {
        const outputName = `${base}_rotate.${ext}`;
        const transposeMap: Record<number, string> = {
          90: "transpose=1",
          180: "transpose=1,transpose=1",
          270: "transpose=2",
        };
        return {
          outputName,
          args: [
            "-i", inputName,
            "-vf", transposeMap[config.rotateDegrees ?? 90],
            "-c:a", "copy",
            outputName,
          ],
        };
      }

      case "denoise": {
        const outputName = `${base}_denoised.${ext}`;
        const s = config.denoiseStrength ?? 5;
        return {
          outputName,
          args: [
            "-i", inputName,
            "-vf", `hqdn3d=${s}:${s}:${s * 3}:${s * 3}`,
            "-c:a", "copy",
            outputName,
          ],
        };
      }

      default:
        throw new Error(`Unhandled operation: ${(config as OperationConfig).type}`);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private async cleanup(files: string[]): Promise<void> {
    await Promise.allSettled(files.map((f) => this.ffmpeg.deleteFile(f)));
  }

  private buildAtempoChain(factor: number): string {
    if (factor >= 0.5 && factor <= 2.0) return `atempo=${factor.toFixed(6)}`;
    const chains: string[] = [];
    let remaining = factor;
    if (factor > 2.0) {
      while (remaining > 2.0) {
        chains.push("atempo=2.0");
        remaining /= 2.0;
      }
    } else {
      while (remaining < 0.5) {
        chains.push("atempo=0.5");
        remaining *= 2.0;
      }
    }
    chains.push(`atempo=${remaining.toFixed(6)}`);
    return chains.join(",");
  }

  private resolveAspectRatio(config: OperationConfig): [number, number] {
    const map: Record<string, [number, number]> = {
      "16:9": [1920, 1080],
      "9:16": [1080, 1920],
      "1:1": [1080, 1080],
      "4:3": [1440, 1080],
      "3:4": [1080, 1440],
      "21:9": [2560, 1080],
    };
    if (config.aspectRatio === "custom") {
      return [config.customAspectW ?? 1920, config.customAspectH ?? 1080];
    }
    return map[config.aspectRatio ?? "16:9"] ?? [1920, 1080];
  }

  private getMimeType(filename: string, fallback: string): string {
    const ext = this.getExtension(filename);
    const map: Record<string, string> = {
      mp4: "video/mp4",
      webm: "video/webm",
      mov: "video/quicktime",
      avi: "video/x-msvideo",
      mkv: "video/x-matroska",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      aac: "audio/aac",
      ogg: "audio/ogg",
      flac: "audio/flac",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
    };
    return map[ext] ?? fallback;
  }

  private getExtension(filename: string): string {
    return filename.split(".").pop()?.toLowerCase() ?? "mp4";
  }

  // ─── Public utils ─────────────────────────────────────────────────────────────

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
}
