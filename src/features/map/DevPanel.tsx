"use client";

import type { Category, PinSource } from "@/domain";
import { t } from "@/i18n";
import { categoryKey, pinKey } from "@/i18n/keys";
import { CATEGORY_COLORS } from "./tokens";
import type { CopyFormat, DevTool } from "./dev/useDevTool";

const SOURCES: PinSource[] = ["stream", "community", "self", "datamine", "official"];

function CalibrationPanel({ dev }: { dev: DevTool }) {
  const { calib, landmarks, calibResult } = dev;
  if (!calib.active) {
    return (
      <div className="mt-4 border-t-2 border-dashed border-line pt-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted">New map image?</h3>
        <p className="mt-1 text-xs text-muted">
          Swap the image in <code>src/data/maps.ts</code>, then click {landmarks.length} landmark pins where they really are on the new art.
        </p>
        <button type="button" className="btn mt-2" disabled={landmarks.length < 3} onClick={dev.startCalibration}>
          Calibrate map
        </button>
        {landmarks.length < 3 && <p className="mt-1 text-xs text-muted">Needs 3+ pins in the Landmarks category.</p>}
      </div>
    );
  }

  const target = landmarks[calib.index];
  return (
    <div className="mt-4 rounded-xl border-2 border-line bg-bg p-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-accent2">Calibrating · {calib.points.length} points</h3>
      {target ? (
        <p className="mt-1 text-sm">
          Click the real spot of: <strong>{t(pinKey(target.id, "title"))}</strong>
          <span className="text-muted"> ({calib.index + 1}/{landmarks.length})</span>
        </p>
      ) : (
        <p className="mt-1 text-sm">All landmarks done.</p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className="btn" disabled={!target} onClick={dev.skipLandmark}>Skip</button>
        <button type="button" className="btn" disabled={!calib.points.length} onClick={dev.undoLandmark}>Undo</button>
        <button type="button" className="btn btn-primary" disabled={!calibResult?.json} onClick={dev.copyCalibration}>Copy calibration</button>
        <button type="button" className="btn" onClick={dev.stopCalibration}>Exit</button>
      </div>
      {calibResult?.error && <p className="mt-2 text-xs font-bold text-accent">{calibResult.error}</p>}
      {calibResult && !calibResult.error && (
        <p className="mt-2 text-xs text-muted">
          Worst landmark off by {(calibResult.residual * 100).toFixed(2)}% of map width
          {calibResult.residual > 0.01 ? ": re-click the far-off ones (Undo) or skip a doubtful landmark." : ": good fit."}
          {" "}Paste into the map entry in <code>src/data/maps.ts</code>.
        </p>
      )}
    </div>
  );
}

export default function DevPanel({ dev, categories }: { dev: DevTool; categories: readonly Category[] }) {
  const { settings, setSettings, title, setTitle, captures, last, toast } = dev;
  return (
    <section className="card border-dashed" aria-label="Developer capture tool">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg">Dev capture</h2>
        <span className="text-xs text-muted">{captures.length} captured</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        Click the map: the coordinate is copied for the <code>coord</code> column of the table. Keys: <kbd>1-0</kbd> category ·{" "}
        <kbd>C</kbd> copy last · <kbd>Z</kbd> undo
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
            {i < 10 && <span className="text-muted">{(i + 1) % 10}</span>} {t(categoryKey(c.id))}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="field">
          <span>Copy as</span>
          <select value={settings.copyFormat} onChange={(e) => setSettings((s) => ({ ...s, copyFormat: e.target.value as CopyFormat }))}>
            <option value="coord">Coord (table)</option>
            <option value="json">Pin JSON</option>
          </select>
        </label>
        <label className="field">
          <span>Source</span>
          <select value={settings.source} onChange={(e) => setSettings((s) => ({ ...s, source: e.target.value as PinSource }))}>
            {SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      {settings.copyFormat === "json" && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="field">
            <span>Credit (streamer)</span>
            <input value={settings.credit} placeholder="@name" onChange={(e) => setSettings((s) => ({ ...s, credit: e.target.value }))} />
          </label>
          <label className="field">
            <span>Title (optional)</span>
            <input value={title} placeholder="when in a hurry: skip" onChange={(e) => setTitle(e.target.value)} />
          </label>
        </div>
      )}

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={settings.autoCopy} onChange={(e) => setSettings((s) => ({ ...s, autoCopy: e.target.checked }))} />
        Copy automatically on click
      </label>

      {last && (
        <div className="mt-3">
          <p className="text-xs text-muted">
            Last: <strong className="text-ink">{last.coordText}</strong>
          </p>
          {settings.copyFormat === "json" && (
            <pre className="mt-1 max-h-32 overflow-auto rounded-lg border-2 border-line bg-bg p-2 text-[11px] leading-tight">{last.json}</pre>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn" disabled={!last} onClick={dev.copyLast}>Copy last</button>
        <button type="button" className="btn" disabled={!captures.length} onClick={dev.copyAll}>Copy all</button>
        {settings.copyFormat === "json" && (
          <button type="button" className="btn" disabled={!last} onClick={dev.copyLastI18n}>Copy text lines</button>
        )}
        <button type="button" className="btn" disabled={!captures.length} onClick={dev.undo}>Undo</button>
        <button type="button" className="btn" disabled={!captures.length} onClick={dev.clear}>Clear</button>
      </div>
      <p className="mt-2 h-4 text-xs font-bold text-accent2" role="status" aria-live="polite">{toast}</p>

      <CalibrationPanel dev={dev} />
    </section>
  );
}
