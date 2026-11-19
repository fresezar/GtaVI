#!/usr/bin/env node
// Partner stats as ready-to-send messages (English), one per partner.
//   npm run partners:report            all partners
//   npm run partners:report -- slug    one partner
// Needs the moderator token: SIXSTAR_ADMIN_TOKEN in the environment or in .env.local (git-ignored).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib.mjs";

const API = process.env.SIXSTAR_API ?? "https://sixstargta.com";
const envLocal = (key) => {
  const f = join(ROOT, ".env.local");
  if (!existsSync(f)) return "";
  const line = readFileSync(f, "utf8").split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "") : "";
};
const token = process.env.SIXSTAR_ADMIN_TOKEN ?? envLocal("SIXSTAR_ADMIN_TOKEN");
if (!token) {
  console.error("No token: set SIXSTAR_ADMIN_TOKEN (environment or .env.local).");
  process.exit(1);
}

const partners = JSON.parse(readFileSync(join(ROOT, "content", "partners.json"), "utf8"));
const res = await fetch(`${API}/api/admin/partners`, { headers: { authorization: `Bearer ${token}` } });
if (!res.ok) throw new Error(`partners: HTTP ${res.status}`);
const { partners: stats } = await res.json();

const only = process.argv[2];
for (const p of partners.filter((x) => !only || x.slug === only)) {
  const s = stats[p.slug] ?? { visits: 0, visits30: 0, suggestions: {} };
  const sent = Object.values(s.suggestions).reduce((a, b) => a + b, 0);
  const live = (s.suggestions.approved ?? 0) + (s.suggestions.published ?? 0);
  console.log(`--- ${p.name} (${p.status}) ---`);
  console.log(
    [
      `Hey ${p.name}, your Six Star numbers so far:`,
      `- ${s.visits30} people visited your page in the last 30 days (${s.visits} in total)`,
      `- ${sent} finds sent by your community, ${live} live on the map with your name`,
      `Your page: https://sixstargta.com/p/${p.slug}`,
    ].join("\n"),
  );
  console.log("");
}
