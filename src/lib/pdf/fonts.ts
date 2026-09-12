export type FontOption = {
  id: string;
  label: string;
  css: string;
  loadName: string;
};

export const TEXT_FONTS: FontOption[] = [
  {
    id: "siemreap",
    label: "Khmer OS Siemreap",
    css: '"Siemreap", "Khmer OS Siemreap", serif',
    loadName: "Siemreap",
  },
  {
    id: "moul-light",
    label: "Khmer OS Moul Light",
    css: '"Moulpali", "Moul", "Khmer OS Muol Light", serif',
    loadName: "Moulpali",
  },
  {
    id: "battambang",
    label: "Khmer OS Battambang",
    css: '"Battambang", "Khmer OS Battambang", serif',
    loadName: "Battambang",
  },
  {
    id: "lettering",
    label: "Lettering (Tangerine)",
    css: '"Tangerine", "Great Vibes", cursive',
    loadName: "Tangerine",
  },
];

export const DEFAULT_FONT = TEXT_FONTS[2];
export const DEFAULT_TEXT_COLOR = "#1a1814";

export type TextRun = {
  text: string;
  color: string;
};

export function fontById(id: string) {
  return TEXT_FONTS.find((item) => item.id === id) ?? DEFAULT_FONT;
}

export function runsToPlain(runs: TextRun[]) {
  return runs.map((run) => run.text).join("");
}

export function plainToRuns(text: string, color = DEFAULT_TEXT_COLOR): TextRun[] {
  return [{ text, color }];
}

export function colorRuns(runs: TextRun[], start: number, end: number, color: string): TextRun[] {
  const plain = runsToPlain(runs);
  const from = Math.max(0, Math.min(start, end));
  const to = Math.min(plain.length, Math.max(start, end));
  if (from === to) {
    return runs.map((run) => ({ ...run, color }));
  }
  const before = plain.slice(0, from);
  const mid = plain.slice(from, to);
  const after = plain.slice(to);
  const next: TextRun[] = [];
  if (before) next.push({ text: before, color: colorAt(runs, 0) });
  if (mid) next.push({ text: mid, color });
  if (after) next.push({ text: after, color: colorAt(runs, to) });
  return mergeRuns(next);
}

function colorAt(runs: TextRun[], index: number) {
  let cursor = 0;
  for (const run of runs) {
    const next = cursor + run.text.length;
    if (index < next || index === next) return run.color;
    cursor = next;
  }
  return runs[runs.length - 1]?.color ?? DEFAULT_TEXT_COLOR;
}

function mergeRuns(runs: TextRun[]) {
  const out: TextRun[] = [];
  for (const run of runs) {
    if (!run.text) continue;
    const last = out[out.length - 1];
    if (last && last.color === run.color) last.text += run.text;
    else out.push({ ...run });
  }
  return out.length ? out : [{ text: "", color: DEFAULT_TEXT_COLOR }];
}

export function editPlainText(runs: TextRun[], nextText: string): TextRun[] {
  const prev = runsToPlain(runs);
  if (nextText === prev) return runs;
  let prefix = 0;
  while (prefix < prev.length && prefix < nextText.length && prev[prefix] === nextText[prefix]) {
    prefix += 1;
  }
  let suffix = 0;
  while (
    suffix < prev.length - prefix &&
    suffix < nextText.length - prefix &&
    prev[prev.length - 1 - suffix] === nextText[nextText.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  const inserted = nextText.slice(prefix, nextText.length - suffix);
  const head = sliceRuns(runs, 0, prefix);
  const tail = sliceRuns(runs, prev.length - suffix, prev.length);
  const color = head[head.length - 1]?.color ?? tail[0]?.color ?? DEFAULT_TEXT_COLOR;
  return mergeRuns([...head, ...(inserted ? [{ text: inserted, color }] : []), ...tail]);
}

function sliceRuns(runs: TextRun[], start: number, end: number): TextRun[] {
  const out: TextRun[] = [];
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
    if (text) out.push({ text, color: run.color });
    cursor = next;
  }
  return out;
}

export async function ensureFont(id: string) {
  const font = fontById(id);
  if (typeof document === "undefined" || !document.fonts) return font;
  try {
    await document.fonts.load(`24px "${font.loadName}"`);
    await document.fonts.ready;
  } catch {
    /* fallback stack still works */
  }
  return font;
}
