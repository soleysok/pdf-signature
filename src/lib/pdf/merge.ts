import { PDFDocument } from "pdf-lib";
import type { ProgressFn } from "./types";
import { friendlyPdfError } from "./errors";
import { loadPdfDocument } from "./load";
import { openPdfFile, yieldToUi } from "./pdfjs-host";

export async function countPdfPages(file: File): Promise<number> {
  const { pdf, close } = await openPdfFile(file);
  try {
    return pdf.numPages;
  } finally {
    await close();
  }
}

export async function mergePdfs(
  files: File[],
  onProgress?: ProgressFn,
): Promise<{ bytes: Uint8Array; pageCount: number }> {
  if (files.length < 2) {
    throw new Error("Add at least two PDFs to merge.");
  }

  const out = await PDFDocument.create();
  const total = files.length;

  try {
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      onProgress?.(i + 1, total, `Adding ${file.name}`);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const src = await loadPdfDocument(bytes);
      const indices = src.getPageIndices();
      const chunk = 8;
      for (let start = 0; start < indices.length; start += chunk) {
        const slice = indices.slice(start, start + chunk);
        const pages = await out.copyPages(src, slice);
        for (const page of pages) out.addPage(page);
        await yieldToUi();
      }
      await yieldToUi();
    }
  } catch (err) {
    throw new Error(friendlyPdfError(err, err instanceof Error ? err.message : "Merge failed."));
  }

  onProgress?.(total, total, "Writing merged PDF");
  const bytes = await out.save({ useObjectStreams: true });
  return { bytes, pageCount: out.getPageCount() };
}
