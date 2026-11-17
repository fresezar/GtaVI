"use client";

import type { Category } from "@/domain";
import { useT } from "@/i18n/client";
import { categoryKey, pinKey } from "@/i18n/keys";
import { CATEGORY_COLORS } from "./tokens";
import { formatCoord } from "./dev/template";
import type { DevTool, EntryFields } from "./dev/useDevTool";

/** Internal data-entry tool (/map?dev=true). Labels are Turkish: the operator is the founder. */

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`field ${wide ? "col-span-2" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function CalibrationPanel({ dev }: { dev: DevTool }) {
  const t = useT();
  const { calib, landmarks, calibResult } = dev;
  if (!calib.active) {
    return (
      <details className="mt-4 border-t border-dashed border-line-strong pt-3">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-muted">Yeni harita görseli? Kalibrasyon</summary>
        <p className="mt-2 text-xs text-muted">
          Görseli <code>src/data/maps.ts</code> içinde değiştir, sonra {landmarks.length} simge yapıyı yeni görselde gerçek yerlerine tıkla.
        </p>
        <button type="button" className="btn mt-2" disabled={landmarks.length < 3} onClick={dev.startCalibration}>
          Kalibrasyonu başlat
        </button>
        {landmarks.length < 3 && <p className="mt-1 text-xs text-muted">Simge yapılar kategorisinde en az 3 pin gerekli.</p>}
      </details>
    );
  }
  const target = landmarks[calib.index];
  return (
    <div className="mt-4 rounded-xl border border-line-strong bg-[#140c22] p-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-accent2">Kalibrasyon · {calib.points.length} nokta</h3>
      <p className="mt-1 text-sm">
        {target ? (
          <>
            Gerçek yerine tıkla: <strong>{t(pinKey(target.id, "title"))}</strong>
            <span className="text-muted"> ({calib.index + 1}/{landmarks.length})</span>
          </>
        ) : (
          "Tüm simge yapılar bitti."
        )}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className="btn" disabled={!target} onClick={dev.skipLandmark}>Atla</button>
        <button type="button" className="btn" disabled={!calib.points.length} onClick={dev.undoLandmark}>Geri al</button>
        <button type="button" className="btn btn-primary" disabled={!calibResult?.json} onClick={dev.copyCalibration}>Kopyala</button>
        <button type="button" className="btn" onClick={dev.stopCalibration}>Çık</button>
      </div>
      {calibResult?.error && <p className="mt-2 text-xs font-bold text-accent">{calibResult.error}</p>}
      {calibResult && !calibResult.error && (
        <p className="mt-2 text-xs text-muted">
          En uzak nokta harita genişliğinin %{(calibResult.residual * 100).toFixed(2)} kadar sapıyor
          {calibResult.residual > 0.01 ? ": uzaktakileri geri alıp yeniden tıkla." : ": iyi."} <code>maps.ts</code>'e yapıştır.
        </p>
      )}
    </div>
  );
}

export default function DevPanel({ dev, categories }: { dev: DevTool; categories: readonly Category[] }) {
  const t = useT();
  const { fields: f, set, coord, rows, toast } = dev;
  const input = (key: keyof EntryFields, placeholder = "") => (
    <input value={String(f[key] ?? "")} placeholder={placeholder} onChange={(e) => set(key, e.target.value as never)} />
  );

  return (
    <section className="card-solid border-dashed" aria-label="Veri girişi">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg">Veri girişi</h2>
        <span className="text-xs text-muted">{rows.length} satır listede</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        Haritaya tıkla → formu doldur → <strong>Listeye ekle</strong>. Bitince <strong>CSV indir</strong> ve <code>inbox/</code>'a koy.
        Kısayollar: <kbd>1-0</kbd> kategori · <kbd>Esc</kbd> konumu kaldır
      </p>

      <form
        className="mt-3 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          dev.add();
        }}
      >
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Kategori">
          {categories.map((c, i) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={f.categoryId === c.id}
              onClick={() => set("categoryId", c.id)}
              className={`chip chip-btn ${f.categoryId === c.id ? "chip-on" : ""}`}
              style={{ ["--dot" as string]: CATEGORY_COLORS[c.colorToken] }}
            >
              {i < 10 && <span className="text-muted">{(i + 1) % 10}</span>} {t(categoryKey(c.id))}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-line-strong bg-[#140c22] px-3 py-2 text-xs">
          <span className="font-bold uppercase tracking-wider text-muted">Konum</span>
          {coord ? (
            <>
              <strong className="tabular-nums">{formatCoord(coord)}</strong>
              <button type="button" className="ml-auto underline" onClick={dev.copyCoord}>kopyala</button>
              <button type="button" className="underline" onClick={() => dev.setCoord(null)}>kaldır</button>
            </>
          ) : (
            <span className="text-muted">haritaya tıkla (boş bırakılabilir)</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Başlık (EN) *" wide>{input("title", "Rooftop package behind the motel")}</Field>
          <Field label="Başlık (TR)" wide>{input("titleTr", "isteğe bağlı")}</Field>
          <Field label="Açıklama (EN)" wide>{input("description")}</Field>
          <Field label="Açıklama (TR)" wide>{input("descriptionTr")}</Field>
          <Field label="Kaynak linki" wide>{input("sourceUrl", "YouTube / Twitch / Reddit")}</Field>
          <Field label="Zaman">{input("timestamp", "1:02:33")}</Field>
          <Field label="Bölge">{input("region")}</Field>
          <Field label="Bulan">{input("finder", "yayıncı adı")}</Field>
          <Field label="Bulanın linki">{input("finderUrl", "kanal linki")}</Field>
          <Field label="Spoiler">
            <select value={f.spoiler} onChange={(e) => set("spoiler", e.target.value as EntryFields["spoiler"])}>
              <option value="none">yok</option>
              <option value="mild">hafif</option>
              <option value="major">büyük</option>
            </select>
          </Field>
          <Field label="Durum">
            <select value={f.status} onChange={(e) => set("status", e.target.value as EntryFields["status"])}>
              <option value="unverified">doğrulanmadı</option>
              <option value="verified">doğrulandı</option>
              <option value="disputed">tartışmalı</option>
            </select>
          </Field>
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={!dev.canAdd}>
          Listeye ekle {coord ? "" : "(konumsuz)"}
        </button>
        <p className="text-[11px] text-muted">Kaynak linki, bulan, kategori ve durum bir sonraki pin için hatırlanır.</p>
      </form>

      {rows.length > 0 && (
        <div className="mt-3">
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {[...rows].reverse().map((r) => {
              const c = categories.find((x) => x.id === r.categoryId);
              return (
                <li key={r.at} className="flex items-center gap-2 rounded-lg border border-line px-2 py-1 text-xs">
                  <span className="dot !h-2.5 !w-2.5" style={{ background: c ? CATEGORY_COLORS[c.colorToken] : undefined }} />
                  <span className="flex-1 truncate">{r.title}</span>
                  <span className={r.coord ? "text-accent2" : "text-sun"}>{r.coord ? "konum ✓" : "konumsuz"}</span>
                  <button type="button" className="px-1 text-muted hover:text-accent" onClick={() => dev.remove(r.at)} aria-label="Sil">
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={dev.download}>CSV indir</button>
            <button type="button" className="btn" onClick={dev.copyCsv}>CSV kopyala</button>
            <button
              type="button"
              className="btn"
              onClick={() => window.confirm(`${rows.length} satır silinsin mi? İndirdiysen sorun yok.`) && dev.clearRows()}
            >
              Listeyi temizle
            </button>
          </div>
        </div>
      )}
      <p className="mt-2 h-4 text-xs font-bold text-accent2" role="status" aria-live="polite">{toast}</p>

      <CalibrationPanel dev={dev} />
    </section>
  );
}
