import { useEffect, useRef, useState } from "react";
import { Eraser } from "lucide-react";
import { cn } from "@/lib/utils";
import { INK_COLORS } from "@/lib/pdf/ink";

function trimTransparentCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = source.getContext("2d");
  if (!ctx) return source;
  const { width, height } = source;
  const pixels = ctx.getImageData(0, 0, width, height).data;
  let top = height;
  let left = width;
  let right = 0;
  let bottom = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = pixels[(y * width + x) * 4 + 3];
      if (alpha > 12) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < left || bottom < top) return source;
  const pad = 6;
  const sx = Math.max(0, left - pad);
  const sy = Math.max(0, top - pad);
  const sw = Math.min(width - sx, right - left + 1 + pad * 2);
  const sh = Math.min(height - sy, bottom - top + 1 + pad * 2);
  const out = document.createElement("canvas");
  out.width = sw;
  out.height = sh;
  const outCtx = out.getContext("2d");
  if (!outCtx) return source;
  outCtx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
  return out;
}

function applyStroke(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, color: string) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2.2, canvas.width / 180);
}

type Point = { x: number; y: number };

export function SignaturePad({
  onSave,
}: {
  onSave: (dataUrl: string, aspect: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<Point | null>(null);
  const [dirty, setDirty] = useState(false);
  const [ink, setInk] = useState<string>(INK_COLORS[0]);
  const inkRef = useRef(ink);
  inkRef.current = ink;

  useEffect(() => {
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
      applyStroke(ctx, canvas, inkRef.current);
      if (prev) ctx.drawImage(next, 0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function pos(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function strokeTo(point: Point) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !last.current) return;
    applyStroke(ctx, canvas, inkRef.current);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    last.current = point;
  }

  function recolorPad(color: string) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !dirty) {
      setInk(color);
      return;
    }
    ctx.save();
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    applyStroke(ctx, canvas, color);
    setInk(color);
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

  return (
    <div className="rounded-lg border border-line bg-surface-2 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">Draw signature</p>
        <button
          type="button"
          onClick={clearPad}
          className="inline-flex min-h-11 items-center gap-1.5 px-1 text-xs text-muted"
        >
          <Eraser className="size-3.5" />
          Clear
        </button>
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {INK_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Ink ${color}`}
            onClick={() => recolorPad(color)}
            className={cn(
              "size-8 rounded-full border border-line",
              ink === color ? "ring-2 ring-accent" : "",
            )}
            style={{ background: color }}
          />
        ))}
        <input
          type="color"
          value={ink}
          aria-label="Custom signature color"
          onChange={(event) => recolorPad(event.target.value)}
          className="h-8 w-10 cursor-pointer rounded-md border border-line bg-surface-2"
        />
      </div>
      <canvas
        ref={canvasRef}
        className={cn(
          "sign-pad h-36 w-full touch-none rounded-md border border-line bg-white",
          "select-none outline-none",
        )}
        style={{ WebkitUserSelect: "none", userSelect: "none", touchAction: "none" }}
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          const ctx = event.currentTarget.getContext("2d");
          if (ctx) applyStroke(ctx, event.currentTarget, inkRef.current);
          drawing.current = true;
          last.current = pos(event);
          setDirty(true);
        }}
        onPointerMove={(event) => {
          if (!drawing.current) return;
          event.preventDefault();
          strokeTo(pos(event));
        }}
        onPointerUp={(event) => {
          drawing.current = false;
          last.current = null;
          try {
            event.currentTarget.releasePointerCapture(event.pointerId);
          } catch {
            /* already released */
          }
        }}
        onPointerCancel={() => {
          drawing.current = false;
          last.current = null;
        }}
      />
      <button
        type="button"
        disabled={!dirty}
        onClick={savePad}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-ink text-sm font-medium text-surface-2 disabled:opacity-35"
      >
        Save signature
      </button>
    </div>
  );
}
