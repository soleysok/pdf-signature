import {
  GlobalWorkerOptions,
  PDFDataRangeTransport,
  getDocument,
  type PDFDocumentLoadingTask,
  type PDFDocumentProxy,
} from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

let workerReady = false;

export function ensurePdfjsWorker() {
  if (workerReady) return;
  GlobalWorkerOptions.workerSrc = pdfjsWorker;
  workerReady = true;
}

export function yieldToUi() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

class FileRangeTransport extends PDFDataRangeTransport {
  private file: File;

  constructor(file: File) {
    super(file.size, null);
    this.file = file;
  }

  requestDataRange(begin: number, end: number) {
    this.file
      .slice(begin, end)
      .arrayBuffer()
      .then((buffer) => {
        this.onDataRange(begin, new Uint8Array(buffer));
      })
      .catch(() => {
        this.onDataRange(begin, null);
      });
  }
}

export async function openPdfFile(file: File): Promise<{
  pdf: PDFDocumentProxy;
  close: () => Promise<void>;
}> {
  ensurePdfjsWorker();
  let task: PDFDocumentLoadingTask;
  try {
    task = getDocument({
      range: new FileRangeTransport(file),
      disableAutoFetch: file.size > 40 * 1024 * 1024,
      disableStream: false,
      disableFontFace: false,
      useSystemFonts: true,
    });
    const pdf = await task.promise;
    return {
      pdf,
      close: async () => {
        await task.destroy();
      },
    };
  } catch {
    const data = new Uint8Array(await file.arrayBuffer());
    task = getDocument({
      data,
      disableFontFace: false,
      useSystemFonts: true,
    });
    const pdf = await task.promise;
    return {
      pdf,
      close: async () => {
        await task.destroy();
      },
    };
  }
}

export function fitScale(widthPt: number, heightPt: number, dpi: number, maxPixels: number) {
  let scale = dpi / 72;
  const pixels = widthPt * scale * (heightPt * scale);
  if (pixels > maxPixels) {
    scale = Math.sqrt(maxPixels / Math.max(1, widthPt * heightPt));
  }
  return Math.max(0.35, scale);
}
