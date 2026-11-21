#!/usr/bin/env node
// "Six Star File" vertical short: hook over gameplay -> gameplay -> map zoom -> end card. 1080x1920, 30 fps.
//   npm run short -- shorts/specs/0001.json
// Spec (JSON):
//   file      "0001"                      case number shown on every card
//   hook      "text"                      big text over the first 3 s of the clip
//   clip      "shorts/raw/x.mp4"          16:9 or 9:16 recording; in/out in seconds (optional)
//   in, out   12.5, 24
//   clips     [{ clip, in, out }, ...]    optional; several shots cut back to back (replaces clip/in/out)
//   voice     { file, at, text }          optional; English voiceover (wav/mp3/m4a) starting `at` s into the video
//                                         (default 0). `text` = the script, a spelling hint for the captions.
//                                         Pauses over 0.3 s are cut to 0.25 s unless `tighten: false`.
//                                         Game audio ducks under the voice; word captions are burned in.
//   captions  false                       optional; turn the voice captions off
//   credit    "@creator"                  optional; shown under the clip
//   fact      "one line"                  optional; shown under the credit
//   map       { image, x, y, place, cta } optional; x/y = 0..1 focus point on the image (portrait screenshot)
//   end       { line }                    optional; line above "sixstargta.com"
// Output: shorts/out/<file>.mp4, mastered to -14 LUFS / -1.5 dBTP (Shorts loudness), plus a frame sheet for review in
// shorts/work/<file>/sheet.jpg. Cards and captions are rendered by headless Chrome from shorts/template/card.html.
// Audio targets and the review sheet follow claude-shorts-editor (MIT, Furkan Cavlak).
import { execFile, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import ffmpeg from "ffmpeg-static";
import { ROOT } from "./lib.mjs";

const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const FPS = 30;
const HOOK_SEC = 3;
const MAP_SEC = 3.5;
const END_SEC = 2.5;
const LUFS = -14;
const PEAK = -1.5;

const specPath = process.argv[2];
if (!specPath) {
  console.error("usage: npm run short -- shorts/specs/<file>.json");
  process.exit(1);
}
const spec = JSON.parse(readFileSync(resolve(specPath), "utf8").replace(/^\uFEFF/, ""));
const abs = (p) => resolve(ROOT, p);
const shots = spec.clips ?? [{ clip: spec.clip, in: spec.in, out: spec.out }];
for (const p of [...shots.map((s) => s.clip), spec.map?.image, spec.voice?.file].filter(Boolean)) {
  if (!existsSync(abs(p))) throw new Error(`missing file: ${p}`);
}

const work = join(ROOT, "shorts", "work", spec.file);
const outDir = join(ROOT, "shorts", "out");
mkdirSync(work, { recursive: true });
mkdirSync(outDir, { recursive: true });

const fail = (msg, detail = "") => {
  console.error(msg + (detail ? "\n" + detail.split("\n").slice(-25).join("\n") : ""));
  process.exit(1);
};
const ff = (args) => {
  const r = spawnSync(ffmpeg, ["-hide_banner", ...args], { encoding: "utf8", maxBuffer: 64 << 20 });
  if (r.status !== 0) fail("ffmpeg failed:", r.stderr);
  return r.stderr;
};
const probe = (file) => {
  const err = spawnSync(ffmpeg, ["-hide_banner", "-i", file], { encoding: "utf8" }).stderr;
  const m = err.match(/Duration: (\d+):(\d+):([\d.]+)/);
  return { sec: m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 0, hasAudio: /Stream #.*Audio:/.test(err) };
};

// Caption words come from the script (right spelling), timings from Whisper (what was heard). Word-level edit-distance
// alignment; a script word Whisper missed gets the gap between its neighbours. Reports words that did not match.
const NUM = { 0: "zero", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten" };
const norm = (w) => { const t = w.toLowerCase().replace(/[^a-z0-9]/g, ""); return NUM[t] ?? t; };
function alignScript(text, heard) {
  const S = text.split(/\s+/).filter(Boolean);
  const a = S.map(norm), b = heard.map((h) => norm(h.w));
  const D = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      D[i][j] = Math.min(D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1), D[i - 1][j] + 1, D[i][j - 1] + 1);
  const pair = new Array(a.length).fill(-1);
  const off = [];
  for (let i = a.length, j = b.length; i > 0 || j > 0; ) {
    if (i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) {
      pair[i - 1] = j - 1;
      if (a[i - 1] !== b[j - 1]) off.push(`"${S[i - 1]}" heard as "${heard[j - 1].w}"`);
      i--, j--;
    } else if (i > 0 && D[i][j] === D[i - 1][j] + 1) off.push(`"${S[--i]}" not heard`);
    else j--;
  }
  if (off.length) console.log(`CHECK ${off.length} words differ from the script: ${off.reverse().join(", ")}`);
  const out = S.map((w, i) => (pair[i] >= 0 ? { w, s: heard[pair[i]].s, e: heard[pair[i]].e } : { w, s: null, e: null }));
  out.forEach((o, i) => {
    if (o.s !== null) return;
    const prev = out.slice(0, i).reverse().find((x) => x.s !== null);
    const next = out.slice(i + 1).find((x) => x.s !== null);
    o.s = prev ? prev.e : next ? Math.max(0, next.s - 0.3) : 0;
    o.e = next ? next.s : o.s + 0.3;
  });
  return out;
}

// ---- lengths ----
for (const s of shots) {
  const p = probe(abs(s.clip));
  s.hasAudio = p.hasAudio;
  s.tIn = s.in ?? 0;
  s.sec = Math.max(0.5, (s.out ?? p.sec) - s.tIn);
}
const clipSec = shots.reduce((t, s) => t + s.sec, 0);
const bodySec = clipSec + (spec.map ? MAP_SEC : 0);
const total = bodySec + END_SEC;

// ---- voice: word timings (Whisper, cached) and caption chunks ----
const voice = spec.voice ? { at: 0, tighten: true, ...spec.voice, path: abs(spec.voice.file) } : null;
let chunks = [];
if (voice) {
  if (voice.tighten) {
    // Shorts pacing: drop leading silence and shorten every pause over 0.3 s to 0.25 s.
    const tight = join(work, "voice.wav");
    const raw = probe(voice.path).sec;
    ff(["-y", "-i", voice.path, "-af",
      "silenceremove=start_periods=1:start_threshold=-40dB:stop_periods=-1:stop_duration=0.3:stop_threshold=-40dB:stop_silence=0.25",
      "-ar", "48000", "-ac", "1", tight]);
    voice.path = tight;
    console.log(`Voice tightened: ${raw.toFixed(1)} s -> ${probe(tight).sec.toFixed(1)} s`);
  }
  voice.sec = probe(voice.path).sec;
  const end = voice.at + voice.sec;
  if (end > total) fail(`voice ends at ${end.toFixed(1)} s but the video is ${total.toFixed(1)} s: add footage or trim the voice`);
  if (end > bodySec) console.warn(`WARN voice runs ${(end - bodySec).toFixed(1)} s into the end card`);
  if (spec.captions !== false) {
    const wordsFile = join(work, "words.json");
    const stamp = join(work, "words.stamp");
    const key = JSON.stringify([voice.file, statSync(abs(voice.file)).mtimeMs, voice.tighten, voice.text ?? ""]);
    if (!existsSync(wordsFile) || !existsSync(stamp) || readFileSync(stamp, "utf8") !== key) {
      console.log("Transcribing voice (Whisper, CPU)...");
      const args = ["-3", join(ROOT, "shorts", "tools", "words.py"), voice.path, wordsFile];
      if (voice.text) args.push(voice.text);
      const r = spawnSync("py", args, { encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8", FFMPEG: ffmpeg } });
      if (r.status !== 0) fail("Whisper failed:", r.stderr);
      writeFileSync(stamp, key);
    }
    const heard = JSON.parse(readFileSync(wordsFile, "utf8"));
    const words = voice.text ? alignScript(voice.text, heard) : heard;
    // Captions follow phrases: split at punctuation, then cut long phrases into even pieces of up to 3 words.
    // A piece never ends on a small word ("the", "is", "or"...): that word moves to the next piece.
    const small = /^(a|an|the|is|are|was|or|and|but|to|of|in|on|at|for|with|your|you|its|this|that)$/i;
    const phrases = [];
    let cur = [];
    for (const w of words) {
      cur.push(w);
      if (/[.,!?;:]$/.test(w.w)) phrases.push(cur), (cur = []);
    }
    if (cur.length) phrases.push(cur);
    for (const p of phrases) {
      if (p.length <= 4 && p.map((x) => x.w).join(" ").length <= 20) { chunks.push(p); continue; }
      const n = Math.ceil(p.length / 3);
      const pieces = Array.from({ length: n }, (_, k) => p.slice(Math.round((k * p.length) / n), Math.round(((k + 1) * p.length) / n)));
      for (let k = 0; k < n - 1; k++) {
        while (pieces[k].length > 1 && small.test(pieces[k].at(-1).w)) pieces[k + 1].unshift(pieces[k].pop());
      }
      chunks.push(...pieces);
    }
    chunks = chunks.map((c, k) => ({
      text: c.map((x) => x.w).join(" ").replace(/[.,;:]+$/, ""),
      s: voice.at + c[0].s,
      e: voice.at + (chunks[k + 1] ? Math.min(chunks[k + 1][0].s, c.at(-1).e + 0.6) : c.at(-1).e + 0.4),
    }));
  }
}

// ---- cards (headless Chrome, 4 at a time) ----
const template = pathToFileURL(join(ROOT, "shorts", "template", "card.html")).href;
const exec = promisify(execFile);
const card = async (name, data) => {
  const png = join(work, `${name}.png`);
  const url = `${template}#${encodeURIComponent(JSON.stringify({ file: spec.file, ...data }))}`;
  await exec(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
    "--default-background-color=00000000", "--window-size=1080,1920", "--force-device-scale-factor=1",
    "--virtual-time-budget=4000", `--user-data-dir=${join(work, "chrome", name)}`, `--screenshot=${png}`, url,
  ]);
  return png;
};
const jobs = [
  () => card("hook", { mode: "hook", text: spec.hook }),
  () => card("credit", { mode: "credit", credit: spec.credit, fact: spec.fact }),
  () => (spec.map ? card("label", { mode: "label", place: spec.map.place, cta: spec.map.cta }) : null),
  () => card("end", { mode: "end", line: spec.end?.line }),
  ...chunks.map((c, k) => () => card(`cap${k}`, { mode: "caption", text: c.text })),
];
const pngs = new Array(jobs.length);
let next = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (next < jobs.length) {
    const k = next++;
    pngs[k] = await jobs[k]();
  }
}));
const [hookPng, creditPng, labelPng, endPng, ...capPngs] = pngs;

