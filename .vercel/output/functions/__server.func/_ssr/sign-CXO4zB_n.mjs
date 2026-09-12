import { n as openPdfFile, r as yieldToUi, t as fitScale } from "./pdfjs-host-DbY28Zta.mjs";
import { n as ensureFont } from "./routes-xTidm4Pe.mjs";
import { t as PDFDocument } from "../_libs/pdf-lib.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sign-CXO4zB_n.js
async function dataUrlToBytes(dataUrl) {
	const res = await fetch(dataUrl);
	return new Uint8Array(await res.arrayBuffer());
}
function isPng(dataUrl) {
	return dataUrl.startsWith("data:image/png");
}
async function renderTextPng(stamp, widthPx, heightPx) {
	const font = await ensureFont(stamp.fontId);
	const scale = 3;
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(8, Math.round(widthPx * scale));
	canvas.height = Math.max(8, Math.round(heightPx * scale));
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas is not available in this browser.");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.textBaseline = "top";
	ctx.textAlign = "left";
	ctx.font = `${Math.max(10, canvas.height * .62)}px ${font.css}`;
	const pad = canvas.width * .04;
	let x = pad;
	const y = canvas.height * .16;
	const max = canvas.width - pad;
	for (const run of stamp.runs) {
		if (!run.text) continue;
		ctx.fillStyle = run.color || "#1a1814";
		const words = run.text.split(/(\s+)/);
		for (const word of words) {
			const width = ctx.measureText(word).width;
			if (x + width > max && x > pad) break;
			ctx.fillText(word, x, y);
			x += width;
		}
	}
	const blob = await new Promise((resolve, reject) => {
		canvas.toBlob((next) => next ? resolve(next) : reject(/* @__PURE__ */ new Error("Could not render text.")), "image/png");
	});
	return new Uint8Array(await blob.arrayBuffer());
}
async function renderOnePage(pdf, index, maxPixels) {
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
	await page.render({
		canvas,
		canvasContext: ctx,
		viewport
	}).promise;
	const blob = await new Promise((resolve, reject) => {
		canvas.toBlob((next) => next ? resolve(next) : reject(/* @__PURE__ */ new Error("Could not render page.")), "image/jpeg", .78);
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
		heightPt: base.height
	};
}
async function openPreviewSession(file) {
	const maxPixels = file.size >= 367001600 ? 9e5 : file.size >= 83886080 ? 14e5 : 22e5;
	const { pdf, close } = await openPdfFile(file);
	const cache = /* @__PURE__ */ new Map();
	return {
		pageCount: pdf.numPages,
		async renderPage(index) {
			const hit = cache.get(index);
			if (hit) return hit;
			const preview = await renderOnePage(pdf, index, maxPixels);
			if (cache.size >= 2) {
				for (const [key, value] of cache) if (key !== index) {
					URL.revokeObjectURL(value.dataUrl);
					cache.delete(key);
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
		}
	};
}
async function applyStamps(file, stamps) {
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
			page.drawImage(image, {
				x,
				y,
				width: drawW,
				height: drawH
			});
		} else {
			const png = await renderTextPng(stamp, Math.max(48, drawW * 2.4), Math.max(24, drawH * 2.4));
			const image = await doc.embedPng(png);
			page.drawImage(image, {
				x,
				y,
				width: drawW,
				height: drawH
			});
		}
		await yieldToUi();
	}
	return doc.save({ useObjectStreams: true });
}
//#endregion
export { applyStamps, openPreviewSession };
