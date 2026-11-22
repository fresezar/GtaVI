"use client";

import { useCallback, useEffect, useState } from "react";
import { CATEGORIES } from "@/data/categories";
import { PARTNER_BY_SLUG } from "@/data/partners";
import { PINS } from "@/data/pins";
import pinTextEn from "@content/pin-text.en.json";
import { pinKey } from "@/i18n/keys";
import { t as translate } from "@/i18n";
import { categoryKey } from "@/i18n/keys";

/**
 * Moderator queue (Turkish UI, for the founder). Token = the ADMIN_TOKEN Worker secret, kept in this
 * browser only. Preview = the 3x3 map tiles (zoom 5, 1 px = 1 m) around the suggested spot.
 */
const TOKEN_KEY = "sixstar.admin.token";
const STATUSES = [
  ["pending", "Bekleyen"],
  ["approved", "Onaylanan"],
  ["rejected", "Reddedilen"],
  ["published", "Siteye işlenen"],
] as const;
type Status = (typeof STATUSES)[number][0];

interface Item {
  id: string;
  created_at: string;
  status: Status;
  category_id: string;
  title: string;
  x: number;
  y: number;
  proof_url: string;
  note: string | null;
  name: string | null;
  locale: string;
  pin_id: string | null;
  reviewed_at: string | null;
  reason: string | null;
  ref: string | null;
  proof_image: string | null;
}

const catName = (id: string) => translate(categoryKey(id as never), undefined, "tr");

/** Pin frame -> metres: the frame spans the 32768 px zoom-5 grid, 1 px = 1 m. */
const METRES = 32768;
const NEAR_M = 75;
const metres = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y) * METRES;

/** Existing pins and earlier suggestions within NEAR_M of this one: likely duplicates (only the first earns points). */
function nearby(item: Item, others: Item[]) {
  const out: string[] = [];
  for (const p of PINS) {
    if (!p.coord || p.id === item.pin_id) continue;
    const d = metres(item, { x: p.coord[0], y: p.coord[1] });
    if (d <= NEAR_M) out.push(`${(pinTextEn as Record<string, string>)[pinKey(p.id, "title")] ?? p.slug} (pin, ${Math.round(d)} m)`);
  }
  for (const o of others) {
    if (o.id === item.id || o.created_at >= item.created_at) continue;
    const d = metres(item, o);
    if (d <= NEAR_M) out.push(`${o.title} (öneri, ${Math.round(d)} m)`);
  }
  return out;
}

function Preview({ x, y }: { x: number; y: number }) {
  const GRID = 32768;
  const px = x * GRID;
  const py = y * GRID;
  const tx = Math.floor(px / 256);
  const ty = Math.floor(py / 256);
  const scale = 300 / 768;
  return (
    <div className="relative h-[300px] w-[300px] max-w-full shrink-0 overflow-hidden bg-[#2F90B0]">
      {[-1, 0, 1].flatMap((dy) =>
        [-1, 0, 1].map((dx) => (
          // eslint-disable-next-line @next/next/no-img-element -- our own static tiles
          <img
            key={`${dx},${dy}`}
            src={`/tiles/day/5/${tx + dx}/${ty + dy}.jpg`}
            alt=""
            className="absolute h-[100px] w-[100px] max-w-none"
            style={{ left: (dx + 1) * 100, top: (dy + 1) * 100 }}
            onError={(e) => (e.currentTarget.style.visibility = "hidden")}
          />
        )),
      )}
      <span
        className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-white bg-accent"
        style={{ left: (px - (tx - 1) * 256) * scale, top: (py - (ty - 1) * 256) * scale }}
        aria-hidden="true"
      />
    </div>
  );
}

