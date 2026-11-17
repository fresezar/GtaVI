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

export function toCsv(rows: readonly Partial<Record<CsvColumn, string>>[]): string {
  return [CSV_COLUMNS.join(","), ...rows.map((r) => CSV_COLUMNS.map((c) => cell(r[c] ?? "")).join(","))].join("\r\n") + "\r\n";
}
