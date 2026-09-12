import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  FileStack,
  Layers,
  LoaderCircle,
  Lock,
  Minimize2,
  PenLine,
  Plus,
  Trash2,
} from "lucide-react";
import { SignStudio } from "@/components/sign-studio";
import { cn, downloadBlob, formatBytes } from "@/lib/utils";
import {
  COMPRESS_PRESETS,
  LARGE_FILE_BYTES,
  type CompressPreset,
  type PdfFileItem,
} from "@/lib/pdf/types";

type Mode = "merge" | "compress" | "sign";

function newId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function BinderyApp() {
  const [mode, setMode] = useState<Mode>("merge");
  const [items, setItems] = useState<PdfFileItem[]>([]);
  const [preset, setPreset] = useState<CompressPreset>("high");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; label: string } | null>(
    null,
  );
  const [result, setResult] = useState<{
    bytes: Uint8Array;
    name: string;
    sourceSize: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const warm = () => {
      void import("@/lib/pdf/pdfjs-host").then((mod) => {
        mod.ensurePdfjsWorker();
      });
      if (document.fonts) {
        void document.fonts.load('24px "Battambang"');
        void document.fonts.load('24px "Siemreap"');
        void document.fonts.load('24px "Moulpali"');
        void document.fonts.load('24px "Tangerine"');
      }
    };
    const idle = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (idle.requestIdleCallback) {
      const id = idle.requestIdleCallback(warm, { timeout: 1500 });
      return () => idle.cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(warm, 200);
    return () => window.clearTimeout(timer);
  }, []);

  const totalSize = useMemo(() => items.reduce((sum, item) => sum + item.size, 0), [items]);
  const totalPages = useMemo(
    () => items.reduce((sum, item) => sum + (item.pages ?? 0), 0),
    [items],
  );

  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList).filter(isPdfFile);
    if (incoming.length === 0) {
      setError("Drop PDF files only.");
      return;
    }
    setError(null);
    setResult(null);

    const next: PdfFileItem[] = incoming.map((file) => ({
      id: newId(),
      file,
      name: file.name,
      size: file.size,
      pages: null,
    }));
    setItems((prev) => [...prev, ...next]);

    const { countPdfPages } = await import("@/lib/pdf/merge");
    await Promise.all(
      next.map(async (item) => {
        try {
          const pages = await countPdfPages(item.file);
          setItems((prev) =>
            prev.map((row) => (row.id === item.id ? { ...row, pages } : row)),
          );
        } catch {
          setItems((prev) =>
            prev.map((row) =>
              row.id === item.id ? { ...row, error: "Could not read this PDF." } : row,
            ),
          );
        }
      }),
    );
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragOver(false);
      if (event.dataTransfer.files.length) void addFiles(event.dataTransfer.files);
    },
    [addFiles],
  );

  function moveItem(id: string, dir: -1 | 1) {
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

  function removeItem(id: string) {
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
      const { mergePdfs } = await import("@/lib/pdf/merge");
      const bytes = await mergePdfs(
        items.map((item) => item.file),
        (current, total, label) => setProgress({ current, total, label }),
      );
      setResult({
        bytes,
        name: "merged.pdf",
        sourceSize: totalSize,
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
      const { compressPdf } = await import("@/lib/pdf/compress");
      if (items.length === 1) {
        const item = items[0];
        const bytes = await compressPdf(item.file, preset, (current, total, label) =>
          setProgress({ current, total, label }),
        );
        const base = item.name.replace(/\.pdf$/i, "");
        setResult({
          bytes,
          name: `${base}-compressed.pdf`,
          sourceSize: item.size,
        });
        return;
      }
      const { mergePdfs } = await import("@/lib/pdf/merge");
      setProgress({ current: 0, total: 1, label: "Merging first, then compressing" });
      const merged = await mergePdfs(items.map((item) => item.file), (current, total, label) =>
        setProgress({ current, total, label: `Merge · ${label}` }),
      );
      const mergedCopy = new Uint8Array(merged.byteLength);
      mergedCopy.set(merged);
      const mergedFile = new File([mergedCopy], "merged.pdf", {
        type: "application/pdf",
      });
      const bytes = await compressPdf(mergedFile, preset, (current, total, label) =>
        setProgress({ current, total, label }),
      );
      setResult({
        bytes,
        name: "merged-compressed.pdf",
        sourceSize: totalSize,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compression failed.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  const canRun = mode === "merge" ? items.length >= 2 && !busy : items.length >= 1 && !busy;
  const saved =
    result && result.sourceSize > result.bytes.byteLength
      ? 1 - result.bytes.byteLength / result.sourceSize
      : 0;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-xs tracking-[0.18em] text-faint uppercase">
            Local PDF studio
          </p>
          <h1 className="font-display text-4xl leading-none text-ink sm:text-5xl">Bindery</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            Merge, compress, or sign PDFs on this device. Files are never uploaded.
          </p>
        </div>
        <div className="hidden size-12 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-accent sm:flex">
          <Layers className="size-5" strokeWidth={1.6} />
        </div>
      </header>

      <div className="mb-5 grid grid-cols-3 gap-1 rounded-xl bg-bg-deep p-1">
        <ModeButton
          active={mode === "merge"}
          icon={<FileStack className="size-4" strokeWidth={1.75} />}
          label="Merge"
          onClick={() => {
            setMode("merge");
            setResult(null);
            setError(null);
          }}
        />
        <ModeButton
          active={mode === "compress"}
          icon={<Minimize2 className="size-4" strokeWidth={1.75} />}
          label="Compress"
          onClick={() => {
            setMode("compress");
            setResult(null);
            setError(null);
          }}
        />
        <ModeButton
          active={mode === "sign"}
          icon={<PenLine className="size-4" strokeWidth={1.75} />}
          label="Sign"
          onClick={() => {
            setMode("sign");
            setResult(null);
            setError(null);
          }}
        />
      </div>

      {mode === "sign" ? (
        <>
          <SignStudio />
          <footer className="mt-auto flex items-center gap-2 pt-10 text-xs text-faint">
            <Lock className="size-3.5" strokeWidth={1.75} />
            Processed in your browser. Nothing is stored on a server.
          </footer>
        </>
      ) : (
        <>
      <section className="rounded-xl border border-line bg-surface shadow-sheet">
        <button
          type="button"
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-t-xl border-b border-line px-4 py-10 text-center transition-colors duration-200",
            dragOver ? "bg-bg-deep" : "bg-surface-2",
          )}
        >
          <span className="flex size-11 items-center justify-center rounded-md bg-bg-deep text-accent">
            <Plus className="size-5" strokeWidth={1.75} />
          </span>
          <p className="text-sm font-medium text-ink">Drop PDFs here, or tap to choose</p>
          <p className="text-xs text-muted">
            {mode === "merge" ? "Two or more files, in the order you want them." : "One file, or several to merge then compress. Up to about 500 MB on a desktop browser."}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="hidden"
            onChange={(event) => {
              if (event.target.files) void addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </button>

        {items.length > 0 ? (
          <ul className="divide-y divide-line">
            {items.map((item, index) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-6 font-mono text-xs text-faint tabular-nums">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                  <p className="font-mono text-xs text-muted tabular-nums">
                    {formatBytes(item.size)}
                    {item.pages != null ? ` · ${item.pages} page${item.pages === 1 ? "" : "s"}` : ""}
                    {item.error ? ` · ${item.error}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <IconBtn label="Move up" disabled={index === 0 || busy} onClick={() => moveItem(item.id, -1)}>
                    <ArrowUp className="size-4" />
                  </IconBtn>
                  <IconBtn
                    label="Move down"
                    disabled={index === items.length - 1 || busy}
                    onClick={() => moveItem(item.id, 1)}
                  >
                    <ArrowDown className="size-4" />
                  </IconBtn>
                  <IconBtn label="Remove" disabled={busy} onClick={() => removeItem(item.id)}>
                    <Trash2 className="size-4" />
                  </IconBtn>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-5 text-center text-sm text-muted">No files yet.</p>
        )}

        {items.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-xs text-muted">
            <span className="font-mono tabular-nums">
              {items.length} file{items.length === 1 ? "" : "s"} · {formatBytes(totalSize)}
              {totalPages > 0 ? ` · ${totalPages} pages` : ""}
            </span>
            <button
              type="button"
              className="text-ink-soft underline-offset-2 hover:underline"
              disabled={busy}
              onClick={() => {
                setItems([]);
                setResult(null);
                setError(null);
              }}
            >
              Clear all
            </button>
          </div>
        ) : null}
      </section>

      {totalSize >= LARGE_FILE_BYTES ? (
        <p className="mt-4 rounded-md border border-line bg-surface px-3 py-2 text-xs leading-relaxed text-ink-soft">
          Large file detected. Bindery reads it in chunks and works one page at a time so ~500 MB
          PDFs can finish on a desktop tab. Keep this tab open — phones may still run out of memory.
        </p>
      ) : null}

      {mode === "compress" ? (
        <fieldset className="mt-5">
          <legend className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
            Quality
          </legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(COMPRESS_PRESETS) as CompressPreset[]).map((key) => {
              const option = COMPRESS_PRESETS[key];
              const active = preset === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPreset(key)}
                  className={cn(
                    "rounded-lg border px-3 py-3 text-left transition-colors duration-150",
                    active
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-line bg-surface text-ink hover:border-line-strong",
                  )}
                >
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className={cn("mt-1 block text-xs leading-snug", active ? "text-accent-fg/80" : "text-muted")}>
                    {option.hint}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Compression rebuilds pages as high-resolution images so huge photo scans drop in size
            without a visible quality jump. Text stays readable; it will no longer be selectable.
          </p>
        </fieldset>
      ) : (
        <p className="mt-4 text-xs leading-relaxed text-muted">
          Pages keep their original quality. Use Compress afterwards if the merged file is still
          heavy.
        </p>
      )}

      {error ? (
        <p className="mt-4 rounded-md border border-line bg-surface px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {progress ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span>{progress.label}</span>
            <span className="font-mono tabular-nums">
              {progress.current}/{progress.total}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-bg-deep">
            <div
              className="h-full bg-accent transition-[width] duration-200"
              style={{
                width: `${Math.max(6, (progress.current / Math.max(progress.total, 1)) * 100)}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        disabled={!canRun}
        onClick={() => void (mode === "merge" ? runMerge() : runCompress())}
        className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {mode === "merge" ? "Merge PDFs" : items.length > 1 ? "Merge & compress" : "Compress PDF"}
      </button>

      {result ? (
        <section className="mt-5 rounded-xl border border-line bg-surface-2 px-4 py-4">
          <p className="text-sm font-medium text-ink">Ready to download</p>
          <p className="mt-1 font-mono text-xs text-muted tabular-nums">
            {formatBytes(result.sourceSize)} → {formatBytes(result.bytes.byteLength)}
            {saved > 0.02 ? ` · saved ${Math.round(saved * 100)}%` : ""}
          </p>
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
            className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-md border border-line bg-surface text-sm font-medium text-ink"
          >
            Discard
          </button>
        </section>
      ) : null}

      <footer className="mt-auto flex items-center gap-2 pt-10 text-xs text-faint">
        <Lock className="size-3.5" strokeWidth={1.75} />
        Processed in your browser. Nothing is stored on a server.
      </footer>
        </>
      )}
    </div>
  );
}

function ModeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors duration-150",
        active ? "bg-surface-2 text-ink shadow-sheet" : "text-muted",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-11 items-center justify-center rounded-md text-muted transition-colors duration-150 hover:bg-bg-deep hover:text-ink disabled:opacity-30"
    >
      {children}
    </button>
  );
}