/** The uploaded screenshot, fetched with the moderator token (never public). Deleted on approve or reject. */
function ProofImage({ id, token }: { id: string; token: string }) {
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let url = "";
    fetch(`/api/admin/proof?id=${encodeURIComponent(id)}`, { headers: { authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((b) => {
        url = URL.createObjectURL(b);
        setSrc(url);
      })
      .catch(() => setFailed(true));
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, token]);
  if (failed) return <p className="text-xs text-muted">Görsel açılamadı.</p>;
  if (!src) return <p className="text-xs text-muted">Görsel yükleniyor…</p>;
  return (
    <a href={src} target="_blank" rel="noopener" className="block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Kanıt ekran görüntüsü" className="max-h-72 w-auto border border-line" />
    </a>
  );
}

function Row({ item, token, onDone, others }: { item: Item; token: string; onDone: () => void; others: Item[] }) {
  const close = nearby(item, others);
  const [title, setTitle] = useState(item.title);
  const [categoryId, setCategoryId] = useState(item.category_id);
  const [name, setName] = useState(item.name ?? "");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const act = async (action: "approve" | "reject") => {
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/admin/review", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(action === "approve" ? { id: item.id, action, title, categoryId, name } : { id: item.id, action, reason }),
    });
    setBusy(false);
    if (r.ok) onDone();
    else setMsg(`Hata: ${r.status}`);
  };

  return (
    <li className="card flex flex-col gap-4 !p-4 md:flex-row">
      <Preview x={item.x} y={item.y} />
      <div className="min-w-0 flex-1 space-y-2 text-sm">
        <p className="file-no text-muted">
          {item.id} · {new Date(item.created_at).toLocaleString("tr-TR")} · {item.locale.toUpperCase()}
          {item.pin_id && ` · ${item.pin_id}`}
        </p>
        {close.length > 0 && (
          <p className="border border-sun/60 p-2 text-xs text-sun">
            <b>Yakında {close.length} kayıt var, kopya olabilir:</b> {close.slice(0, 5).join(" · ")}
          </p>
        )}
        {item.ref && (
          <p className="text-xs font-bold text-sun">Partner: {PARTNER_BY_SLUG.get(item.ref)?.name ?? item.ref}</p>
        )}
        <label className="field">
          Başlık
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
        </label>
        <label className="field">
          Kategori
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{catName(c.id)}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Bulan (boş = anonim)
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        </label>
        {item.proof_image && (
          <div>
            <b>Kanıt (ekran görüntüsü, karardan sonra silinir):</b>
            <ProofImage id={item.id} token={token} />
          </div>
        )}
        {item.proof_url && (
          <p>
            <b>Kanıt:</b>{" "}
            <a href={item.proof_url} target="_blank" rel="noopener noreferrer ugc" className="break-all text-accent underline">{item.proof_url}</a>
          </p>
        )}
        {item.note && <p><b>Not:</b> {item.note}</p>}
        <p className="text-xs text-muted">
          Konum: {item.x.toFixed(5)}, {item.y.toFixed(5)}
          {item.reason && ` · Ret nedeni: ${item.reason}`}
        </p>
        {item.status !== "published" && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => act("approve")}>
              {item.status === "approved" ? "Kaydet" : "Onayla"}
            </button>
            {item.status !== "rejected" && (
              <>
                <input
                  className="min-h-[40px] flex-1 border border-line-strong bg-panel px-3 text-sm"
                  placeholder="Ret nedeni (isteğe bağlı)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <button type="button" className="btn" disabled={busy} onClick={() => act("reject")}>Reddet</button>
              </>
            )}
          </div>
        )}
        {msg && <p className="text-xs font-bold text-accent">{msg}</p>}
      </div>
    </li>
  );
}

interface PartnerStat {
  visits: number;
  visits30: number;
  suggestions: Record<string, number>;
}

/** Visits and suggestions per partner page (/api/admin/partners). Numbers for the monthly partner report. */
function PartnerStats({ token }: { token: string }) {
  const [stats, setStats] = useState<Record<string, PartnerStat> | null>(null);
  useEffect(() => {
    fetch("/api/admin/partners", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? (r.json() as Promise<{ partners: Record<string, PartnerStat> }>) : null))
      .then((d) => setStats(d?.partners ?? null))
      .catch(() => setStats(null));
  }, [token]);
  if (!stats || Object.keys(stats).length === 0) return null;
  const n = (s: PartnerStat, k: string) => s.suggestions[k] ?? 0;
  return (
    <section className="card !p-4" aria-labelledby="partner-stats">
      <h2 id="partner-stats" className="font-display text-xl">Partnerler</h2>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-sm tabular-nums">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-1 pr-3 font-normal">Partner</th>
              <th className="py-1 pr-3 font-normal">Ziyaret (30 gün / toplam)</th>
              <th className="py-1 pr-3 font-normal">Öneri</th>
              <th className="py-1 pr-3 font-normal">Onaylanan</th>
              <th className="py-1 font-normal">Sayfa</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats).map(([slug, s]) => (
              <tr key={slug} className="border-t border-line">
                <td className="py-1.5 pr-3">{PARTNER_BY_SLUG.get(slug)?.name ?? slug} <span className="text-xs text-muted">({PARTNER_BY_SLUG.get(slug)?.status ?? "?"})</span></td>
                <td className="py-1.5 pr-3">{s.visits30} / {s.visits}</td>
                <td className="py-1.5 pr-3">{Object.values(s.suggestions).reduce((a, b) => a + b, 0)}</td>
                <td className="py-1.5 pr-3">{n(s, "approved") + n(s, "published")}</td>
                <td className="py-1.5"><a href={`/p/${slug}/`} className="text-accent underline">/p/{slug}</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">Ziyaret: günde kişi başı bir sayılır (IP saklanmaz).</p>
    </section>
  );
}

