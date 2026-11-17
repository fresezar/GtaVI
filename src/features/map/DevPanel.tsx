"use client";

import type { Category, PinSource } from "@/domain";
import { t } from "@/i18n";
import { categoryKey } from "@/i18n/keys";
import { CATEGORY_COLORS } from "./tokens";
import type { DevTool } from "./dev/useDevTool";

const SOURCES: PinSource[] = ["stream", "community", "self", "datamine", "official"];

export default function DevPanel({ dev, categories }: { dev: DevTool; categories: readonly Category[] }) {
  const { settings, setSettings, title, setTitle, captures, last, toast } = dev;
  return (
    <section className="card border-dashed" aria-label="Developer capture tool">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg">Dev capture</h2>
        <span className="text-xs text-muted">{captures.length} captured</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        Click the map: pin JSON is copied. Keys: <kbd>1-9</kbd> category · <kbd>C</kbd> copy last · <kbd>Z</kbd> undo
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Capture category">
        {categories.map((c, i) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={settings.categoryId === c.id}
            onClick={() => setSettings((s) => ({ ...s, categoryId: c.id }))}
            className={`chip chip-btn ${settings.categoryId === c.id ? "chip-on" : ""}`}
            style={{ ["--dot" as string]: CATEGORY_COLORS[c.colorToken] }}
          >
            <span className="text-muted">{i + 1}</span> {t(categoryKey(c.id))}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="field">
          <span>Source</span>
          <select value={settings.source} onChange={(e) => setSettings((s) => ({ ...s, source: e.target.value as PinSource }))}>
            {SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Credit (streamer)</span>
          <input value={settings.credit} placeholder="@name" onChange={(e) => setSettings((s) => ({ ...s, credit: e.target.value }))} />
        </label>
      </div>
      <label className="field mt-2">
        <span>Title for next pin (optional)</span>
        <input value={title} placeholder="leave empty when in a hurry" onChange={(e) => setTitle(e.target.value)} />
      </label>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={settings.autoCopy} onChange={(e) => setSettings((s) => ({ ...s, autoCopy: e.target.checked }))} />
        Copy JSON automatically on click
      </label>

      {last && (
        <div className="mt-3">
          <p className="text-xs text-muted">
            Last: [{last.coord[0].toFixed(4)}, {last.coord[1].toFixed(4)}] · px ≈ {Math.round(last.coord[0] * 4096)},{" "}
            {Math.round(last.coord[1] * 3072)}
          </p>
          <pre className="mt-1 max-h-32 overflow-auto rounded-lg border-2 border-line bg-bg p-2 text-[11px] leading-tight">{last.json}</pre>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn" disabled={!last} onClick={dev.copyLast}>Copy last</button>
        <button type="button" className="btn" disabled={!last} onClick={dev.copyLastI18n}>Copy i18n</button>
        <button type="button" className="btn" disabled={!captures.length} onClick={dev.copyAll}>Copy all JSON</button>
        <button type="button" className="btn" disabled={!captures.length} onClick={dev.copyAllI18n}>Copy all i18n</button>
        <button type="button" className="btn" disabled={!captures.length} onClick={dev.undo}>Undo</button>
        <button type="button" className="btn" disabled={!captures.length} onClick={dev.clear}>Clear</button>
      </div>
      <p className="mt-2 h-4 text-xs font-bold text-accent2" role="status" aria-live="polite">{toast}</p>
    </section>
  );
}
