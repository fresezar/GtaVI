"use client";

import { useRef } from "react";
import type { Category } from "@/domain";
import { useT } from "@/i18n/client";
import { categoryKey, pinKey } from "@/i18n/keys";
import { CATEGORY_COLORS } from "./tokens";
import { formatCoord } from "./dev/template";
import { clipUrl, rowState, type DevTool, type EntryFields, type EntryRow, type RowState } from "./dev/useDevTool";

/** Internal data-entry tool (/map?dev=true). Labels are Turkish: the operator is the founder. */

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`field ${wide ? "col-span-2" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

const STATE_LABEL: Record<RowState, { text: string; className: string }> = {
  draft: { text: "taslak", className: "text-muted" },
  unplaced: { text: "konumsuz", className: "text-sun" },
  ready: { text: "konum ✓", className: "text-accent2" },
};

function rowLabel(r: EntryRow): string {
  if (r.title.trim()) return r.title;
  const bits = [r.timestamp, r.note].filter(Boolean).join(" · ");
  return bits || r.sourceUrl || "(boş)";
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

/** Fastest path while watching a stream: link, second, a few words. Finished later from the list. */
function QuickNote({ dev }: { dev: DevTool }) {
  const { quick, setQuickField } = dev;
  return (
    <form
      className="rounded-xl border border-line-strong bg-[#140c22] p-3"
      onSubmit={(e) => {
        e.preventDefault();
        dev.saveQuick();
      }}
      aria-label="Hızlı not"
    >
      <h3 className="text-xs font-bold uppercase tracking-widest text-accent2">Hızlı not</h3>
      <div className="mt-2 grid grid-cols-[1fr_88px] gap-2">
        <label className="field col-span-2">
          <span>Link</span>
          <input value={quick.sourceUrl} placeholder="YouTube / Twitch / TikTok linki" onChange={(e) => setQuickField("sourceUrl", e.target.value)} />
        </label>
        <label className="field">
          <span>Not</span>
          <input value={quick.note} placeholder="ne gördün, birkaç kelime" onChange={(e) => setQuickField("note", e.target.value)} />
        </label>
        <label className="field">
          <span>Zaman</span>
          <input value={quick.timestamp} placeholder="1:02:33" inputMode="numeric" onChange={(e) => setQuickField("timestamp", e.target.value)} />
        </label>
      </div>
      <button type="submit" className="btn btn-primary mt-2 w-full" disabled={!dev.canQuickSave}>Kaydet (Enter)</button>
      <p className="mt-1 text-[11px] text-muted">Link kalır; aynı yayında yalnızca zamanı ve notu yaz. Sonra listeden açıp tamamlarsın.</p>
    </form>
  );
}

export default function DevPanel({ dev, categories }: { dev: DevTool; categories: readonly Category[] }) {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const { fields: f, set, coord, rows, toast, editing, pending } = dev;
  const input = (key: keyof EntryFields, placeholder = "") => (
    <input value={String(f[key] ?? "")} placeholder={placeholder} onChange={(e) => set(key, e.target.value as never)} />
  );
  const clip = clipUrl(f);
  const readyCount = rows.length - pending.drafts - pending.unplaced;

  return (
    <section className="card-solid space-y-3 border-dashed" aria-label="Veri girişi">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg">Veri girişi</h2>
        <span className="text-xs text-muted">{rows.length} satır</span>
      </div>

      <QuickNote dev={dev} />

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          dev.add();
        }}
        aria-label="Tam giriş"
      >
        {editing ? (
          <div className="rounded-xl border border-sun bg-[#2a1a10] px-3 py-2 text-xs">
            <p className="font-bold uppercase tracking-widest text-sun">Düzenleniyor</p>
            <p className="mt-1">Kategori ve başlığı yaz, haritada yerine tıkla, <strong>Kaydet</strong>.</p>
            {clip && (
              <a href={clip} target="_blank" rel="noopener" className="mt-1 inline-block font-bold underline">
                ▶ Klibi aç{f.timestamp ? ` (${f.timestamp})` : ""}
              </a>
            )}
          </div>
        ) : (
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted">Tam giriş · <kbd>1-0</kbd> kategori · <kbd>Esc</kbd> konumu kaldır</h3>
        )}

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
          <Field label="Not (yalnızca sana, sitede görünmez)" wide>{input("note")}</Field>
        </div>

        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary flex-1" disabled={!dev.canAdd}>
            {editing ? "Kaydet" : `Listeye ekle${coord ? "" : " (konumsuz)"}`}
          </button>
          {editing && <button type="button" className="btn" onClick={dev.cancelEdit}>Vazgeç</button>}
        </div>
        {!editing && <p className="text-[11px] text-muted">Konumsuz satır da sitede yayınlanır (pin sayfası ve listeler); konumu sonra eklersin.</p>}
      </form>

      {rows.length > 0 && (
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="text-muted">{pending.drafts} taslak</span>
            <span className="text-sun">{pending.unplaced} konumsuz</span>
            <span className="text-accent2">{readyCount} hazır</span>
            <button type="button" className="ml-auto font-bold underline disabled:opacity-40" onClick={dev.editNext} disabled={!pending.next}>
              Sıradakini aç →
            </button>
          </div>
          <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
            {[...rows].reverse().map((r) => {
              const c = categories.find((x) => x.id === r.categoryId);
              const state = STATE_LABEL[rowState(r)];
              const active = dev.editingAt === r.at;
              return (
                <li key={r.at} className={`flex items-center gap-2 rounded-lg border px-2 py-1 text-xs ${active ? "border-sun" : "border-line"}`}>
                  <span className="dot !h-2.5 !w-2.5" style={{ background: c ? CATEGORY_COLORS[c.colorToken] : "transparent" }} />
                  <button type="button" className="flex-1 truncate text-left hover:underline" onClick={() => dev.edit(r.at)} title="Aç ve düzenle">
                    {rowLabel(r)}
                  </button>
                  <span className={state.className}>{state.text}</span>
                  <button type="button" className="px-1 text-muted hover:text-accent" onClick={() => window.confirm("Bu satır silinsin mi?") && dev.remove(r.at)} aria-label="Sil">
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={dev.download} disabled={!rows.length}>CSV indir</button>
        <button type="button" className="btn" onClick={dev.copyCsv} disabled={!rows.length}>CSV kopyala</button>
        <button type="button" className="btn" onClick={() => fileRef.current?.click()}>CSV'den geri yükle</button>
        {readyCount > 0 && (
          <button
            type="button"
            className="btn"
            onClick={() => window.confirm(`${readyCount} hazır satır listeden kalksın mı? İndirip inbox'a koyduysan sorun yok. Taslak ve konumsuzlar kalır.`) && dev.clearReady()}
          >
            Hazırları temizle
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,text/csv"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) dev.restoreCsv(await file.text());
            e.target.value = "";
          }}
        />
      </div>
      <p className="text-[11px] text-muted">
        Liste bu tarayıcıda durur. <strong>CSV indir</strong> her satırı içerir (taslaklar dahil): <code>inbox/</code>'a koy, yedeğin de odur.
        Aynı dosyayı tekrar göndermek sorun değil; içe aktarma zaten eklenenleri atlar.
      </p>
      <p className="h-4 text-xs font-bold text-accent2" role="status" aria-live="polite">{toast}</p>

      <CalibrationPanel dev={dev} />
    </section>
  );
}
