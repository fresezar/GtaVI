"use client";

import { useCallback, useEffect, useState } from "react";
import { CATEGORIES } from "@/data/categories";
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
}

const catName = (id: string) => translate(categoryKey(id as never), undefined, "tr");

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

function Row({ item, token, onDone }: { item: Item; token: string; onDone: () => void }) {
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
        <p>
          <b>Kanıt:</b>{" "}
          <a href={item.proof_url} target="_blank" rel="noopener noreferrer ugc" className="break-all text-accent underline">{item.proof_url}</a>
        </p>
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
            <Row key={`${it.id}-${it.status}`} item={it} token={token} onDone={() => void load()} />
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
