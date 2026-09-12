import type { PDFDocumentProxy } from "pdfjs-dist";
import { friendlyPdfError } from "./errors";
import { ensureFont, type TextRun } from "./fonts";
import { loadPdfDocument } from "./load";
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

function containRect(boxW: number, boxH: number, imageW: number, imageH: number) {
  const imageAspect = imageW / Math.max(1, imageH);
  const boxAspect = boxW / Math.max(0.01, boxH);
  if (imageAspect > boxAspect) {
    const height = boxW / imageAspect;
    return { width: boxW, height, x: 0, y: (boxH - height) / 2 };
  }
  const width = boxH * imageAspect;
  return { width, height: boxH, x: (boxW - width) / 2, y: 0 };
}

async function renderTextPng(stamp: TextStamp, pageWidthPt: number, pageHeightPt: number): Promise<Uint8Array> {
  const font = await ensureFont(stamp.fontId);
  const scale = 3;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(8, Math.round(stamp.w * pageWidthPt * scale));
  canvas.height = Math.max(8, Math.round(stamp.h * pageHeightPt * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  const align = stamp.align || "left";
  const khmer = stamp.fontId !== "lettering";
  const fontPx = Math.max(8, stamp.fontSize * pageHeightPt * scale * (khmer ? 0.78 : 1));
  ctx.font = `${fontPx}px ${font.css}`;

  const pad = 4 * scale;
  const lineHeight = fontPx * 1.15;
  splitRunsByLine(stamp.runs).forEach((lineRuns, lineIndex) => {
    const line = lineRuns.map((run) => run.text).join("");
    const total = ctx.measureText(line).width;
    let x =
      align === "center"
        ? (canvas.width - total) / 2
        : align === "right"
          ? canvas.width - pad - total
          : pad;
    const y = pad + lineIndex * lineHeight;
    for (const run of lineRuns) {
      if (!run.text) continue;
      ctx.fillStyle = run.color || "#1a1814";
      ctx.fillText(run.text, x, y);
      x += ctx.measureText(run.text).width;
    }
  });

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((next) => (next ? resolve(next) : reject(new Error("Could not render text."))), "image/png");
  });
  return new Uint8Array(await blob.arrayBuffer());
}

function splitRunsByLine(runs: TextRun[]): TextRun[][] {
  const lines: TextRun[][] = [[]];
  for (const run of runs) {
    const parts = run.text.split("\n");
    parts.forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ text: part, color: run.color });
    });
  }
  return lines;
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
  let opened;
  try {
    opened = await openPdfFile(file);
  } catch (err) {
    throw new Error(friendlyPdfError(err, "Could not read that PDF."));
  }
  const { pdf, close } = opened;
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
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await loadPdfDocument(bytes);
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
        const image = isPng(stamp.dataUrl) || raw[0] === 0x89 ? await doc.embedPng(raw) : await doc.embedJpg(raw);
        const fit = containRect(drawW, drawH, image.width, image.height);
        page.drawImage(image, {
          x: x + fit.x,
          y: y + fit.y,
          width: fit.width,
          height: fit.height,
        });
      } else {
        const png = await renderTextPng(stamp, width, height);
        const image = await doc.embedPng(png);
        page.drawImage(image, { x, y, width: drawW, height: drawH });
      }
      await yieldToUi();
    }

    return doc.save({ useObjectStreams: true });
  } catch (err) {
    throw new Error(friendlyPdfError(err, err instanceof Error ? err.message : "Could not export the signed PDF."));
  }
}
