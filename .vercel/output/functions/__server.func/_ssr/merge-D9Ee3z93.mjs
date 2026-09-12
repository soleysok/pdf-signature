import { n as openPdfFile, r as yieldToUi } from "./pdfjs-host-DbY28Zta.mjs";
import { t as PDFDocument } from "../_libs/pdf-lib.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/merge-D9Ee3z93.js
async function countPdfPages(file) {
	const { pdf, close } = await openPdfFile(file);
	try {
		return pdf.numPages;
	} finally {
		await close();
	}
}
async function mergePdfs(files, onProgress) {
	if (files.length < 2) throw new Error("Add at least two PDFs to merge.");
	const merged = await PDFDocument.create();
	const total = files.length;
	for (let i = 0; i < files.length; i += 1) {
		const file = files[i];
		onProgress?.(i + 1, total, `Adding ${file.name}`);
		const bytes = await file.arrayBuffer();
		const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
		const indices = src.getPageIndices();
		const chunk = 8;
		for (let start = 0; start < indices.length; start += chunk) {
			const slice = indices.slice(start, start + chunk);
			const pages = await merged.copyPages(src, slice);
			for (const page of pages) merged.addPage(page);
			await yieldToUi();
		}
		await yieldToUi();
	}
	onProgress?.(total, total, "Writing merged PDF");
	return merged.save({ useObjectStreams: true });
}
//#endregion
export { countPdfPages, mergePdfs };
