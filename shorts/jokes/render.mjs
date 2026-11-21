// Animated joke shorts: renders shorts/jokes/<ep>/index.html frame by frame in headless Chrome and muxes the voice.
//   node shorts/jokes/render.mjs shorts/jokes/ep01        -> shorts/out/joke-ep01.mp4
// Voice: one wav per line in <ep>/voice/<id>.wav. Missing ones are made with Windows voices (placeholder, tts.ps1).
// The page exposes setup(data), render(t) and sfx(T); this script owns timing, captions, mouth flaps and audio.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const FF = join(ROOT, "node_modules/ffmpeg-static/ffmpeg.exe");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const FPS = 30, W = 1080, H = 1920, RATE = 24000;
const VOICES = { nar: ["Microsoft Hazel Desktop", 0], hero: ["Microsoft Zira Desktop", 1], cop: ["Microsoft Hazel Desktop", -1], parrot: ["Microsoft Zira Desktop", 3], doc: ["Microsoft Hazel Desktop", -1], captain: ["Microsoft Hazel Desktop", 2],
                 crowd: ["Microsoft Zira Desktop", 1], big: ["Microsoft Hazel Desktop", -2] };

const ep = resolve(process.argv[2] || "");
if (!existsSync(join(ep, "lines.json"))) { console.error("usage: node shorts/jokes/render.mjs shorts/jokes/<ep>"); process.exit(1); }
const style = process.argv.includes("--style") ? process.argv[process.argv.indexOf("--style") + 1] : null;
const name = "joke-" + basename(ep) + (style ? "-" + style : "");
const work = join(ROOT, "shorts/work", name);
const vdir = join(ep, "voice");
mkdirSync(work, { recursive: true }); mkdirSync(vdir, { recursive: true });
const spec = JSON.parse(readFileSync(join(ep, "lines.json"), "utf8"));
const only = process.argv.includes("--still") ? process.argv[process.argv.indexOf("--still") + 1].split(",").map(Number) : null;

// ---------- voice ----------
// Own voice, one take: <ep>/voice/take.(wav|m4a|mp3) holds the whole script read in order. Whisper finds the words,
// the take is cut into one wav per line, and the pronunciation check goes to accent-log.csv (progress over episodes).
const take = ["wav", "m4a", "mp3", "ogg"].map((x) => join(vdir, "take." + x)).find(existsSync);
if (take) splitTake(take);

function writeWav(file, a) {
  const n = a.length, b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22); b.writeUInt32LE(RATE, 24); b.writeUInt32LE(RATE * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write("data", 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, a[i])) * 32767), 44 + i * 2);
  writeFileSync(file, b);
}

