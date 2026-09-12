import { PDFDocument } from "pdf-lib";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { pickCompressedBytes, shouldRasterize, type CompressStrategy } from "./compress-policy";
import { friendlyPdfError } from "./errors";
import { loadPdfDocument } from "./load";
import { adaptCompress, LARGE_FILE_BYTES, type CompressPreset, type ProgressFn } from "./types";
import { fitScale, openPdfFile, yieldToUi } from "./pdfjs-host";

export type CompressResult = {
  bytes: Uint8Array;
  strategy: CompressStrategy;
};

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not encode page image."));
          return;
        }
        blob
          .arrayBuffer()
          .then((buf) => resolve(new Uint8Array(buf)))
          .catch(reject);
      },
      "image/jpeg",
      quality,
    );
  });
}

async function renderPageJpeg(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  dpi: number,
  quality: number,
  maxPixels: number,
): Promise<{ jpeg: Uint8Array; widthPt: number; heightPt: number }> {
  const page = await pdf.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const scale = fitScale(base.width, base.height, dpi, maxPixels);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas is not available in this browser.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvas,
    canvasContext: ctx,
    viewport,
  }).promise;

  const jpeg = await canvasToJpeg(canvas, quality);
  canvas.width = 0;
  canvas.height = 0;
  page.cleanup();

  return { jpeg, widthPt: base.width, heightPt: base.height };
}

async function tryLossless(
  bytes: Uint8Array,
): Promise<{ bytes: Uint8Array; pageCount: number } | null> {
  try {
    const doc = await loadPdfDocument(bytes);
    return {
      bytes: await doc.save({ useObjectStreams: true }),
      pageCount: doc.getPageCount(),
    };
  } catch {
    return null;
  }
}

async function rasterizePdf(
  file: File,
  preset: CompressPreset,
  onProgress?: ProgressFn,
): Promise<Uint8Array> {
  const { dpi, quality, maxPixels } = adaptCompress(preset, file.size);
  onProgress?.(0, 1, file.size >= LARGE_FILE_BYTES ? "Opening large PDF…" : "Flattening pages…");

  const { pdf: src, close } = await openPdfFile(file);
  const pageCount = src.numPages;
  const out = await PDFDocument.create();

  try {
    for (let i = 1; i <= pageCount; i += 1) {
      onProgress?.(i, pageCount, `Compressing page ${i} of ${pageCount}`);
      const { jpeg, widthPt, heightPt } = await renderPageJpeg(src, i, dpi, quality, maxPixels);
      const image = await out.embedJpg(jpeg);
      const page = out.addPage([widthPt, heightPt]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: widthPt,
        height: heightPt,
      });
      await src.cleanup(true);
      await yieldToUi();
    }
  } finally {
    await close();
  }

  onProgress?.(pageCount, pageCount, "Writing compressed PDF");
  return out.save({ useObjectStreams: true });
}

export async function compressPdf(
  file: File,
  preset: CompressPreset,
  onProgress?: ProgressFn,
): Promise<CompressResult> {
  try {
    const original = new Uint8Array(await file.arrayBuffer());
    onProgress?.(0, 1, "Optimizing PDF…");
    const lossless = await tryLossless(original);
    const pageCount = lossless?.pageCount ?? 1;

    let raster: Uint8Array | null = null;
    if (
      shouldRasterize({
        preset,
        fileSize: file.size,
        pageCount,
        largeFileBytes: LARGE_FILE_BYTES,
      })
    ) {
      raster = await rasterizePdf(file, preset, onProgress);
    }

    return pickCompressedBytes({
      original,
      lossless: lossless?.bytes ?? null,
      raster,
    });
  } catch (err) {
    throw new Error(friendlyPdfError(err, err instanceof Error ? err.message : "Compression failed."));
  }
}