// ---- ffmpeg graph ----
const args = ["-y"];
let nIn = 0;
const input = (...a) => (args.push(...a), nIn++);
for (const s of shots) s.i = input("-ss", String(s.tIn), "-t", String(s.sec), "-i", abs(s.clip));
const iHook = input("-loop", "1", "-t", String(clipSec), "-i", hookPng);
const iCredit = input("-loop", "1", "-t", String(clipSec), "-i", creditPng);
const iMap = spec.map ? input("-i", abs(spec.map.image)) : -1;
const iLabel = spec.map ? input("-loop", "1", "-t", String(MAP_SEC), "-i", labelPng) : -1;
const iEnd = input("-loop", "1", "-t", String(END_SEC), "-i", endPng);
const silence = (sec) => input("-f", "lavfi", "-t", String(sec), "-i", "anullsrc=r=48000:cl=stereo");
for (const s of shots) s.iSilence = s.hasAudio ? -1 : silence(s.sec);
const iMapSilence = spec.map ? silence(MAP_SEC) : -1;
const iEndSilence = silence(END_SEC);
const iVoice = voice ? input("-i", voice.path) : -1;
const iCaps = capPngs.map((png) => input("-loop", "1", "-t", String(total), "-i", png));

const V = "format=yuv420p,setsar=1";
const A = "aresample=48000,aformat=channel_layouts=stereo";
// Each shot: blurred full-bleed background + the whole frame on top. Shots are cut back to back.
const g = shots.flatMap((s, k) => [
  `[${s.i}:v]fps=${FPS},split[c${k}a][c${k}b]`,
  `[c${k}a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=28:2,eq=brightness=-0.22[bg${k}]`,
  `[c${k}b]scale=1080:1920:force_original_aspect_ratio=decrease[fg${k}]`,
  `[bg${k}][fg${k}]overlay=(W-w)/2:(H-h)/2,${V}[sv${k}]`,
  s.hasAudio ? `[${s.i}:a]${A}[sa${k}]` : `[${s.iSilence}:a]${A}[sa${k}]`,
]);
g.push(
  `${shots.map((_, k) => `[sv${k}][sa${k}]`).join("")}concat=n=${shots.length}:v=1:a=1[g1][aA]`,
  `[g1][${iHook}:v]overlay=0:0:enable='lt(t,${HOOK_SEC})'[g2]`,
  `[g2][${iCredit}:v]overlay=0:0:shortest=1,${V}[vA]`,
);
const parts = ["[vA][aA]"];
if (spec.map) {
  const n = Math.round(MAP_SEC * FPS);
  const x = spec.map.x ?? 0.5;
  const y = spec.map.y ?? 0.5;
  const ease = `(1-pow(1-on/${n - 1},3))`;
  g.push(
    `[${iMap}:v]scale=2160:3840:force_original_aspect_ratio=increase,crop=2160:3840,` +
      `zoompan=z='1+1.8*${ease}':x='max(0,min(iw-iw/zoom,${x}*iw-iw/zoom/2))':y='max(0,min(ih-ih/zoom,${y}*ih-ih/zoom/2))'` +
      `:d=${n}:s=1080x1920:fps=${FPS}[mz]`,
    `[mz][${iLabel}:v]overlay=0:0:shortest=1,${V}[vB]`,
    `[${iMapSilence}:a]${A}[aB]`,
  );
  parts.push("[vB][aB]");
}
g.push(`[${iEnd}:v]fps=${FPS},scale=1080:1920,${V}[vC]`, `[${iEndSilence}:a]${A}[aC]`);
parts.push("[vC][aC]");
g.push(`${parts.join("")}concat=n=${parts.length}:v=1:a=1[v0][a0]`);