function splitTake(file) {
  const { mtimeMs } = statSync(file);
  const stampFile = join(vdir, "take.stamp"), stamp = JSON.stringify([mtimeMs, spec.lines.map((l) => l.text)]);
  if (existsSync(stampFile) && readFileSync(stampFile, "utf8") === stamp) return;
  const pcm = spawnSync(FF, ["-v", "error", "-i", file, "-ac", "1", "-ar", String(RATE), "-f", "f32le", "-"], { maxBuffer: 1 << 30 }).stdout;
  const audio = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.length / 4);
  const wj = join(work, "take-words.json");
  // no script hint on purpose: the check should hear what a listener hears
  const r = spawnSync("py", ["-3", join(ROOT, "shorts/tools/words.py"), file, wj], { stdio: "inherit", env: { ...process.env, FFMPEG: FF } });
  if (r.status) { console.error("whisper failed"); process.exit(1); }
  const heard = JSON.parse(readFileSync(wj, "utf8"));
  const NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  const norm = (w) => { const x = w.toLowerCase().replace(/[^a-z0-9']/g, "").replace(/'/g, ""); return /^\d+$/.test(x) && +x <= 10 ? NUM[+x] : x; };
  const script = []; spec.lines.forEach((l, li) => l.text.split(/\s+/).forEach((w) => { const n = norm(w); if (n) script.push({ w, n, li }); }));
  const hw = heard.map((h) => ({ ...h, n: norm(h.w) })).filter((h) => h.n);
  // edit-distance alignment of script words to heard words
  const A = script.length, B = hw.length, dp = Array.from({ length: A + 1 }, (_, i) => Int32Array.from({ length: B + 1 }, (_, j) => i + j));
  for (let i = 1; i <= A; i++) for (let j = 1; j <= B; j++)
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (script[i - 1].n === hw[j - 1].n ? 0 : 1));
  const pair = new Array(A).fill(null);
  for (let i = A, j = B; i > 0 && j >= 0;) {
    if (j > 0 && dp[i][j] === dp[i - 1][j - 1] + (script[i - 1].n === hw[j - 1].n ? 0 : 1)) { pair[i - 1] = j - 1; i--; j--; }
    else if (dp[i][j] === dp[i - 1][j] + 1) i--;
    else j--;
  }
  const bad = [];
  script.forEach((s, i) => { if (pair[i] === null) bad.push(`"${s.w}" not heard`); else if (hw[pair[i]].n !== s.n) bad.push(`"${s.w}" heard as "${hw[pair[i]].w}"`); });
  const exact = A - bad.length, pct = (100 * exact / A).toFixed(1);
  // line spans from matched words; cut halfway into the pauses between lines
  const span = spec.lines.map((_, li) => {
    const js = script.map((s, i) => (s.li === li ? pair[i] : null)).filter((j) => j !== null);
    if (!js.length) { console.error(`line ${spec.lines[li].id} not found in the take`); process.exit(1); }
    return [hw[Math.min(...js)].s, hw[Math.max(...js)].e];
  });
  span.forEach(([s, e], li) => {
    const a = li ? Math.max((span[li - 1][1] + s) / 2, s - 0.25) : Math.max(0, s - 0.25);
    const b = li + 1 < span.length ? Math.min((e + span[li + 1][0]) / 2, e + 0.3) : e + 0.3;
    const l = spec.lines[li];
    writeWav(join(vdir, l.id + ".wav"), audio.subarray(Math.floor(a * RATE), Math.ceil(b * RATE)));
    writeFileSync(join(vdir, l.id + ".txt"), `${l.who}|${l.text}`);
  });
  writeFileSync(stampFile, stamp);
  console.log(`TAKE split into ${span.length} lines. Pronunciation: ${exact}/${A} words as written (${pct}%)`);
  if (bad.length) console.log("CHECK " + bad.join(", "));
  const log = join(ROOT, "shorts/jokes/accent-log.csv");
  if (!existsSync(log)) writeFileSync(log, "date,episode,words,as_written,percent,misses\n");
  writeFileSync(log, readFileSync(log, "utf8") + `${new Date().toISOString().slice(0, 10)},${basename(ep)},${A},${exact},${pct},"${bad.join("; ").replace(/"/g, "'")}"\n`);
}

const stale = spec.lines.filter((l) => {
  const stamp = join(vdir, l.id + ".txt"), want = `${l.who}|${l.text}`;
  return !existsSync(join(vdir, l.id + ".wav")) || (existsSync(stamp) && readFileSync(stamp, "utf8") !== want);
});
if (stale.length) {
  const items = stale.map((l) => ({ id: l.id, text: l.text, voice: VOICES[l.who][0], rate: VOICES[l.who][1] }));
  writeFileSync(join(work, "tts.json"), JSON.stringify(items));
  const r = spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", join(ROOT, "shorts/jokes/tts.ps1"),
                                     "-List", join(work, "tts.json"), "-OutDir", vdir], { stdio: "inherit" });
  if (r.status) process.exit(1);
  for (const l of stale) writeFileSync(join(vdir, l.id + ".txt"), `${l.who}|${l.text}`);
  console.log(`TTS ${stale.length} placeholder lines`);
}

function readWav(file) {
  const b = readFileSync(file);
  let p = 12, fmt = null, data = null;
  while (p + 8 <= b.length) {
    const id = b.toString("ascii", p, p + 4), size = b.readUInt32LE(p + 4);
    if (id === "fmt ") fmt = { ch: b.readUInt16LE(p + 10), rate: b.readUInt32LE(p + 12), bits: b.readUInt16LE(p + 22) };
    if (id === "data") data = b.subarray(p + 8, p + 8 + size);
    p += 8 + size + (size & 1);
  }
  if (!fmt || fmt.bits !== 16) throw new Error(`${file}: need 16-bit PCM`);
  const n = Math.floor(data.length / 2 / fmt.ch), out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = data.readInt16LE(i * 2 * fmt.ch) / 32768;
  if (fmt.rate === RATE) return out;
  const m = Math.floor(n * RATE / fmt.rate), rs = new Float32Array(m); // linear resample
  for (let i = 0; i < m; i++) { const x = i * fmt.rate / RATE, k = Math.floor(x), f = x - k; rs[i] = (out[k] ?? 0) * (1 - f) + (out[k + 1] ?? 0) * f; }
  return rs;
}
function trim(a, thr = 0.012) {
  let s = 0, e = a.length - 1;
  while (s < a.length && Math.abs(a[s]) < thr) s++;
  while (e > s && Math.abs(a[e]) < thr) e--;
  return a.subarray(Math.max(0, s - RATE * 0.03), Math.min(a.length, e + RATE * 0.08));
}

