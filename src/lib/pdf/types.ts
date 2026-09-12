export type CompressPreset = "high" | "balanced" | "small";

export const COMPRESS_PRESETS: Record<
  CompressPreset,
  { label: string; hint: string; dpi: number; quality: number }
> = {
  high: {
    label: "High quality",
    hint: "Nearly identical on screen. Best for sharing.",
    dpi: 180,
    quality: 0.84,
  },
  balanced: {
    label: "Balanced",
    hint: "Strong shrink, hard to tell apart.",
    dpi: 150,
    quality: 0.76,
  },
  small: {
    label: "Smallest",
    hint: "Maximum shrink. Fine for email and preview.",
    dpi: 120,
    quality: 0.64,
  },
};

export const LARGE_FILE_BYTES = 80 * 1024 * 1024;
export const HUGE_FILE_BYTES = 350 * 1024 * 1024;

export function adaptCompress(preset: CompressPreset, fileSize: number) {
  const base = COMPRESS_PRESETS[preset];
  if (fileSize >= HUGE_FILE_BYTES) {
    return {
      dpi: Math.min(base.dpi, 110),
      quality: Math.min(base.quality, 0.72),
      maxPixels: 1_800_000,
    };
  }
  if (fileSize >= LARGE_FILE_BYTES) {
    return {
      dpi: Math.min(base.dpi, 130),
      quality: Math.min(base.quality, 0.76),
      maxPixels: 2_400_000,
    };
  }
  return { dpi: base.dpi, quality: base.quality, maxPixels: 4_000_000 };
}

export type PdfFileItem = {
  id: string;
  file: File;
  name: string;
  size: number;
  pages: number | null;
  error?: string;
};

export type ProgressFn = (current: number, total: number, label: string) => void;