// Captions: one overlay per chunk, on the final timeline.
let vLast = "v0";
chunks.forEach((c, k) => {
  g.push(`[${vLast}][${iCaps[k]}:v]overlay=0:0:shortest=1:enable='between(t,${c.s.toFixed(3)},${c.e.toFixed(3)})'[vc${k}]`);
  vLast = `vc${k}`;
});
// Voice: leveled to -16 LUFS, game audio sits 6 dB lower and ducks further while the voice speaks.
let aLast = "a0";
if (voice) {
  const ms = Math.round(voice.at * 1000);
  g.push(
    `[${iVoice}:a]${A},loudnorm=I=-16:TP=-2:LRA=7,${A},alimiter=limit=0.7:attack=2:release=60:level=false,adelay=delays=${ms}:all=1,apad,atrim=0:${total.toFixed(3)},asplit[vo1][vo2]`,
    `[a0]volume=0.5[gm]`,
    `[gm][vo1]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=300[duck]`,
    `[duck][vo2]amix=inputs=2:normalize=0:duration=first[am]`,
  );
  aLast = "am";
}

const mov = join(work, "mix.mov");
ff([
  ...args, "-filter_complex", g.join(";"), "-map", `[${vLast}]`, "-map", `[${aLast}]`,
  "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", String(FPS),
  "-c:a", "pcm_s16le", "-t", total.toFixed(3), mov,
]);