interface SubStats {
  active: number;
  online: number;
  weekly: number;
  tr: number;
  unsubscribed: number;
}

/** E-mail list size, and the active list as CSV (fetched with the token, saved by the browser). */
function SubscriberStats({ token }: { token: string }) {
  const [stats, setStats] = useState<SubStats | null>(null);
  useEffect(() => {
    fetch("/api/admin/subscribers", { headers: { authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? (r.json() as Promise<SubStats>) : null))
      .then(setStats)
      .catch(() => setStats(null));
  }, [token]);
  if (!stats) return null;
  const download = async () => {
    const r = await fetch("/api/admin/subscribers?format=csv", { headers: { authorization: `Bearer ${token}` } });
    if (!r.ok) return;
    const url = URL.createObjectURL(await r.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = "sixstar-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="card flex flex-wrap items-center gap-x-6 gap-y-2 !p-4" aria-label="E-posta listesi">
      <h2 className="font-display text-xl">E-posta listesi</h2>
      <span className="text-sm tabular-nums">Aktif <b>{stats.active}</b></span>
      <span className="text-sm tabular-nums">Online haberi <b>{stats.online}</b></span>
      <span className="text-sm tabular-nums">Haftalık <b>{stats.weekly}</b></span>
      <span className="text-sm tabular-nums">Türkçe <b>{stats.tr}</b></span>
      <span className="text-sm tabular-nums text-muted">Ayrılan {stats.unsubscribed}</span>
      <button type="button" className="btn ml-auto" onClick={() => void download()} disabled={!stats.active}>CSV indir</button>
    </section>
  );
}

export default function AdminQueue() {
  const [token, setToken] = useState("");
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("pending");
  const [items, setItems] = useState<Item[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setToken(localStorage.getItem(TOKEN_KEY) ?? "");
    } catch {
      /* storage blocked: ask every time */
    }
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setError("");
    const r = await fetch(`/api/admin/queue?status=${status}`, { headers: { authorization: `Bearer ${token}` } });
    if (r.status === 401) {
      setError("Şifre yanlış.");
      setToken("");
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch {
        /* ignore */
      }
      return;
    }
    if (!r.ok) return setError(`Hata: ${r.status}`);
    const data = (await r.json()) as { items: Item[]; counts: Record<string, number> };
    setItems(data.items);
    setCounts(data.counts);
  }, [token, status]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!token) {
    return (
      <form
        className="card mx-auto max-w-md space-y-3 !p-5"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            localStorage.setItem(TOKEN_KEY, input.trim());
          } catch {
            /* not remembered */
          }
          setToken(input.trim());
        }}
      >
        <h1 className="section-title">Onay kuyruğu</h1>
        {error && <p className="text-sm font-bold text-accent">{error}</p>}
        <label className="field">
          Yönetici şifresi
          <input id="admin-token" type="password" value={input} onChange={(e) => setInput(e.target.value)} autoComplete="off" />
        </label>
        <button type="submit" className="btn btn-primary">Gir</button>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="section-title">Onay kuyruğu</h1>
        <div className="flex gap-2">
          <button type="button" className="btn" onClick={() => void load()}>Yenile</button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              try {
                localStorage.removeItem(TOKEN_KEY);
              } catch {
                /* ignore */
              }
              setToken("");
            }}
          >
            Çıkış
          </button>
        </div>
      </div>
      <SubscriberStats token={token} />
      <PartnerStats token={token} />
      <nav className="flex flex-wrap gap-1" aria-label="Durum">
        {STATUSES.map(([s, label]) => (
          <button key={s} type="button" className="tab" aria-current={status === s ? "page" : undefined} onClick={() => setStatus(s)}>
            {label} ({counts[s] ?? 0})
          </button>
        ))}
      </nav>
      {error && <p className="text-sm font-bold text-accent">{error}</p>}
      {items.length === 0 ? (
        <p className="card text-sm text-muted">Bu listede öneri yok.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <Row key={`${it.id}-${it.status}`} item={it} token={token} onDone={() => void load()} others={items} />
          ))}
        </ul>
      )}
      <p className="text-xs text-muted">
        Onaylanan pinler haritada hemen görünür. Sabit sayfa ve arama için ara ara <code>npm run import:community</code> çalıştırılır
        (onaylananları siteye işler ve &quot;Siteye işlenen&quot; listesine taşır).
      </p>
    </div>
  );
}
