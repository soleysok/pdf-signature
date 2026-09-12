import { n as openPdfFile, r as yieldToUi, t as fitScale } from "./pdfjs-host-DbY28Zta.mjs";
import { r as adaptCompress } from "./routes-xTidm4Pe.mjs";
import { t as PDFDocument } from "../_libs/pdf-lib.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/compress-DjBnjGYq.js
function canvasToJpeg(canvas, quality) {
	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (!blob) {
				reject(/* @__PURE__ */ new Error("Could not encode page image."));
				return;
			}
			blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf))).catch(reject);
		}, "image/jpeg", quality);
	});
}
async function renderPageJpeg(pdf, pageNumber, dpi, quality, maxPixels) {
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
		viewport
	}).promise;
	const jpeg = await canvasToJpeg(canvas, quality);
	canvas.width = 0;
	canvas.height = 0;
	page.cleanup();
	return {
		jpeg,
		widthPt: base.width,
		heightPt: base.height
	};
}
async function compressPdf(file, preset, onProgress) {
	const { dpi, quality, maxPixels } = adaptCompress(preset, file.size);
	onProgress?.(0, 1, file.size >= 83886080 ? "Opening large PDF…" : "Opening PDF…");
	const { pdf: src, close } = await openPdfFile(file);
	const pageCount = src.numPages;
	const out = await PDFDocument.create();
	try {
		for (let i = 1; i <= pageCount; i += 1) {
			onProgress?.(i, pageCount, `Compressing page ${i} of ${pageCount}`);
			const { jpeg, widthPt, heightPt } = await renderPageJpeg(src, i, dpi, quality, maxPixels);
			const image = await out.embedJpg(jpeg);
			out.addPage([widthPt, heightPt]).drawImage(image, {
				x: 0,
				y: 0,
				width: widthPt,
				height: heightPt
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
//#endregion
export { compressPdf };
