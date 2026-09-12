import { LoaderCircle } from "lucide-react";

export function LoadingPanel({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-line bg-surface-2 px-6 py-16 text-center shadow-sheet">
      <LoaderCircle className="size-8 animate-spin text-accent" />
      <p className="text-sm font-medium text-ink">{title}</p>
      {detail ? <p className="max-w-xs text-xs leading-relaxed text-muted">{detail}</p> : null}
    </div>
  );
}