// ---- master: -14 LUFS / -1.5 dBTP. Measure, apply gain, catch peaks with a limiter, measure the AAC result,
// correct once more if it is still off by more than 0.3 LU. (loudnorm alone falls short on peaky phone voices.)
const loud = (file) => {
  const err = ff(["-i", file, "-vn", "-af", `loudnorm=I=${LUFS}:TP=${PEAK}:LRA=11:print_format=json`, "-f", "null", "-"]);
  return JSON.parse(err.slice(err.lastIndexOf("{"), err.lastIndexOf("}") + 1));
};
const out = join(outDir, `${spec.file}.mp4`);
const silent = !(Number(loud(mov).input_i) > -60);
let gain = silent ? 0 : LUFS - Number(loud(mov).input_i);
let f;
for (let pass = 0; pass < 3; pass++) {
  const af = silent ? "anull" : `volume=${gain.toFixed(2)}dB,alimiter=limit=0.75:attack=2:release=60:level=false`;
  ff(["-y", "-i", mov, "-map", "0:v", "-map", "0:a", "-c:v", "copy", "-af", af,
    "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-movflags", "+faststart", out]);
  f = loud(out);
  const miss = LUFS - Number(f.input_i);
  if (silent || Math.abs(miss) <= 0.3) break;
  gain += miss;
}

// ---- review: loudness + 8-frame sheet ----
const sheet = join(work, "sheet.jpg");
ff(["-y", "-i", out, "-vf", `fps=${(8 / total).toFixed(5)},scale=270:480,tile=8x1:padding=6:color=white`, "-frames:v", "1", sheet]);
const times = Array.from({ length: 8 }, (_, k) => ((k + 0.5) * total / 8).toFixed(1)).join(", ");
console.log(`Wrote shorts/out/${spec.file}.mp4 (${total.toFixed(1)} s)`);
console.log(silent ? "AUDIO silent" : `AUDIO ${f.input_i} LUFS, peak ${f.input_tp} dBTP (target ${LUFS} / ${PEAK})`);
if (voice) console.log(`VOICE ${voice.sec.toFixed(1)} s from ${voice.at} s, ${chunks.length} captions`);
console.log(`SHEET shorts/work/${spec.file}/sheet.jpg (frames at ~${times} s)`);
