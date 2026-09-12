import { useCallback, useEffect, useRef, useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, ChevronLeft, ChevronRight, Download, GripVertical, LoaderCircle, MoveDiagonal2, Plus, Trash2, Type, Upload, X } from "lucide-react";
import { LoadingPanel } from "@/components/loading-panel";
import { SignaturePad } from "@/components/signature-pad";
import { cn, downloadBlob, formatBytes } from "@/lib/utils";
import { INK_COLORS, tintInkImage } from "@/lib/pdf/ink";
import { LARGE_FILE_BYTES } from "@/lib/pdf/types";
import { DEFAULT_FONT, DEFAULT_TEXT_COLOR, TEXT_FONTS, colorRuns, editPlainText, fontById, runsToPlain } from "@/lib/pdf/fonts";
import type { PagePreview, PreviewSession, Stamp, TextStamp } from "@/lib/pdf/sign";

type SavedMark = {
  id: string;
  dataUrl: string;
  aspect: number;
};

function newId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const MARKS_KEY = "bindery.signatures.v1";

function loadSavedMarks(): SavedMark[] {
  try {
    const raw = localStorage.getItem(MARKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedMark[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.dataUrl === "string" && item.dataUrl.startsWith("data:image/"))
      .slice(0, 12);
  } catch {
    return [];
  }
}

export function SignStudio({
  initialFile,
  onConsumed,
}: {
  initialFile?: File | null;
  onConsumed?: () => void;
} = {}) {
  const [file, setFile] = useState<File | null>(null);
  const [page, setPage] = useState<PagePreview | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [marks, setMarks] = useState<SavedMark[]>(() => loadSavedMarks());
  const [activeMark, setActiveMark] = useState<string | null>(null);
  const [placeMode, setPlaceMode] = useState<"image" | "text" | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ bytes: Uint8Array; name: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const drag = useRef<{ kind: "move" | "resize"; id: string; dx: number; dy: number; aspect: number } | null>(null);
  const usedStamp = useRef(false);
  const pdfInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<PreviewSession | null>(null);
  const onConsumedRef = useRef(onConsumed);
  onConsumedRef.current = onConsumed;

  const showPage = useCallback(async (index: number) => {
    const session = sessionRef.current;
    if (!session) return;
    setLoadingPage(true);
    try {
      const preview = await session.renderPage(index);
      setPage(preview);
      setPageIndex(index);
    } finally {
      setLoadingPage(false);
    }
  }, []);

  const loadPdf = useCallback(async (next: File) => {
    setLoadingDoc(true);
    setError(null);
    setResult(null);
    setStamps([]);
    setSelected(null);
    setPage(null);
    await sessionRef.current?.close();
    sessionRef.current = null;
    try {
      const { openPreviewSession } = await import("@/lib/pdf/sign");
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

  useEffect(() => {
    return () => {
      void sessionRef.current?.close();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(MARKS_KEY, JSON.stringify(marks.slice(0, 12)));
    } catch {
      /* quota or private mode */
    }
  }, [marks]);

  useEffect(() => {
    if (!initialFile) return;
    void loadPdf(initialFile).finally(() => onConsumedRef.current?.());
  }, [initialFile, loadPdf]);

  async function onPdfFiles(list: FileList | File[]) {
    const pdf = Array.from(list).find(
      (item) => item.type === "application/pdf" || item.name.toLowerCase().endsWith(".pdf"),
    );
    if (!pdf) {
      setError("Attach one PDF file.");
      return;
    }
    await loadPdf(pdf);
  }

  function addMark(dataUrl: string, aspect: number) {
    const mark = { id: newId(), dataUrl, aspect };
    setMarks((prev) => [mark, ...prev]);
    setActiveMark(mark.id);
    setPlaceMode("image");
  }

  async function onImageFiles(list: FileList | File[]) {
    const image = Array.from(list).find((item) => item.type.startsWith("image/"));
    if (!image) {
      setError("Use a PNG or JPG image.");
      return;
    }
    const dataUrl = await fileToDataUrl(image);
    const aspect = await imageAspect(dataUrl);
    addMark(dataUrl, aspect);
  }

  function placeOnPage(pageIndex: number, nx: number, ny: number) {
    if (placeMode === "text") {
      const stamp: Stamp = {
        id: newId(),
        type: "text",
        pageIndex,
        x: Math.min(0.7, Math.max(0, nx - 0.12)),
        y: Math.min(0.93, Math.max(0, ny - 0.02)),
        w: 0.28,
        h: 0.036,
        fontId: DEFAULT_FONT.id,
        fontSize: 0.022,
        align: "left",
        runs: [{ text: "អត្ថបទ", color: DEFAULT_TEXT_COLOR }],
      };
      setStamps((prev) => [...prev, stamp]);
      setSelected(stamp.id);
      setPlaceMode(null);
      return;
    }
    const mark = marks.find((item) => item.id === activeMark);
    if (!mark) return;
    const w = 0.28;
    const h = Math.min(0.22, w / Math.max(0.25, mark.aspect));
    const stamp: Stamp = {
      id: newId(),
      type: "image",
      pageIndex,
      x: Math.min(1 - w, Math.max(0, nx - w / 2)),
      y: Math.min(1 - h, Math.max(0, ny - h / 2)),
      w,
      h,
      dataUrl: mark.dataUrl,
    };
    setStamps((prev) => [...prev, stamp]);
    setSelected(stamp.id);
  }

  function pageCoords(event: React.PointerEvent | React.MouseEvent, el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    return {
      nx: (event.clientX - rect.left) / rect.width,
      ny: (event.clientY - rect.top) / rect.height,
    };
  }

  function startMove(event: React.PointerEvent, stamp: Stamp) {
    event.preventDefault();
    event.stopPropagation();
    const page = event.currentTarget.closest("[data-page]") as HTMLElement | null;
    if (!page) return;
    const { nx, ny } = pageCoords(event, page);
    drag.current = { kind: "move", id: stamp.id, dx: nx - stamp.x, dy: ny - stamp.y, aspect: stamp.w / Math.max(0.01, stamp.h) };
    usedStamp.current = true;
    setSelected(stamp.id);
    bindDrag(page);
  }

  function startResize(event: React.PointerEvent, stamp: Stamp) {
    event.preventDefault();
    event.stopPropagation();
    const page = event.currentTarget.closest("[data-page]") as HTMLElement | null;
    if (!page) return;
    drag.current = {
      kind: "resize",
      id: stamp.id,
      dx: 0,
      dy: 0,
      aspect: stamp.w / Math.max(0.01, stamp.h),
    };
    usedStamp.current = true;
    setSelected(stamp.id);
    bindDrag(page);
  }

  function bindDrag(page: HTMLElement) {
    const onMove = (event: PointerEvent) => {
      if (!drag.current) return;
      event.preventDefault();
      const { nx, ny } = pageCoords(event as unknown as React.PointerEvent, page);
      const { id, dx, dy, kind, aspect } = drag.current;
      setStamps((prev) =>
        prev.map((stamp) => {
          if (stamp.id !== id) return stamp;
          if (kind === "resize") {
            const nextW = Math.min(0.95 - stamp.x, Math.max(0.08, nx - stamp.x));
            const nextH =
              stamp.type === "image"
                ? Math.min(0.85 - stamp.y, Math.max(0.04, nextW / Math.max(0.2, aspect)))
                : Math.min(0.5 - stamp.y, Math.max(0.024, ny - stamp.y));
            if (stamp.type === "text") {
              return { ...stamp, w: nextW, h: nextH };
            }
            return { ...stamp, w: nextW, h: nextH };
          }
          return {
            ...stamp,
            x: Math.min(1 - stamp.w, Math.max(0, nx - dx)),
            y: Math.min(1 - stamp.h, Math.max(0, ny - dy)),
          };
        }),
      );
    };
    const onUp = () => {
      drag.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function updateStamp(id: string, patch: Partial<TextStamp>) {
    setStamps((prev) =>
      prev.map((stamp) => (stamp.id === id && stamp.type === "text" ? { ...stamp, ...patch } : stamp)),
    );
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
      const { applyStamps } = await import("@/lib/pdf/sign");
      const bytes = await applyStamps(file, stamps);
      const base = file.name.replace(/\.pdf$/i, "");
      setResult({ bytes, name: `${base}-signed.pdf` });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not export the signed PDF.");
    } finally {
      setBusy(false);
    }
  }

  const selectedStamp = stamps.find((stamp) => stamp.id === selected) ?? null;

  return (
    <div className={cn("flex flex-col gap-5", selectedStamp ? "pb-48" : "")}>
      <input
        ref={pdfInput}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(event) => {
          if (event.target.files) void onPdfFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <input
        ref={imageInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={(event) => {
          if (event.target.files) void onImageFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {!file ? (
        <button
          type="button"
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            if (event.dataTransfer.files.length) void onPdfFiles(event.dataTransfer.files);
          }}
          onClick={() => pdfInput.current?.click()}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-line px-4 py-12 text-center shadow-sheet",
            dragOver ? "bg-bg-deep" : "bg-surface-2",
          )}
        >
          <span className="flex size-11 items-center justify-center rounded-md bg-bg-deep text-accent">
            <Plus className="size-5" strokeWidth={1.75} />
          </span>
          <p className="text-sm font-medium text-ink">Attach one PDF</p>
          <p className="text-xs text-muted">Then draw or drop signatures and text onto the pages. Large files open one page at a time.</p>
        </button>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{file.name}</p>
            <p className="font-mono text-xs text-muted tabular-nums">
              {formatBytes(file.size)} · {pageCount} page{pageCount === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            className="text-xs text-ink-soft underline-offset-2 hover:underline"
            onClick={() => {
              void sessionRef.current?.close();
              sessionRef.current = null;
              setFile(null);
              setPage(null);
              setPageCount(0);
              setStamps([]);
              setResult(null);
            }}
          >
            Change file
          </button>
        </div>
      )}

      <div className="grid gap-3">
        <SignaturePad onSave={addMark} />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => imageInput.current?.click()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-surface text-sm font-medium text-ink"
          >
            <Upload className="size-4" />
            Image
          </button>
          <button
            type="button"
            onClick={() => setPlaceMode((mode) => (mode === "text" ? null : "text"))}
            className={cn(
              "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium",
              placeMode === "text" ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface text-ink",
            )}
          >
            <Type className="size-4" />
            Text
          </button>
        </div>
        {marks.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {marks.map((mark) => (
              <div key={mark.id} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMark(mark.id);
                    setPlaceMode("image");
                  }}
                  className={cn(
                    "flex h-16 w-28 items-center justify-center rounded-md border bg-white p-1",
                    activeMark === mark.id && placeMode === "image" ? "border-accent" : "border-line",
                  )}
                >
                  <img src={mark.dataUrl} alt="" className="max-h-full max-w-full select-none object-contain" draggable={false} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMarks((prev) => prev.filter((item) => item.id !== mark.id));
                    if (activeMark === mark.id) {
                      setActiveMark(null);
                      setPlaceMode(null);
                    }
                  }}
                  className="absolute -top-1 -right-1 z-10 inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-line bg-surface text-ink"
                  aria-label="Remove signature"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {placeMode ? (
        <p className="rounded-md border border-line bg-surface px-3 py-2 text-xs text-ink-soft">
          {placeMode === "text"
            ? "Tap a page to drop a text box. Drag it after it lands."
            : "Tap a page to stamp the selected signature. Drag to reposition."}
        </p>
      ) : null}

      {file && file.size >= LARGE_FILE_BYTES ? (
        <p className="rounded-md border border-line bg-surface px-3 py-2 text-xs leading-relaxed text-ink-soft">
          Large PDF — pages load one at a time so files around 500 MB can stay open.
        </p>
      ) : null}

      {loadingDoc ? (
        <LoadingPanel title="Opening PDF…" detail="This can take a few seconds on a large file." />
      ) : null}

      {loadingPage && page ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <LoaderCircle className="size-4 animate-spin" />
          Loading page…
        </p>
      ) : null}

      {page ? (
        <div className="flex flex-col gap-3">
          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm text-ink disabled:opacity-35"
                disabled={pageIndex <= 0}
                onClick={() => void showPage(pageIndex - 1)}
              >
                <ChevronLeft className="size-4" />
                Prev
              </button>
              <span className="font-mono text-xs text-muted tabular-nums">
                Page {pageIndex + 1} / {pageCount}
              </span>
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm text-ink disabled:opacity-35"
                disabled={pageIndex >= pageCount - 1}
                onClick={() => void showPage(pageIndex + 1)}
              >
                Next
                <ChevronRight className="size-4" />
              </button>
            </div>
          ) : null}
          {selectedStamp ? (
            <StampWidget
              stamp={selectedStamp}
              onFont={(fontId) => updateStamp(selectedStamp.id, { fontId })}
              onAlign={(align) => updateStamp(selectedStamp.id, { align })}
              onTextSize={(fontSize) => updateStamp(selectedStamp.id, { fontSize })}
              onImageSize={(width) => {
                const aspect = selectedStamp.w / Math.max(0.01, selectedStamp.h);
                setStamps((prev) =>
                  prev.map((stamp) =>
                    stamp.id === selectedStamp.id
                      ? { ...stamp, w: width, h: Math.min(0.7, Math.max(0.05, width / aspect)) }
                      : stamp,
                  ),
                );
              }}
              onColor={(color, selection) => {
                if (selectedStamp.type !== "text") return;
                if (selection) {
                  updateStamp(selectedStamp.id, {
                    runs: colorRuns(selectedStamp.runs, selection.start, selection.end, color),
                  });
                  return;
                }
                updateStamp(selectedStamp.id, {
                  runs: selectedStamp.runs.map((run) => ({ ...run, color })),
                });
              }}
              onInk={(color) => {
                if (selectedStamp.type !== "image") return;
                void tintInkImage(selectedStamp.dataUrl, color).then((dataUrl) => {
                  setStamps((prev) =>
                    prev.map((stamp) =>
                      stamp.id === selectedStamp.id && stamp.type === "image"
                        ? { ...stamp, dataUrl }
                        : stamp,
                    ),
                  );
                });
              }}
              onClose={() => setSelected(null)}
            />
          ) : null}
          <PageStage
            page={page}
            stamps={stamps.filter((stamp) => stamp.pageIndex === page.index)}
            selected={selected}
            placing={placeMode !== null}
            onPageUp={(event, el) => {
              if (usedStamp.current) {
                usedStamp.current = false;
                drag.current = null;
                return;
              }
              if (placeMode) {
                const { nx, ny } = pageCoords(event, el);
                placeOnPage(page.index, nx, ny);
              }
              drag.current = null;
            }}
            onStampDown={startMove}
            onResizeDown={startResize}
            onChangeRuns={(id, runs) => updateStamp(id, { runs })}
            onSelect={setSelected}
            onDiscard={
              selectedStamp
                ? () => {
                    setStamps((prev) => prev.filter((stamp) => stamp.id !== selectedStamp.id));
                    setSelected(null);
                  }
                : undefined
            }
          />
        </div>
      ) : null}

      {error ? (
        <p className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={!file || stamps.length === 0 || busy}
        onClick={() => void exportSigned()}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
        Export signed PDF
      </button>

      {result ? (
        <section className="rounded-xl border border-line bg-surface-2 px-4 py-4">
          <p className="text-sm font-medium text-ink">Ready to download</p>
          <p className="mt-1 font-mono text-xs text-muted">{result.name}</p>
          <button
            type="button"
            onClick={() => downloadBlob(result.bytes, result.name)}
            className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-ink px-3 text-sm font-medium text-surface-2"
          >
            <Download className="size-4" />
            Download {result.name}
          </button>
          <button
            type="button"
            onClick={() => setResult(null)}
            className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-line bg-surface text-sm font-medium text-ink"
          >
            Discard
          </button>
        </section>
      ) : null}
    </div>
  );
}

function PageStage({
  page,
  stamps,
  selected,
  placing,
  onPageUp,
  onStampDown,
  onResizeDown,
  onChangeRuns,
  onSelect,
  onDiscard,
}: {
  page: PagePreview;
  stamps: Stamp[];
  selected: string | null;
  placing: boolean;
  onPageUp: (event: React.PointerEvent<HTMLDivElement>, el: HTMLDivElement) => void;
  onStampDown: (event: React.PointerEvent, stamp: Stamp) => void;
  onResizeDown: (event: React.PointerEvent, stamp: Stamp) => void;
  onChangeRuns: (id: string, runs: TextStamp["runs"]) => void;
  onSelect: (id: string) => void;
  onDiscard?: () => void;
}) {
  return (
    <div className="rounded-xl border border-line bg-bg-deep p-2 shadow-sheet sm:p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-mono text-xs text-faint">Page {page.index + 1}</p>
      </div>
      <div
        data-page={page.index}
        className={cn(
          "relative mx-auto overflow-visible rounded-md bg-white select-none",
          placing ? "cursor-crosshair" : "cursor-default",
        )}
        style={{
          width: "100%",
          aspectRatio: `${page.widthPx} / ${page.heightPx}`,
          WebkitUserSelect: "none",
          userSelect: "none",
          touchAction: "none",
        }}
        onPointerUp={(event) => onPageUp(event, event.currentTarget)}
      >
        <img
          src={page.dataUrl}
          alt={`Page ${page.index + 1}`}
          draggable={false}
          className="pointer-events-none block h-full w-full select-none"
        />
        {stamps.map((stamp) => (
          <div
            key={stamp.id}
            data-stamp={stamp.id}
            className={cn(
              "absolute",
              selected === stamp.id ? "ring-2 ring-accent" : "ring-1 ring-transparent",
            )}
            style={{
              left: `${stamp.x * 100}%`,
              top: `${stamp.y * 100}%`,
              width: `${stamp.w * 100}%`,
              height: `${stamp.h * 100}%`,
            }}
            onPointerDown={(event) => {
              if ((event.target as HTMLElement).closest("[data-text-edit]")) return;
              onStampDown(event, stamp);
            }}
          >
            {selected === stamp.id ? (
              <>
                <button
                  type="button"
                  data-drag="1"
                  aria-label="Drag to move"
                  className="absolute z-20 inline-flex h-11 items-center gap-1 rounded-md border border-line bg-ink px-2.5 text-xs font-medium text-surface-2 shadow-sheet"
                  style={{ left: 0, bottom: "calc(100% + 8px)" }}
                  onPointerDown={(event) => onStampDown(event, stamp)}
                >
                  <GripVertical className="size-4" />
                  Move
                </button>
                {onDiscard ? (
                  <button
                    type="button"
                    aria-label="Close"
                    className="absolute z-20 inline-flex size-11 items-center justify-center rounded-md border border-line bg-surface text-ink shadow-sheet"
                    style={{ right: 0, bottom: "calc(100% + 8px)" }}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={onDiscard}
                  >
                    <X className="size-5" />
                  </button>
                ) : null}
                <button
                  type="button"
                  data-resize="1"
                  aria-label="Resize box"
                  className="absolute z-20 inline-flex h-11 items-center gap-1 rounded-md border border-line bg-surface-2 px-2.5 text-xs font-medium text-ink shadow-sheet"
                  style={{ right: 0, top: "calc(100% + 8px)" }}
                  onPointerDown={(event) => onResizeDown(event, stamp)}
                >
                  <MoveDiagonal2 className="size-4" />
                  Resize
                </button>
              </>
            ) : null}
            {stamp.type === "image" ? (
              <img src={stamp.dataUrl} alt="" draggable={false} className="h-full w-full select-none object-contain" />
            ) : (
              <TextEditor
                stamp={stamp}
                pageHeightPx={page.heightPx}
                active={selected === stamp.id}
                onSelect={() => onSelect(stamp.id)}
                onChange={(runs) => onChangeRuns(stamp.id, runs)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TextEditor({
  stamp,
  pageHeightPx,
  active,
  onSelect,
  onChange,
}: {
  stamp: TextStamp;
  pageHeightPx: number;
  active: boolean;
  onSelect: () => void;
  onChange: (runs: TextStamp["runs"]) => void;
}) {
  const font = fontById(stamp.fontId);
  const field = useRef<HTMLTextAreaElement>(null);
  const plain = runsToPlain(stamp.runs);
  const khmer = stamp.fontId !== "lettering";
  const fontPx = Math.max(8, stamp.fontSize * pageHeightPx * (khmer ? 0.78 : 1));

  return (
    <div data-text-edit="1" className="relative h-full w-full">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden px-1 leading-tight whitespace-pre-wrap"
        style={{
          fontFamily: font.css,
          fontSize: `${fontPx}px`,
          textAlign: stamp.align || "left",
        }}
      >
        {stamp.runs.map((run, index) => (
          <span key={`${index}-${run.color}`} style={{ color: run.color }}>
            {run.text}
          </span>
        ))}
      </div>
      <textarea
        ref={field}
        value={plain}
        spellCheck={false}
        onPointerDown={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        onChange={(event) => {
          onChange(editPlainText(stamp.runs, event.target.value));
        }}
        className="absolute inset-0 h-full w-full resize-none bg-transparent px-1 leading-tight text-transparent caret-ink outline-none"
        style={{
          fontFamily: font.css,
          fontSize: `${fontPx}px`,
          textAlign: stamp.align || "left",
          userSelect: active ? "text" : "none",
        }}
      />
    </div>
  );
}

function StampWidget({
  stamp,
  onFont,
  onAlign,
  onTextSize,
  onImageSize,
  onColor,
  onInk,
  onClose,
}: {
  stamp: Stamp;
  onFont: (id: string) => void;
  onAlign: (align: "left" | "center" | "right") => void;
  onTextSize: (size: number) => void;
  onImageSize: (width: number) => void;
  onColor: (color: string, selection?: { start: number; end: number }) => void;
  onInk: (color: string) => void;
  onClose: () => void;
}) {
  const colors = stamp.type === "text" ? ["#1a1814", "#8a2e24", "#1f4d3a", "#1d3a6b", "#8a4b1f"] : [...INK_COLORS];
  const current = stamp.type === "text" ? stamp.runs[stamp.runs.length - 1]?.color ?? DEFAULT_TEXT_COLOR : "#1a1814";

  function applyTextColor(color: string) {
    const field = document.querySelector<HTMLTextAreaElement>("[data-text-edit] textarea");
    if (field && field.selectionStart !== field.selectionEnd) {
      onColor(color, { start: field.selectionStart, end: field.selectionEnd });
      return;
    }
    onColor(color);
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-3">
      <div
        className="pointer-events-auto w-full max-w-lg rounded-xl border border-line bg-surface-2 p-3 shadow-sheet"
        role="dialog"
        aria-label="Edit selected item"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-ink">{stamp.type === "text" ? "Text" : "Signature"}</p>
          <button
            type="button"
            aria-label="Close tools"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        {stamp.type === "text" ? (
          <label className="grid gap-1 text-xs text-muted">
            Font
            <select
              value={stamp.fontId}
              onChange={(event) => onFont(event.target.value)}
              className="min-h-11 rounded-md border border-line bg-surface px-2 text-sm text-ink"
            >
              {TEXT_FONTS.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {stamp.type === "text" ? (
          <div className="mt-3 grid gap-1">
            <p className="text-xs text-muted">Align</p>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  ["left", AlignLeft, "Left"],
                  ["center", AlignCenter, "Center"],
                  ["right", AlignRight, "Right"],
                ] as const
              ).map(([value, Icon, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-label={label}
                  onClick={() => onAlign(value)}
                  className={cn(
                    "inline-flex min-h-11 items-center justify-center gap-1 rounded-md border text-sm",
                    stamp.align === value ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface text-ink",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-3 grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted">{stamp.type === "text" ? "Font size" : "Size"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Smaller"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-line bg-surface text-sm font-medium text-ink"
              onClick={() =>
                stamp.type === "text"
                  ? onTextSize(Math.max(0.012, stamp.fontSize - 0.006))
                  : onImageSize(Math.max(0.1, stamp.w - 0.04))
              }
            >
              A−
            </button>
            <input
              type="range"
              min={stamp.type === "text" ? 0.012 : 0.1}
              max={stamp.type === "text" ? 0.12 : 0.7}
              step={0.002}
              value={stamp.type === "text" ? stamp.fontSize : stamp.w}
              aria-label={stamp.type === "text" ? "Font size" : "Size"}
              onChange={(event) =>
                stamp.type === "text"
                  ? onTextSize(Number(event.target.value))
                  : onImageSize(Number(event.target.value))
              }
              className="min-h-11 flex-1"
            />
            <button
              type="button"
              aria-label="Larger"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-line bg-surface text-base font-medium text-ink"
              onClick={() =>
                stamp.type === "text"
                  ? onTextSize(Math.min(0.16, stamp.fontSize + 0.008))
                  : onImageSize(Math.min(0.7, stamp.w + 0.04))
              }
            >
              A+
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-1">
          <p className="text-xs text-muted">{stamp.type === "text" ? "Color — select words, then pick" : "Ink color"}</p>
          <div className="flex flex-wrap items-center gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Color ${color}`}
                onClick={() => (stamp.type === "text" ? applyTextColor(color) : onInk(color))}
                className={cn("size-8 rounded-full border border-line", current === color ? "ring-2 ring-accent" : "")}
                style={{ background: color }}
              />
            ))}
            <input
              type="color"
              value={current}
              aria-label="Custom color"
              onChange={(event) => (stamp.type === "text" ? applyTextColor(event.target.value) : onInk(event.target.value))}
              className="h-8 w-10 cursor-pointer rounded-md border border-line bg-surface"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

function imageAspect(dataUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image.naturalWidth / Math.max(1, image.naturalHeight));
    image.onerror = () => resolve(2);
    image.src = dataUrl;
  });
}
