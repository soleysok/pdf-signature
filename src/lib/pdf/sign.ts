import { PDFDocument } from "pdf-lib";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { ensureFont, type TextRun } from "./fonts";
import { fitScale, openPdfFile, yieldToUi } from "./pdfjs-host";

export type PagePreview = {
  index: number;
  dataUrl: string;
  widthPx: number;
  heightPx: number;
  widthPt: number;
  heightPt: number;
};

export type ImageStamp = {
  id: string;
  type: "image";
  pageIndex: number;
  x: number;
  y: number;
  w: number;
  h: number;
  dataUrl: string;
};

export type TextStamp = {
  id: string;
  type: "text";
  pageIndex: number;
  x: number;
  y: number;
  w: number;
  h: number;
  fontId: string;
  fontSize: number;
  align: "left" | "center" | "right";
  runs: TextRun[];
};

export type Stamp = ImageStamp | TextStamp;

export type PreviewSession = {
  pageCount: number;
  renderPage: (index: number) => Promise<PagePreview>;
  close: () => Promise<void>;
};

async function dataUrlToBytes(dataUrl: string): Promise<Uint8Array> {
  const res = await fetch(dataUrl);
  return new Uint8Array(await res.arrayBuffer());
}

function isPng(dataUrl: string) {
  return dataUrl.startsWith("data:image/png");
}

async function renderTextPng(
  stamp: TextStamp,
  widthPx: number,
  heightPx: number,
  pageHeightPx: number,
): Promise<Uint8Array> {
  const font = await ensureFont(stamp.fontId);
  const scale = 3;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(8, Math.round(widthPx * scale));
  canvas.height = Math.max(8, Math.round(heightPx * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = "top";
  const align = stamp.align || "left";
  ctx.textAlign = "left";
  const fontPx = Math.max(8, stamp.fontSize * pageHeightPx * scale);
  ctx.font = `${fontPx}px ${font.css}`;

  const pad = canvas.width * 0.04;
  const y = canvas.height * 0.12;
  const line = stamp.runs.map((run) => run.text).join("");
  const total = ctx.measureText(line).width;
  let x =
    align === "center" ? (canvas.width - total) / 2 : align === "right" ? canvas.width - pad - total : pad;

  for (const run of stamp.runs) {
    if (!run.text) continue;
    ctx.fillStyle = run.color || "#1a1814";
    ctx.fillText(run.text, x, y);
    x += ctx.measureText(run.text).width;
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((next) => (next ? resolve(next) : reject(new Error("Could not render text."))), "image/png");
  });
  return new Uint8Array(await blob.arrayBuffer());
}

async function renderOnePage(
  pdf: PDFDocumentProxy,
  index: number,
  maxPixels: number,
): Promise<PagePreview> {
  const page = await pdf.getPage(index + 1);
  const base = page.getViewport({ scale: 1 });
  const scale = fitScale(base.width, base.height, 96, maxPixels);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (next) => (next ? resolve(next) : reject(new Error("Could not render page."))),
      "image/jpeg",
      0.78,
    );
  });
  const dataUrl = URL.createObjectURL(blob);
  canvas.width = 0;
  canvas.height = 0;
  page.cleanup();
  return {
    index,
    dataUrl,
    widthPx: Math.round(viewport.width),
    heightPx: Math.round(viewport.height),
    widthPt: base.width,
    heightPt: base.height,
  };
}

export async function openPreviewSession(file: File): Promise<PreviewSession> {
  const maxPixels = file.size >= 350 * 1024 * 1024 ? 900_000 : file.size >= 80 * 1024 * 1024 ? 1_400_000 : 2_200_000;
  const { pdf, close } = await openPdfFile(file);
  const cache = new Map<number, PagePreview>();

  return {
    pageCount: pdf.numPages,
    async renderPage(index: number) {
      const hit = cache.get(index);
      if (hit) return hit;
      const preview = await renderOnePage(pdf, index, maxPixels);
      if (cache.size >= 2) {
        for (const [key, value] of cache) {
          if (key !== index) {
            URL.revokeObjectURL(value.dataUrl);
            cache.delete(key);
          }
        }
      }
      cache.set(index, preview);
      await yieldToUi();
      return preview;
    },
    async close() {
      for (const value of cache.values()) URL.revokeObjectURL(value.dataUrl);
      cache.clear();
      await close();
    },
  };
}

export async function applyStamps(file: File, stamps: Stamp[]): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = doc.getPages();

  for (const stamp of stamps) {
    const page = pages[stamp.pageIndex];
    if (!page) continue;
    const { width, height } = page.getSize();
    const drawW = stamp.w * width;
    const drawH = stamp.h * height;
    const x = stamp.x * width;
    const y = height - stamp.y * height - drawH;

    if (stamp.type === "image") {
      const raw = await dataUrlToBytes(stamp.dataUrl);
      const image = isPng(stamp.dataUrl) ? await doc.embedPng(raw) : await doc.embedJpg(raw);
      page.drawImage(image, { x, y, width: drawW, height: drawH });
    } else {
      const png = await renderTextPng(
        stamp,
        Math.max(48, drawW * 2.4),
        Math.max(24, drawH * 2.4),
        height * 2.4,
      );
      const image = await doc.embedPng(png);
      page.drawImage(image, { x, y, width: drawW, height: drawH });
    }
    await yieldToUi();
  }

  return doc.save({ useObjectStreams: true });
}
