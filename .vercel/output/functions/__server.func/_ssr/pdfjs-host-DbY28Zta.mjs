import { n as PDFDataRangeTransport, r as getDocument, t as GlobalWorkerOptions } from "../_libs/pdfjs-dist.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pdfjs-host-DbY28Zta.js
var pdf_worker_min_default = "/assets/pdf.worker.min-Dswkl-cV.mjs";
var workerReady = false;
function ensurePdfjsWorker() {
	if (workerReady) return;
	GlobalWorkerOptions.workerSrc = pdf_worker_min_default;
	workerReady = true;
}
function yieldToUi() {
	return new Promise((resolve) => {
		setTimeout(resolve, 0);
	});
}
var FileRangeTransport = class extends PDFDataRangeTransport {
	file;
	constructor(file) {
		super(file.size, null);
		this.file = file;
	}
	requestDataRange(begin, end) {
		this.file.slice(begin, end).arrayBuffer().then((buffer) => {
			this.onDataRange(begin, new Uint8Array(buffer));
		}).catch(() => {
			this.onDataRange(begin, null);
		});
	}
};
async function openPdfFile(file) {
	ensurePdfjsWorker();
	let task;
	try {
		task = getDocument({
			range: new FileRangeTransport(file),
			disableAutoFetch: file.size > 41943040,
			disableStream: false,
			disableFontFace: false,
			useSystemFonts: true
		});
		return {
			pdf: await task.promise,
			close: async () => {
				await task.destroy();
			}
		};
	} catch {
		const data = new Uint8Array(await file.arrayBuffer());
		task = getDocument({
			data,
			disableFontFace: false,
			useSystemFonts: true
		});
		return {
			pdf: await task.promise,
			close: async () => {
				await task.destroy();
			}
		};
	}
}
function fitScale(widthPt, heightPt, dpi, maxPixels) {
	let scale = dpi / 72;
	if (widthPt * scale * (heightPt * scale) > maxPixels) scale = Math.sqrt(maxPixels / Math.max(1, widthPt * heightPt));
	return Math.max(.35, scale);
}
//#endregion
export { openPdfFile as n, yieldToUi as r, fitScale as t };
