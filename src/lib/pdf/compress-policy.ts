import type { CompressPreset } from "./types";

/** Typical text/vector pages stay well under this. Photo scans are much larger. */
export const SCAN_BYTES_PER_PAGE = 80_000;
export const TEXT_BYTES_PER_PAGE = 40_000;

export type CompressStrategy = "lossless" | "raster" | "original";

export function bytesPerPage(fileSize: number, pageCount: number) {
  return fileSize / Math.max(1, pageCount);
}

export function shouldRasterize(opts: {
  preset: CompressPreset;
  fileSize: number;
  pageCount: number;
  largeFileBytes: number;
}): boolean {
  const bpp = bytesPerPage(opts.fileSize, opts.pageCount);
  const looksLikeScan = bpp >= SCAN_BYTES_PER_PAGE;
  const looksLikeText = bpp < TEXT_BYTES_PER_PAGE;

  // Flattening text/vector PDFs to JPEGs almost always makes them larger.
  if (looksLikeText && opts.fileSize < opts.largeFileBytes) {
    return false;
  }
  if (opts.preset === "high" && !looksLikeScan) {
    return false;
  }
  return true;
}

export function pickCompressedBytes(candidates: {
  original: Uint8Array;
  lossless: Uint8Array | null;
  raster: Uint8Array | null;
}): { bytes: Uint8Array; strategy: CompressStrategy } {
  const options: { bytes: Uint8Array; strategy: CompressStrategy }[] = [
    { bytes: candidates.original, strategy: "original" },
  ];
  if (candidates.lossless) {
    options.push({ bytes: candidates.lossless, strategy: "lossless" });
  }
  if (candidates.raster) {
    options.push({ bytes: candidates.raster, strategy: "raster" });
  }
  options.sort((a, b) => {
    const diff = a.bytes.byteLength - b.bytes.byteLength;
    if (diff !== 0) return diff;
    return strategyRank(a.strategy) - strategyRank(b.strategy);
  });
  return options[0];
}

function strategyRank(strategy: CompressStrategy) {
  if (strategy === "lossless") return 0;
  if (strategy === "original") return 1;
  return 2;
}