const T = {}, parts = [];
let t = spec.lead ?? 0.5;
for (const l of spec.lines) {
  const a = trim(readWav(join(vdir, l.id + ".wav")));
  t += l.pre ?? 0;
  T[l.id] = { s: +t.toFixed(3), e: +(t + a.length / RATE).toFixed(3), who: l.who };
  parts.push([t, a]);
  t += a.length / RATE + (l.post ?? 0.25);
}
const total = t + (spec.tail ?? 1.5);
const N = Math.ceil(total * RATE);
const voice = new Float32Array(N);
for (const [st, a] of parts) { const i0 = Math.round(st * RATE); for (let i = 0; i < a.length && i0 + i < N; i++) voice[i0 + i] += a[i]; }

// mouth flaps: RMS per frame, normalised
const hop = RATE / FPS, nf = Math.ceil(total * FPS), env = [];
for (let f = 0; f < nf; f++) {
  let s = 0; const i0 = Math.round(f * hop);
  for (let i = i0; i < i0 + hop && i < N; i++) s += voice[i] * voice[i];
  env.push(Math.sqrt(s / hop));
}
const emax = Math.max(...env) || 1;
const talk = env.map((v) => +Math.min(1, v / emax * 1.6).toFixed(2));

// captions: up to 3 words, cut at punctuation, timed by length
const SMALL = new Set("a an the is are was or and but to of in on at for with your you its this that his he".split(" "));
const caps = [];
for (const l of spec.lines) {
  const words = (l.caption ?? l.text).replace(/"/g, "").split(/\s+/).filter(Boolean);
  const out = []; let cur = [];
  for (const w of words) { cur.push(w); if (cur.length >= 3 || /[.,!?:]$/.test(w)) { out.push(cur); cur = []; } }
  if (cur.length) out.push(cur);
  for (let i = 0; i + 1 < out.length; i++) {
    const last = out[i][out[i].length - 1];
    if (out[i].length > 1 && SMALL.has(last.toLowerCase()) && !/[.,!?:]$/.test(last)) out[i + 1].unshift(out[i].pop());
  }
  const pieces = out.map((c) => c.join(" ")), wsum = pieces.reduce((s, p) => s + p.length + 4, 0);
  let acc = T[l.id].s; const span = T[l.id].e - T[l.id].s;
  for (const p of pieces) { const d = span * (p.length + 4) / wsum; caps.push({ s: +acc.toFixed(3), e: +(acc + d + 0.08).toFixed(3), text: p.replace(/[.,]$/, "") }); acc += d; }
}

writeFileSync(join(work, "timing.json"), JSON.stringify({ total: +total.toFixed(2), T }, null, 1));

// ---------- chrome ----------
const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${join(work, "chrome")}`, "--hide-scrollbars",
  "--allow-file-access-from-files", "--disable-gpu", "--force-device-scale-factor=1", `--window-size=${W},${H}`, "about:blank"]);
const wsUrl = await new Promise((res, rej) => {
  let buf = "";
  chrome.stderr.on("data", (d) => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) res(m[1]); });
  chrome.on("exit", () => rej(new Error("chrome exited: " + buf.slice(-400))));
});
const port = new URL(wsUrl).port;
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const ws = new WebSocket(targets.find((x) => x.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let seq = 0; const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
});
const cdp = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
const js = async (expression) => {
  const r = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};

await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await cdp("Page.navigate", { url: pathToFileURL(join(ep, "index.html")).href + (style ? "?style=" + style : "") });
for (let i = 0; i < 100 && (await js("document.readyState").catch(() => "")) !== "complete"; i++) await new Promise((r) => setTimeout(r, 100));
await js("document.fonts.ready.then(() => true)");
await js(`setup(${JSON.stringify({ T, total, talk, caps, fps: FPS })})`);
const shot = async (t) => { await js(`render(${t})`); return Buffer.from((await cdp("Page.captureScreenshot", { format: "jpeg", quality: 92 })).data, "base64"); };

if (only !== null) { // stills for checking moments: --still 3.5,12,20
  for (const s of only) { const f = join(work, `still-${s}.jpg`); writeFileSync(f, await shot(s)); console.log("STILL " + f); }
  ws.close(); chrome.kill(); process.exit(0);
}

// ---------- sound effects (synthesised) ----------
const synth = {
  ding: (u) => Math.sin(2 * Math.PI * 1320 * u) * Math.exp(-9 * u) * 0.5 + Math.sin(2 * Math.PI * 2640 * u) * Math.exp(-14 * u) * 0.2,
  pop: (u) => (u < 0.09 ? Math.sin(2 * Math.PI * (300 * u + 9000 * u * u)) * (1 - u / 0.09) * 0.6 : 0),
  whoosh: (() => { let lp = 0; return (u, d = 0.7) => { lp += 0.25 * ((Math.random() * 2 - 1) - lp); return u < d ? lp * Math.sin(Math.PI * u / d) * 1.2 : 0; }; })(),
  boom: (() => { let lp = 0; return (u) => { lp += 0.04 * ((Math.random() * 2 - 1) - lp); return u < 1.6 ? lp * 6 * Math.exp(-2.6 * u) + Math.sin(2 * Math.PI * 55 * u) * Math.exp(-5 * u) * 0.5 : 0; }; })(),
  alarm: (u) => (u < 2.4 ? 0.22 * Math.sign(Math.sin(2 * Math.PI * (Math.floor(u / 0.3) % 2 ? 660 : 880) * u)) * (u % 0.3 < 0.26 ? 1 : 0) : 0),
  whistle: (u) => (u < 2.2 ? Math.sin(2 * Math.PI * (1900 * u - 260 * u * u)) * 0.35 * Math.min(1, u * 8) * Math.min(1, (2.2 - u) * 4) : 0),
  bleep: (u) => (u < 0.32 ? Math.sin(2 * Math.PI * 1000 * u) * 0.45 * Math.min(1, u * 200) * Math.min(1, (0.32 - u) * 200) : 0),
  thud: (u) => (u < 0.35 ? Math.sin(2 * Math.PI * (120 * u - 120 * u * u)) * Math.exp(-11 * u) * 0.9 : 0),
  trombone: (u) => {
    const notes = [[0, 0.42, 293.66], [0.46, 0.42, 277.18], [0.92, 0.42, 261.63], [1.38, 1.3, 246.94]];
    for (const [s, d, f] of notes) if (u >= s && u < s + d) {
      const v = u - s, vib = s > 1 ? 1 + 0.02 * Math.sin(2 * Math.PI * 6 * v) : 1;
      let x = 0; for (let h = 1; h <= 6; h++) x += Math.sin(2 * Math.PI * f * vib * h * v) / h;
      return x * 0.28 * Math.min(1, v * 20) * Math.min(1, (d - v) * 8);
    }
    return 0;
  },
};
const cues = await js("sfx()");
const filmStyle = await js("STYLE");
if (filmStyle === "silent") { // quiet projector clatter: short noise ticks at 18 per second
  for (let i = 0; i < N; i++) { const ph = (i / RATE * 18) % 1; voice[i] += ph < 0.06 ? (Math.random() * 2 - 1) * 0.018 * (1 - ph / 0.06) : 0; }
}
const mix = Float32Array.from(voice);

// sad piano bed under the whole story (the format's signature): Am - F - Dm - E arpeggios at 66 bpm, ducked under the voice
if (spec.music !== false) {
  const bed = new Float32Array(N), beat = 60 / 66, hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const prog = [[45, [57, 60, 64, 69]], [41, [53, 57, 60, 65]], [38, [50, 53, 57, 62]], [40, [52, 56, 59, 64]]];
  const note = (at, m, vel, dur) => {
    const f = hz(m), i0 = Math.round(at * RATE), n = Math.min(Math.round(dur * RATE), N - i0);
    for (let i = 0; i < n; i++) {
      const u = i / RATE; let x = 0;
      for (let h = 1; h <= 5; h++) x += Math.sin(2 * Math.PI * f * h * u) * Math.exp(-u * (1.4 + h * 0.9)) / (h * h * 0.6 + 0.4);
      bed[i0 + i] += x * vel * Math.min(1, u * 200);
    }
  };
  for (let b = 0, at = 0.15; at < total; b++, at += beat * 4) {
    const [bass, tones] = prog[b % 4];
    note(at, bass, 0.5, 4); note(at, bass + 12, 0.22, 4);
    [0, 1, 2, 3, 2, 1, 0, 1].forEach((k, j) => note(at + j * beat / 2, tones[k], j ? 0.22 : 0.3, 2.5));
  }
  for (const [d, gn] of [[0.11, 0.25], [0.23, 0.15]]) { const k = Math.round(d * RATE); for (let i = N - 1; i >= k; i--) bed[i] += bed[i - k] * gn; }
  let pk = 0; for (const v of bed) pk = Math.max(pk, Math.abs(v));
  const end = spec.musicEnd ? T[spec.musicEnd].e : total - 1.5;
  let duck = 0;
  for (let i = 0; i < N; i++) {
    const tt = i / RATE, e = env[Math.min(env.length - 1, Math.floor(tt * FPS))] / emax;
    duck += ((e > 0.08 ? 1 : 0) - duck) * (e > 0.08 ? 0.002 : 0.00008);
    const fade = Math.min(1, tt / 0.4) * clamp01(1 - (tt - end) / 0.8);
    mix[i] += bed[i] / pk * 0.16 * (1 - 0.45 * duck) * fade;
  }
}
function clamp01(x) { return Math.max(0, Math.min(1, x)); }
for (const c of cues) {
  const fn = synth[c.name]; if (!fn) throw new Error("unknown sfx " + c.name);
  const i0 = Math.round(c.at * RATE), g = c.gain ?? 1;
  for (let i = 0; i < RATE * 3 && i0 + i < N; i++) mix[i0 + i] += fn(i / RATE) * g * 0.6;
}
const pcm = Buffer.alloc(44 + N * 2);
pcm.write("RIFF", 0); pcm.writeUInt32LE(36 + N * 2, 4); pcm.write("WAVEfmt ", 8); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20);
pcm.writeUInt16LE(1, 22); pcm.writeUInt32LE(RATE, 24); pcm.writeUInt32LE(RATE * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34);
pcm.write("data", 36); pcm.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, mix[i])) * 32767), 44 + i * 2);
const wav = join(work, "mix.wav");
writeFileSync(wav, pcm);

// loudness: measure the mix, then one gain + limiter (target -14 LUFS, peaks under -1.5 dBTP)
const meas = spawnSync(FF, ["-hide_banner", "-i", wav, "-af", "loudnorm=print_format=json", "-f", "null", "-"], { encoding: "utf8" }).stderr;
const inI = Number(JSON.parse(meas.slice(meas.lastIndexOf("{"), meas.lastIndexOf("}") + 1)).input_i);
const gain = -14 - inI + 0.6; // the limiter shaves a little; aim slightly high

// ---------- frames -> ffmpeg ----------
const out = join(ROOT, "shorts/out", name + ".mp4");
const ff = spawn(FF, ["-y", "-v", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(FPS), "-i", "-", "-i", wav,
  "-af", `volume=${gain.toFixed(2)}dB,alimiter=limit=0.82:attack=2:release=60:level=false`, "-ar", "48000", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
const sheetAt = Array.from({ length: 8 }, (_, i) => Math.floor(nf * (i + 0.5) / 8));
const t0 = Date.now();
for (let f = 0; f < nf; f++) {
  const img = await shot(f / FPS);
  if (sheetAt.includes(f)) writeFileSync(join(work, `sheet-${sheetAt.indexOf(f)}.jpg`), img);
  if (!ff.stdin.write(img)) await new Promise((r) => ff.stdin.once("drain", r));
  if (f % 150 === 0) process.stdout.write(`frame ${f}/${nf}\r`);
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));
ws.close(); chrome.kill();
spawnSync(FF, ["-y", "-v", "error", "-i", join(work, "sheet-%d.jpg"), "-vf", "scale=270:-1,tile=8x1",
  "-frames:v", "1", join(work, "sheet.jpg")]);
console.log(`Wrote ${out} (${total.toFixed(1)} s, ${nf} frames, ${((Date.now() - t0) / 1000).toFixed(0)} s render)`);
console.log("SHEET " + join(work, "sheet.jpg"));
