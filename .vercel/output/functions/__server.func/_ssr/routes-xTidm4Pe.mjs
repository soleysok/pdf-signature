import { i as __toESM } from "../_runtime.mjs";
import { I as require_jsx_runtime, L as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as ArrowUp, a as Trash2, c as Minimize2, d as Layers, f as FileStack, g as ChevronLeft, h as ChevronRight, l as Lock, m as Download, n as Upload, o as Plus, p as Eraser, r as Type, s as PenLine, t as X, u as LoaderCircle, v as ArrowDown } from "../_libs/lucide-react.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-xTidm4Pe.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var COMPRESS_PRESETS = {
	high: {
		label: "High quality",
		hint: "Nearly identical on screen. Best for sharing.",
		dpi: 180,
		quality: .84
	},
	balanced: {
		label: "Balanced",
		hint: "Strong shrink, hard to tell apart.",
		dpi: 150,
		quality: .76
	},
	small: {
		label: "Smallest",
		hint: "Maximum shrink. Fine for email and preview.",
		dpi: 120,
		quality: .64
	}
};
function adaptCompress(preset, fileSize) {
	const base = COMPRESS_PRESETS[preset];
	if (fileSize >= 367001600) return {
		dpi: Math.min(base.dpi, 110),
		quality: Math.min(base.quality, .72),
		maxPixels: 18e5
	};
	if (fileSize >= 83886080) return {
		dpi: Math.min(base.dpi, 130),
		quality: Math.min(base.quality, .76),
		maxPixels: 24e5
	};
	return {
		dpi: base.dpi,
		quality: base.quality,
		maxPixels: 4e6
	};
}
var TEXT_FONTS = [
	{
		id: "siemreap",
		label: "Khmer OS Siemreap",
		css: "\"Siemreap\", \"Khmer OS Siemreap\", serif",
		loadName: "Siemreap"
	},
	{
		id: "moul-light",
		label: "Khmer OS Moul Light",
		css: "\"Moulpali\", \"Moul\", \"Khmer OS Muol Light\", serif",
		loadName: "Moulpali"
	},
	{
		id: "battambang",
		label: "Khmer OS Battambang",
		css: "\"Battambang\", \"Khmer OS Battambang\", serif",
		loadName: "Battambang"
	},
	{
		id: "lettering",
		label: "Lettering (Tangerine)",
		css: "\"Tangerine\", \"Great Vibes\", cursive",
		loadName: "Tangerine"
	}
];
var DEFAULT_FONT = TEXT_FONTS[2];
var DEFAULT_TEXT_COLOR = "#1a1814";
function fontById(id) {
	return TEXT_FONTS.find((item) => item.id === id) ?? DEFAULT_FONT;
}
function runsToPlain(runs) {
	return runs.map((run) => run.text).join("");
}
function colorRuns(runs, start, end, color) {
	const plain = runsToPlain(runs);
	const from = Math.max(0, Math.min(start, end));
	const to = Math.min(plain.length, Math.max(start, end));
	if (from === to) return runs.map((run) => ({
		...run,
		color
	}));
	const before = plain.slice(0, from);
	const mid = plain.slice(from, to);
	const after = plain.slice(to);
	const next = [];
	if (before) next.push({
		text: before,
		color: colorAt(runs, 0)
	});
	if (mid) next.push({
		text: mid,
		color
	});
	if (after) next.push({
		text: after,
		color: colorAt(runs, to)
	});
	return mergeRuns(next);
}
function colorAt(runs, index) {
	let cursor = 0;
	for (const run of runs) {
		const next = cursor + run.text.length;
		if (index < next || index === next) return run.color;
		cursor = next;
	}
	return runs[runs.length - 1]?.color ?? "#1a1814";
}
function mergeRuns(runs) {
	const out = [];
	for (const run of runs) {
		if (!run.text) continue;
		const last = out[out.length - 1];
		if (last && last.color === run.color) last.text += run.text;
		else out.push({ ...run });
	}
	return out.length ? out : [{
		text: "",
		color: DEFAULT_TEXT_COLOR
	}];
}
function editPlainText(runs, nextText) {
	const prev = runsToPlain(runs);
	if (nextText === prev) return runs;
	let prefix = 0;
	while (prefix < prev.length && prefix < nextText.length && prev[prefix] === nextText[prefix]) prefix += 1;
	let suffix = 0;
	while (suffix < prev.length - prefix && suffix < nextText.length - prefix && prev[prev.length - 1 - suffix] === nextText[nextText.length - 1 - suffix]) suffix += 1;
	const inserted = nextText.slice(prefix, nextText.length - suffix);
	const head = sliceRuns(runs, 0, prefix);
	const tail = sliceRuns(runs, prev.length - suffix, prev.length);
	const color = head[head.length - 1]?.color ?? tail[0]?.color ?? "#1a1814";
	return mergeRuns([
		...head,
		...inserted ? [{
			text: inserted,
			color
		}] : [],
		...tail
	]);
}
function sliceRuns(runs, start, end) {
	const out = [];
	let cursor = 0;
	for (const run of runs) {
		const next = cursor + run.text.length;
		if (next <= start || cursor >= end) {
			cursor = next;
			continue;
		}
		const from = Math.max(0, start - cursor);
		const to = Math.min(run.text.length, end - cursor);
		const text = run.text.slice(from, to);
		if (text) out.push({
			text,
			color: run.color
		});
		cursor = next;
	}
	return out;
}
async function ensureFont(id) {
	const font = fontById(id);
	if (typeof document === "undefined" || !document.fonts) return font;
	try {
		await document.fonts.load(`24px "${font.loadName}"`);
		await document.fonts.ready;
	} catch {}
	return font;
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function formatBytes(bytes) {
	if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
	const units = [
		"B",
		"KB",
		"MB",
		"GB"
	];
	const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
	const value = bytes / 1024 ** i;
	const digits = value >= 100 || i === 0 ? 0 : value >= 10 ? 1 : 2;
	return `${value.toFixed(digits)} ${units[i]}`;
}
function downloadBlob(data, filename) {
	const buffer = data.byteOffset === 0 && data.buffer instanceof ArrayBuffer && data.byteLength === data.buffer.byteLength ? data.buffer : (() => {
		const copy = new Uint8Array(data.byteLength);
		copy.set(data);
		return copy.buffer;
	})();
	const blob = new Blob([buffer], { type: "application/pdf" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 3e4);
}
function trimTransparentCanvas(source) {
	const ctx = source.getContext("2d");
	if (!ctx) return source;
	const { width, height } = source;
	const pixels = ctx.getImageData(0, 0, width, height).data;
	let top = height;
	let left = width;
	let right = 0;
	let bottom = 0;
	for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) if (pixels[(y * width + x) * 4 + 3] > 12) {
		if (x < left) left = x;
		if (x > right) right = x;
		if (y < top) top = y;
		if (y > bottom) bottom = y;
	}
	if (right < left || bottom < top) return source;
	const pad = 6;
	const sx = Math.max(0, left - pad);
	const sy = Math.max(0, top - pad);
	const sw = Math.min(width - sx, right - left + 1 + 12);
	const sh = Math.min(height - sy, bottom - top + 1 + 12);
	const out = document.createElement("canvas");
	out.width = sw;
	out.height = sh;
	const outCtx = out.getContext("2d");
	if (!outCtx) return source;
	outCtx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
	return out;
}
function SignaturePad({ onSave }) {
	const canvasRef = (0, import_react.useRef)(null);
	const drawing = (0, import_react.useRef)(false);
	const last = (0, import_react.useRef)(null);
	const [dirty, setDirty] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const resize = () => {
			const rect = canvas.getBoundingClientRect();
			const ratio = Math.min(2.5, window.devicePixelRatio || 1);
			const next = document.createElement("canvas");
			next.width = canvas.width;
			next.height = canvas.height;
			const prev = next.getContext("2d");
			if (prev && canvas.width && canvas.height) prev.drawImage(canvas, 0, 0);
			canvas.width = Math.max(2, Math.round(rect.width * ratio));
			canvas.height = Math.max(2, Math.round(rect.height * ratio));
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.strokeStyle = "#1a1814";
			ctx.lineWidth = Math.max(2.2, canvas.width / 180);
			if (prev) ctx.drawImage(next, 0, 0, canvas.width, canvas.height);
		};
		resize();
		window.addEventListener("resize", resize);
		return () => window.removeEventListener("resize", resize);
	}, []);
	function pos(event) {
		const canvas = canvasRef.current;
		const rect = canvas.getBoundingClientRect();
		return {
			x: (event.clientX - rect.left) / rect.width * canvas.width,
			y: (event.clientY - rect.top) / rect.height * canvas.height
		};
	}
	function strokeTo(point) {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx || !last.current) return;
		ctx.beginPath();
		ctx.moveTo(last.current.x, last.current.y);
		ctx.lineTo(point.x, point.y);
		ctx.stroke();
		last.current = point;
	}
	function clearPad() {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		setDirty(false);
	}
	function savePad() {
		const canvas = canvasRef.current;
		if (!canvas || !dirty) return;
		const trimmed = trimTransparentCanvas(canvas);
		onSave(trimmed.toDataURL("image/png"), trimmed.width / Math.max(1, trimmed.height));
		clearPad();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-line bg-surface-2 p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium tracking-wide text-muted uppercase",
					children: "Draw signature"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: clearPad,
					className: "inline-flex min-h-11 items-center gap-1.5 px-1 text-xs text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eraser, { className: "size-3.5" }), "Clear"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: cn("sign-pad h-36 w-full touch-none rounded-md border border-line bg-white", "select-none outline-none"),
				style: {
					WebkitUserSelect: "none",
					userSelect: "none",
					touchAction: "none"
				},
				onContextMenu: (event) => event.preventDefault(),
				onPointerDown: (event) => {
					event.preventDefault();
					event.currentTarget.setPointerCapture(event.pointerId);
					drawing.current = true;
					last.current = pos(event);
					setDirty(true);
				},
				onPointerMove: (event) => {
					if (!drawing.current) return;
					event.preventDefault();
					strokeTo(pos(event));
				},
				onPointerUp: (event) => {
					drawing.current = false;
					last.current = null;
					try {
						event.currentTarget.releasePointerCapture(event.pointerId);
					} catch {}
				},
				onPointerCancel: () => {
					drawing.current = false;
					last.current = null;
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: !dirty,
				onClick: savePad,
				className: "mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-ink text-sm font-medium text-surface-2 disabled:opacity-35",
				children: "Save signature"
			})
		]
	});
}
function newId$1() {
	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function SignStudio() {
	const [file, setFile] = (0, import_react.useState)(null);
	const [page, setPage] = (0, import_react.useState)(null);
	const [pageCount, setPageCount] = (0, import_react.useState)(0);
	const [pageIndex, setPageIndex] = (0, import_react.useState)(0);
	const [stamps, setStamps] = (0, import_react.useState)([]);
	const [marks, setMarks] = (0, import_react.useState)([]);
	const [activeMark, setActiveMark] = (0, import_react.useState)(null);
	const [placeMode, setPlaceMode] = (0, import_react.useState)(null);
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [loadingDoc, setLoadingDoc] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [result, setResult] = (0, import_react.useState)(null);
	const [dragOver, setDragOver] = (0, import_react.useState)(false);
	const drag = (0, import_react.useRef)(null);
	const usedStamp = (0, import_react.useRef)(false);
	const pdfInput = (0, import_react.useRef)(null);
	const imageInput = (0, import_react.useRef)(null);
	const sessionRef = (0, import_react.useRef)(null);
	const showPage = (0, import_react.useCallback)(async (index) => {
		const session = sessionRef.current;
		if (!session) return;
		const preview = await session.renderPage(index);
		setPage(preview);
		setPageIndex(index);
	}, []);
	const loadPdf = (0, import_react.useCallback)(async (next) => {
		setLoadingDoc(true);
		setError(null);
		setResult(null);
		setStamps([]);
		setSelected(null);
		setPage(null);
		await sessionRef.current?.close();
		sessionRef.current = null;
		try {
			const { openPreviewSession } = await import("./sign-CXO4zB_n.mjs");
			const session = await openPreviewSession(next);
			sessionRef.current = session;
			setFile(next);
			setPageCount(session.pageCount);
			await showPage(0);
		} catch (err) {
			setFile(null);
			setPage(null);
			setPageCount(0);
			setError(err instanceof Error ? err.message : "Could not read that PDF.");
		} finally {
			setLoadingDoc(false);
		}
	}, [showPage]);
	(0, import_react.useEffect)(() => {
		return () => {
			sessionRef.current?.close();
		};
	}, []);
	async function onPdfFiles(list) {
		const pdf = Array.from(list).find((item) => item.type === "application/pdf" || item.name.toLowerCase().endsWith(".pdf"));
		if (!pdf) {
			setError("Attach one PDF file.");
			return;
		}
		await loadPdf(pdf);
	}
	function addMark(dataUrl, aspect) {
		const mark = {
			id: newId$1(),
			dataUrl,
			aspect
		};
		setMarks((prev) => [mark, ...prev]);
		setActiveMark(mark.id);
		setPlaceMode("image");
	}
	async function onImageFiles(list) {
		const image = Array.from(list).find((item) => item.type.startsWith("image/"));
		if (!image) {
			setError("Use a PNG or JPG image.");
			return;
		}
		const dataUrl = await fileToDataUrl(image);
		addMark(dataUrl, await imageAspect(dataUrl));
	}
	function placeOnPage(pageIndex, nx, ny) {
		if (placeMode === "text") {
			const stamp = {
				id: newId$1(),
				type: "text",
				pageIndex,
				x: Math.min(.62, Math.max(0, nx - .16)),
				y: Math.min(.9, Math.max(0, ny - .04)),
				w: .36,
				h: .07,
				fontId: DEFAULT_FONT.id,
				fontSize: .045,
				runs: [{
					text: "អត្ថបទ",
					color: DEFAULT_TEXT_COLOR
				}]
			};
			setStamps((prev) => [...prev, stamp]);
			setSelected(stamp.id);
			setPlaceMode(null);
			return;
		}
		const mark = marks.find((item) => item.id === activeMark);
		if (!mark) return;
		const w = .28;
		const h = Math.min(.22, w / Math.max(.25, mark.aspect));
		const stamp = {
			id: newId$1(),
			type: "image",
			pageIndex,
			x: Math.min(.72, Math.max(0, nx - w / 2)),
			y: Math.min(1 - h, Math.max(0, ny - h / 2)),
			w,
			h,
			dataUrl: mark.dataUrl
		};
		setStamps((prev) => [...prev, stamp]);
		setSelected(stamp.id);
		setPlaceMode(null);
	}
	function pageCoords(event, el) {
		const rect = el.getBoundingClientRect();
		return {
			nx: (event.clientX - rect.left) / rect.width,
			ny: (event.clientY - rect.top) / rect.height
		};
	}
	function startMove(event, stamp) {
		event.preventDefault();
		event.stopPropagation();
		event.currentTarget.setPointerCapture(event.pointerId);
		const page = event.currentTarget.closest("[data-page]");
		if (!page) return;
		const { nx, ny } = pageCoords(event, page);
		drag.current = {
			kind: "move",
			id: stamp.id,
			dx: nx - stamp.x,
			dy: ny - stamp.y,
			aspect: stamp.w / Math.max(.01, stamp.h)
		};
		usedStamp.current = true;
		setSelected(stamp.id);
	}
	function startResize(event, stamp) {
		event.preventDefault();
		event.stopPropagation();
		event.currentTarget.setPointerCapture(event.pointerId);
		drag.current = {
			kind: "resize",
			id: stamp.id,
			dx: 0,
			dy: 0,
			aspect: stamp.w / Math.max(.01, stamp.h)
		};
		usedStamp.current = true;
		setSelected(stamp.id);
	}
	function updateStamp(id, patch) {
		setStamps((prev) => prev.map((stamp) => stamp.id === id && stamp.type === "text" ? {
			...stamp,
			...patch
		} : stamp));
	}
	function moveStamp(event, pageEl, pageIndex) {
		if (!drag.current) return;
		event.preventDefault();
		const { nx, ny } = pageCoords(event, pageEl);
		const { id, dx, dy, kind, aspect } = drag.current;
		setStamps((prev) => prev.map((stamp) => {
			if (stamp.id !== id) return stamp;
			if (kind === "resize") {
				const nextW = Math.min(.95 - stamp.x, Math.max(.08, nx - stamp.x));
				const nextH = stamp.type === "image" ? Math.min(.95 - stamp.y, Math.max(.04, nextW / Math.max(.2, aspect))) : Math.min(.4, Math.max(.035, ny - stamp.y));
				if (stamp.type === "text") return {
					...stamp,
					w: nextW,
					h: nextH,
					fontSize: Math.max(.02, nextH * .62)
				};
				return {
					...stamp,
					w: nextW,
					h: nextH
				};
			}
			return {
				...stamp,
				pageIndex,
				x: Math.min(1 - stamp.w, Math.max(0, nx - dx)),
				y: Math.min(1 - stamp.h, Math.max(0, ny - dy))
			};
		}));
	}
	async function exportSigned() {
		if (!file) return;
		if (stamps.length === 0) {
			setError("Add a signature or some text first.");
			return;
		}
		setBusy(true);
		setError(null);
		try {
			const { applyStamps } = await import("./sign-CXO4zB_n.mjs");
			const bytes = await applyStamps(file, stamps);
			const base = file.name.replace(/\.pdf$/i, "");
			setResult({
				bytes,
				name: `${base}-signed.pdf`
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not export the signed PDF.");
		} finally {
			setBusy(false);
		}
	}
	const selectedStamp = stamps.find((stamp) => stamp.id === selected) ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: pdfInput,
				type: "file",
				accept: "application/pdf,.pdf",
				className: "hidden",
				onChange: (event) => {
					if (event.target.files) onPdfFiles(event.target.files);
					event.target.value = "";
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: imageInput,
				type: "file",
				accept: "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp",
				className: "hidden",
				onChange: (event) => {
					if (event.target.files) onImageFiles(event.target.files);
					event.target.value = "";
				}
			}),
			!file ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onDragOver: (event) => {
					event.preventDefault();
					setDragOver(true);
				},
				onDragLeave: () => setDragOver(false),
				onDrop: (event) => {
					event.preventDefault();
					setDragOver(false);
					if (event.dataTransfer.files.length) onPdfFiles(event.dataTransfer.files);
				},
				onClick: () => pdfInput.current?.click(),
				className: cn("flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-line px-4 py-12 text-center shadow-sheet", dragOver ? "bg-bg-deep" : "bg-surface-2"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex size-11 items-center justify-center rounded-md bg-bg-deep text-accent",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
							className: "size-5",
							strokeWidth: 1.75
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium text-ink",
						children: "Attach one PDF"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "Then draw or drop signatures and text onto the pages. Large files open one page at a time."
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-sm font-medium text-ink",
						children: file.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-mono text-xs text-muted tabular-nums",
						children: [
							formatBytes(file.size),
							" · ",
							pageCount,
							" page",
							pageCount === 1 ? "" : "s"
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-xs text-ink-soft underline-offset-2 hover:underline",
					onClick: () => {
						sessionRef.current?.close();
						sessionRef.current = null;
						setFile(null);
						setPage(null);
						setPageCount(0);
						setStamps([]);
						setResult(null);
					},
					children: "Change file"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignaturePad, { onSave: addMark }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => imageInput.current?.click(),
							className: "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-surface text-sm font-medium text-ink",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }), "Image"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setPlaceMode((mode) => mode === "text" ? null : "text"),
							className: cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium", placeMode === "text" ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface text-ink"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Type, { className: "size-4" }), "Text"]
						})]
					}),
					marks.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2 overflow-x-auto pb-1",
						children: marks.map((mark) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative shrink-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									setActiveMark(mark.id);
									setPlaceMode("image");
								},
								className: cn("flex h-16 w-28 items-center justify-center rounded-md border bg-white p-1", activeMark === mark.id && placeMode === "image" ? "border-accent" : "border-line"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: mark.dataUrl,
									alt: "",
									className: "max-h-full max-w-full select-none object-contain",
									draggable: false
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "Remove signature",
								onClick: () => {
									setMarks((prev) => prev.filter((item) => item.id !== mark.id));
									if (activeMark === mark.id) {
										setActiveMark(null);
										setPlaceMode(null);
									}
								},
								className: "absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full border border-line bg-surface text-muted",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3" })
							})]
						}, mark.id))
					}) : null
				]
			}),
			placeMode ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-md border border-line bg-surface px-3 py-2 text-xs text-ink-soft",
				children: placeMode === "text" ? "Tap a page to drop a text box. Drag it after it lands." : "Tap a page to stamp the selected signature. Drag to reposition."
			}) : null,
			file && file.size >= 83886080 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-md border border-line bg-surface px-3 py-2 text-xs leading-relaxed text-ink-soft",
				children: "Large PDF — pages load one at a time so files around 500 MB can stay open."
			}) : null,
			loadingDoc ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-center gap-2 text-sm text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "Opening PDF…"]
			}) : null,
			page ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3",
				children: [
					pageCount > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm text-ink disabled:opacity-35",
								disabled: pageIndex <= 0,
								onClick: () => void showPage(pageIndex - 1),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), "Prev"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-xs text-muted tabular-nums",
								children: [
									"Page ",
									pageIndex + 1,
									" / ",
									pageCount
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm text-ink disabled:opacity-35",
								disabled: pageIndex >= pageCount - 1,
								onClick: () => void showPage(pageIndex + 1),
								children: ["Next", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })]
							})
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageStage, {
						page,
						stamps: stamps.filter((stamp) => stamp.pageIndex === page.index),
						selected,
						placing: placeMode !== null,
						onMove: (event, el) => {
							if (drag.current) moveStamp(event, el, page.index);
						},
						onPageUp: (event, el) => {
							if (usedStamp.current) {
								usedStamp.current = false;
								drag.current = null;
								return;
							}
							if (placeMode) {
								const { nx, ny } = pageCoords(event, el);
								placeOnPage(page.index, nx, ny);
							} else setSelected(null);
							drag.current = null;
						},
						onStampDown: startMove,
						onResizeDown: startResize,
						onChangeRuns: (id, runs) => updateStamp(id, { runs }),
						onSelect: setSelected,
						onRemove: (id) => {
							setStamps((prev) => prev.filter((stamp) => stamp.id !== id));
							if (selected === id) setSelected(null);
						}
					}),
					selectedStamp?.type === "text" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextToolbar, {
						stamp: selectedStamp,
						onFont: (fontId) => updateStamp(selectedStamp.id, { fontId }),
						onSize: (fontSize) => updateStamp(selectedStamp.id, {
							fontSize,
							h: Math.max(.035, fontSize * 1.55)
						}),
						onColor: (color, selection) => {
							if (selection) {
								updateStamp(selectedStamp.id, { runs: colorRuns(selectedStamp.runs, selection.start, selection.end, color) });
								return;
							}
							updateStamp(selectedStamp.id, { runs: selectedStamp.runs.map((run) => ({
								...run,
								color
							})) });
						}
					}) : selectedStamp?.type === "image" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "Drag the corner handle to resize the image."
					}) : null
				]
			}) : null,
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-md border border-line bg-surface px-3 py-2 text-sm text-danger",
				role: "alert",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				disabled: !file || stamps.length === 0 || busy,
				onClick: () => void exportSigned(),
				className: "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg disabled:cursor-not-allowed disabled:opacity-40",
				children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : null, "Export signed PDF"]
			}),
			result ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-line bg-surface-2 px-4 py-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium text-ink",
						children: "Ready to download"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-mono text-xs text-muted",
						children: result.name
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-faint",
						onClick: () => setResult(null),
						"aria-label": "Dismiss result",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => downloadBlob(result.bytes, result.name),
					className: "mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-ink px-3 text-sm font-medium text-surface-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }),
						"Download ",
						result.name
					]
				})]
			}) : null
		]
	});
}
function PageStage({ page, stamps, selected, placing, onMove, onPageUp, onStampDown, onResizeDown, onChangeRuns, onSelect, onRemove }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "overflow-hidden rounded-xl border border-line bg-bg-deep p-2 shadow-sheet sm:p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mb-2 font-mono text-xs text-faint",
			children: ["Page ", page.index + 1]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			"data-page": page.index,
			className: cn("relative mx-auto overflow-hidden rounded-md bg-white select-none", placing ? "cursor-crosshair" : "cursor-default"),
			style: {
				width: "100%",
				aspectRatio: `${page.widthPx} / ${page.heightPx}`,
				WebkitUserSelect: "none",
				userSelect: "none",
				touchAction: "none"
			},
			onPointerMove: (event) => onMove(event, event.currentTarget),
			onPointerUp: (event) => onPageUp(event, event.currentTarget),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: page.dataUrl,
				alt: `Page ${page.index + 1}`,
				draggable: false,
				className: "pointer-events-none block h-full w-full select-none"
			}), stamps.map((stamp) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				"data-stamp": stamp.id,
				className: cn("absolute", selected === stamp.id ? "ring-2 ring-accent" : "ring-1 ring-transparent"),
				style: {
					left: `${stamp.x * 100}%`,
					top: `${stamp.y * 100}%`,
					width: `${stamp.w * 100}%`,
					height: `${stamp.h * 100}%`
				},
				onPointerDown: (event) => {
					if (event.target.closest("[data-resize]")) return;
					if (event.target.closest("[data-text-edit]")) return;
					onStampDown(event, stamp);
				},
				children: [stamp.type === "image" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: stamp.dataUrl,
					alt: "",
					draggable: false,
					className: "h-full w-full select-none object-contain"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextEditor, {
					stamp,
					active: selected === stamp.id,
					onSelect: () => onSelect(stamp.id),
					onChange: (runs) => onChangeRuns(stamp.id, runs)
				}), selected === stamp.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Remove item",
					className: "absolute -top-3 -right-3 z-10 flex size-7 items-center justify-center rounded-full bg-ink text-surface-2",
					onPointerDown: (event) => event.stopPropagation(),
					onClick: () => onRemove(stamp.id),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"data-resize": "1",
					"aria-label": "Resize",
					className: "absolute -right-1.5 -bottom-1.5 z-10 size-4 rounded-sm border border-line bg-accent",
					onPointerDown: (event) => onResizeDown(event, stamp)
				})] }) : null]
			}, stamp.id))]
		})]
	});
}
function TextEditor({ stamp, active, onSelect, onChange }) {
	const font = fontById(stamp.fontId);
	const field = (0, import_react.useRef)(null);
	const plain = runsToPlain(stamp.runs);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-text-edit": "1",
		className: "relative h-full w-full",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			"aria-hidden": true,
			className: "pointer-events-none absolute inset-0 overflow-hidden px-1 leading-tight whitespace-pre-wrap",
			style: {
				fontFamily: font.css,
				fontSize: `clamp(12px, ${stamp.fontSize * 180}%, 72px)`
			},
			children: stamp.runs.map((run, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				style: { color: run.color },
				children: run.text
			}, `${index}-${run.color}`))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
			ref: field,
			value: plain,
			spellCheck: false,
			onPointerDown: (event) => {
				event.stopPropagation();
				onSelect();
			},
			onChange: (event) => {
				onChange(editPlainText(stamp.runs, event.target.value));
			},
			className: "absolute inset-0 h-full w-full resize-none bg-transparent px-1 leading-tight text-transparent caret-ink outline-none",
			style: {
				fontFamily: font.css,
				fontSize: `clamp(12px, ${stamp.fontSize * 180}%, 72px)`,
				userSelect: active ? "text" : "none"
			}
		})]
	});
}
function TextToolbar({ stamp, onFont, onSize, onColor }) {
	const colors = [
		"#1a1814",
		"#8a2e24",
		"#1f4d3a",
		"#1d3a6b",
		"#8a4b1f"
	];
	const current = stamp.runs[stamp.runs.length - 1]?.color ?? "#1a1814";
	function applyColor(color) {
		const field = document.querySelector("[data-text-edit] textarea");
		if (field && field.selectionStart !== field.selectionEnd) {
			onColor(color, {
				start: field.selectionStart,
				end: field.selectionEnd
			});
			return;
		}
		onColor(color);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-3 rounded-xl border border-line bg-surface px-3 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "grid gap-1 text-xs text-muted",
				children: ["Font", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					value: stamp.fontId,
					onChange: (event) => onFont(event.target.value),
					className: "min-h-11 rounded-md border border-line bg-surface-2 px-2 text-sm text-ink",
					children: TEXT_FONTS.map((font) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: font.id,
						children: font.label
					}, font.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "grid gap-1 text-xs text-muted",
				children: ["Size", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					min: .022,
					max: .12,
					step: .002,
					value: stamp.fontSize,
					onChange: (event) => onSize(Number(event.target.value))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "Color — select words in the text box, then pick a color"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [colors.map((color) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": `Color ${color}`,
						onClick: () => applyColor(color),
						className: cn("size-8 rounded-full border border-line", current === color ? "ring-2 ring-accent" : ""),
						style: { background: color }
					}, color)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "color",
						value: current,
						"aria-label": "Custom text color",
						onChange: (event) => applyColor(event.target.value),
						className: "h-8 w-10 cursor-pointer rounded-md border border-line bg-surface-2"
					})]
				})]
			})
		]
	});
}
function fileToDataUrl(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(/* @__PURE__ */ new Error("Could not read image."));
		reader.readAsDataURL(file);
	});
}
function imageAspect(dataUrl) {
	return new Promise((resolve) => {
		const image = new Image();
		image.onload = () => resolve(image.naturalWidth / Math.max(1, image.naturalHeight));
		image.onerror = () => resolve(2);
		image.src = dataUrl;
	});
}
function newId() {
	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function isPdfFile(file) {
	return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}
function BinderyApp() {
	const [mode, setMode] = (0, import_react.useState)("merge");
	const [items, setItems] = (0, import_react.useState)([]);
	const [preset, setPreset] = (0, import_react.useState)("high");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [progress, setProgress] = (0, import_react.useState)(null);
	const [result, setResult] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [dragOver, setDragOver] = (0, import_react.useState)(false);
	const inputRef = (0, import_react.useRef)(null);
	const totalSize = (0, import_react.useMemo)(() => items.reduce((sum, item) => sum + item.size, 0), [items]);
	const totalPages = (0, import_react.useMemo)(() => items.reduce((sum, item) => sum + (item.pages ?? 0), 0), [items]);
	const addFiles = (0, import_react.useCallback)(async (fileList) => {
		const incoming = Array.from(fileList).filter(isPdfFile);
		if (incoming.length === 0) {
			setError("Drop PDF files only.");
			return;
		}
		setError(null);
		setResult(null);
		const next = incoming.map((file) => ({
			id: newId(),
			file,
			name: file.name,
			size: file.size,
			pages: null
		}));
		setItems((prev) => [...prev, ...next]);
		const { countPdfPages } = await import("./merge-D9Ee3z93.mjs");
		await Promise.all(next.map(async (item) => {
			try {
				const pages = await countPdfPages(item.file);
				setItems((prev) => prev.map((row) => row.id === item.id ? {
					...row,
					pages
				} : row));
			} catch {
				setItems((prev) => prev.map((row) => row.id === item.id ? {
					...row,
					error: "Could not read this PDF."
				} : row));
			}
		}));
	}, []);
	const onDrop = (0, import_react.useCallback)((event) => {
		event.preventDefault();
		setDragOver(false);
		if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
	}, [addFiles]);
	function moveItem(id, dir) {
		setItems((prev) => {
			const index = prev.findIndex((item) => item.id === id);
			const target = index + dir;
			if (index < 0 || target < 0 || target >= prev.length) return prev;
			const copy = [...prev];
			const [row] = copy.splice(index, 1);
			copy.splice(target, 0, row);
			return copy;
		});
		setResult(null);
	}
	function removeItem(id) {
		setItems((prev) => prev.filter((item) => item.id !== id));
		setResult(null);
	}
	async function runMerge() {
		if (items.length < 2) {
			setError("Add at least two PDFs to merge.");
			return;
		}
		setBusy(true);
		setError(null);
		setResult(null);
		try {
			const { mergePdfs } = await import("./merge-D9Ee3z93.mjs");
			const bytes = await mergePdfs(items.map((item) => item.file), (current, total, label) => setProgress({
				current,
				total,
				label
			}));
			setResult({
				bytes,
				name: "merged.pdf",
				sourceSize: totalSize
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Merge failed.");
		} finally {
			setBusy(false);
			setProgress(null);
		}
	}
	async function runCompress() {
		if (items.length === 0) {
			setError("Add a PDF to compress.");
			return;
		}
		setBusy(true);
		setError(null);
		setResult(null);
		try {
			const { compressPdf } = await import("./compress-DjBnjGYq.mjs");
			if (items.length === 1) {
				const item = items[0];
				const bytes = await compressPdf(item.file, preset, (current, total, label) => setProgress({
					current,
					total,
					label
				}));
				const base = item.name.replace(/\.pdf$/i, "");
				setResult({
					bytes,
					name: `${base}-compressed.pdf`,
					sourceSize: item.size
				});
				return;
			}
			const { mergePdfs } = await import("./merge-D9Ee3z93.mjs");
			setProgress({
				current: 0,
				total: 1,
				label: "Merging first, then compressing"
			});
			const merged = await mergePdfs(items.map((item) => item.file), (current, total, label) => setProgress({
				current,
				total,
				label: `Merge · ${label}`
			}));
			const mergedCopy = new Uint8Array(merged.byteLength);
			mergedCopy.set(merged);
			const bytes = await compressPdf(new File([mergedCopy], "merged.pdf", { type: "application/pdf" }), preset, (current, total, label) => setProgress({
				current,
				total,
				label
			}));
			setResult({
				bytes,
				name: "merged-compressed.pdf",
				sourceSize: totalSize
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Compression failed.");
		} finally {
			setBusy(false);
			setProgress(null);
		}
	}
	const canRun = mode === "merge" ? items.length >= 2 && !busy : items.length >= 1 && !busy;
	const saved = result && result.sourceSize > result.bytes.byteLength ? 1 - result.bytes.byteLength / result.sourceSize : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-16 pt-8 sm:px-6 sm:pt-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-8 flex items-start justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 font-mono text-xs tracking-[0.18em] text-faint uppercase",
						children: "Local PDF studio"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-4xl leading-none text-ink sm:text-5xl",
						children: "Bindery"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-md text-sm leading-relaxed text-muted",
						children: "Merge, compress, or sign PDFs on this device. Files are never uploaded."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hidden size-12 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-accent sm:flex",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, {
						className: "size-5",
						strokeWidth: 1.6
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-5 grid grid-cols-3 gap-1 rounded-xl bg-bg-deep p-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeButton, {
						active: mode === "merge",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileStack, {
							className: "size-4",
							strokeWidth: 1.75
						}),
						label: "Merge",
						onClick: () => {
							setMode("merge");
							setResult(null);
							setError(null);
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeButton, {
						active: mode === "compress",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minimize2, {
							className: "size-4",
							strokeWidth: 1.75
						}),
						label: "Compress",
						onClick: () => {
							setMode("compress");
							setResult(null);
							setError(null);
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeButton, {
						active: mode === "sign",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, {
							className: "size-4",
							strokeWidth: 1.75
						}),
						label: "Sign",
						onClick: () => {
							setMode("sign");
							setResult(null);
							setError(null);
						}
					})
				]
			}),
			mode === "sign" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignStudio, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "mt-auto flex items-center gap-2 pt-10 text-xs text-faint",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
					className: "size-3.5",
					strokeWidth: 1.75
				}), "Processed in your browser. Nothing is stored on a server."]
			})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-line bg-surface shadow-sheet",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onDragOver: (event) => {
								event.preventDefault();
								setDragOver(true);
							},
							onDragLeave: () => setDragOver(false),
							onDrop,
							onClick: () => inputRef.current?.click(),
							className: cn("flex w-full flex-col items-center justify-center gap-2 rounded-t-xl border-b border-line px-4 py-10 text-center transition-colors duration-200", dragOver ? "bg-bg-deep" : "bg-surface-2"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex size-11 items-center justify-center rounded-md bg-bg-deep text-accent",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
										className: "size-5",
										strokeWidth: 1.75
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium text-ink",
									children: "Drop PDFs here, or tap to choose"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted",
									children: mode === "merge" ? "Two or more files, in the order you want them." : "One file, or several to merge then compress. Up to about 500 MB on a desktop browser."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									ref: inputRef,
									type: "file",
									accept: "application/pdf,.pdf",
									multiple: true,
									className: "hidden",
									onChange: (event) => {
										if (event.target.files) addFiles(event.target.files);
										event.target.value = "";
									}
								})
							]
						}),
						items.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "divide-y divide-line",
							children: items.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-3 px-4 py-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "w-6 font-mono text-xs text-faint tabular-nums",
										children: index + 1
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "truncate text-sm font-medium text-ink",
											children: item.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "font-mono text-xs text-muted tabular-nums",
											children: [
												formatBytes(item.size),
												item.pages != null ? ` · ${item.pages} page${item.pages === 1 ? "" : "s"}` : "",
												item.error ? ` · ${item.error}` : ""
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
												label: "Move up",
												disabled: index === 0 || busy,
												onClick: () => moveItem(item.id, -1),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { className: "size-4" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
												label: "Move down",
												disabled: index === items.length - 1 || busy,
												onClick: () => moveItem(item.id, 1),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, { className: "size-4" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
												label: "Remove",
												disabled: busy,
												onClick: () => removeItem(item.id),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
											})
										]
									})
								]
							}, item.id))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-4 py-5 text-center text-sm text-muted",
							children: "No files yet."
						}),
						items.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-xs text-muted",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono tabular-nums",
								children: [
									items.length,
									" file",
									items.length === 1 ? "" : "s",
									" · ",
									formatBytes(totalSize),
									totalPages > 0 ? ` · ${totalPages} pages` : ""
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "text-ink-soft underline-offset-2 hover:underline",
								disabled: busy,
								onClick: () => {
									setItems([]);
									setResult(null);
									setError(null);
								},
								children: "Clear all"
							})]
						}) : null
					]
				}),
				totalSize >= 83886080 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 rounded-md border border-line bg-surface px-3 py-2 text-xs leading-relaxed text-ink-soft",
					children: "Large file detected. Bindery reads it in chunks and works one page at a time so ~500 MB PDFs can finish on a desktop tab. Keep this tab open — phones may still run out of memory."
				}) : null,
				mode === "compress" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "mt-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
							className: "mb-2 text-xs font-medium tracking-wide text-muted uppercase",
							children: "Quality"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid gap-2 sm:grid-cols-3",
							children: Object.keys(COMPRESS_PRESETS).map((key) => {
								const option = COMPRESS_PRESETS[key];
								const active = preset === key;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setPreset(key),
									className: cn("rounded-lg border px-3 py-3 text-left transition-colors duration-150", active ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface text-ink hover:border-line-strong"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-sm font-medium",
										children: option.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: cn("mt-1 block text-xs leading-snug", active ? "text-accent-fg/80" : "text-muted"),
										children: option.hint
									})]
								}, key);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-xs leading-relaxed text-muted",
							children: "Compression rebuilds pages as high-resolution images so huge photo scans drop in size without a visible quality jump. Text stays readable; it will no longer be selectable."
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-xs leading-relaxed text-muted",
					children: "Pages keep their original quality. Use Compress afterwards if the merged file is still heavy."
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 rounded-md border border-line bg-surface px-3 py-2 text-sm text-danger",
					role: "alert",
					children: error
				}) : null,
				progress ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex items-center justify-between text-xs text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: progress.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-mono tabular-nums",
							children: [
								progress.current,
								"/",
								progress.total
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-1.5 overflow-hidden rounded-full bg-bg-deep",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full bg-accent transition-[width] duration-200",
							style: { width: `${Math.max(6, progress.current / Math.max(progress.total, 1) * 100)}%` }
						})
					})]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					disabled: !canRun,
					onClick: () => void (mode === "merge" ? runMerge() : runCompress()),
					className: "mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-40",
					children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : null, mode === "merge" ? "Merge PDFs" : items.length > 1 ? "Merge & compress" : "Compress PDF"]
				}),
				result ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-5 rounded-xl border border-line bg-surface-2 px-4 py-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium text-ink",
							children: "Ready to download"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 font-mono text-xs text-muted tabular-nums",
							children: [
								formatBytes(result.sourceSize),
								" → ",
								formatBytes(result.bytes.byteLength),
								saved > .02 ? ` · saved ${Math.round(saved * 100)}%` : ""
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-faint",
							onClick: () => setResult(null),
							"aria-label": "Dismiss result",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => downloadBlob(result.bytes, result.name),
						className: "mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-ink px-3 text-sm font-medium text-surface-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }),
							"Download ",
							result.name
						]
					})]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
					className: "mt-auto flex items-center gap-2 pt-10 text-xs text-faint",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
						className: "size-3.5",
						strokeWidth: 1.75
					}), "Processed in your browser. Nothing is stored on a server."]
				})
			] })
		]
	});
}
function ModeButton({ active, icon, label, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors duration-150", active ? "bg-surface-2 text-ink shadow-sheet" : "text-muted"),
		children: [icon, label]
	});
}
function IconBtn({ children, label, onClick, disabled }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": label,
		disabled,
		onClick,
		className: "inline-flex size-11 items-center justify-center rounded-md text-muted transition-colors duration-150 hover:bg-bg-deep hover:text-ink disabled:opacity-30",
		children
	});
}
var routes_exports = /* @__PURE__ */ __exportAll({ component: () => Home });
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BinderyApp, {});
}
//#endregion
export { ensureFont as n, adaptCompress as r, routes_exports as t };
