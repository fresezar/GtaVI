const round4 = (n: number) => Math.round(n * 10000) / 10000;

/** "0.4512, 0.3381": the `coord` format the importer reads. Frame coords may leave 0..1 on calibrated maps: never clamp. */
export function formatCoord(c: readonly [number, number]): string {
  return `${round4(c[0]).toFixed(4)}, ${round4(c[1]).toFixed(4)}`;
}

/** Same columns, same order as content/import-template.csv (the importer also accepts any order). */
export const CSV_COLUMNS = [
  "category",
  "title",
  "title_tr",
  "description",
  "description_tr",
  "coord",
  "source_url",
  "timestamp",
  "finder",
  "finder_url",
  "spoiler",
  "status",
  "confidence",
  "region",
  "id",
  "notes",
] as const;
export type CsvColumn = (typeof CSV_COLUMNS)[number];

const cell = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** RFC 4180-style CSV/TSV reader (quotes, doubled quotes, CRLF, BOM). Returns rows keyed by lowercased header. */
export function parseCsv(text: string): Record<string, string>[] {
  const src = text.replace(/^﻿/, "");
  const delim = (src.split(/\r?\n/, 1)[0] ?? "").includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') (cur += '"'), i++;
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) row.push(cur), (cur = "");
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cur), rows.push(row), (row = []), (cur = "");
    } else cur += ch;
  }
  if (cur || row.length) row.push(cur), rows.push(row);
  const [head, ...body] = rows.filter((r) => r.some((c) => c.trim()));
  if (!head) return [];
  const keys = head.map((h) => h.trim().toLowerCase());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

/** "0.4512, 0.3381" -> tuple, or null. */
export function parseCoord(s: string): [number, number] | null {
  const m = s.match(/^\s*(-?\d*\.?\d+)\s*[,;\s]\s*(-?\d*\.?\d+)\s*$/);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

export function toCsv(rows: readonly Partial<Record<CsvColumn, string>>[]): string {
  return [CSV_COLUMNS.join(","), ...rows.map((r) => CSV_COLUMNS.map((c) => cell(r[c] ?? "")).join(","))].join("\r\n") + "\r\n";
}
