#!/usr/bin/env node
// "Six Star File" vertical short: hook over gameplay -> gameplay -> map zoom -> end card. 1080x1920, 30 fps.
//   npm run short -- shorts/specs/0001.json
// Spec (JSON):
//   file      "0001"                      case number shown on every card
//   hook      "text"                      big text over the first 3 s of the clip
//   clip      "shorts/raw/x.mp4"          16:9 or 9:16 recording; in/out in seconds (optional)
//   in, out   12.5, 24
//   credit    "@creator"                  optional; shown under the clip
//   fact      "one line"                  optional; shown under the credit
//   map       { image, x, y, place, cta } optional; x/y = 0..1 focus point on the image (portrait screenshot)
//   end       { line }                    optional; line above "sixstargta.com"
// Output: shorts/out/<file>.mp4. Cards are rendered by headless Chrome from shorts/template/card.html.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import ffmpeg from "ffmpeg-static";
import { ROOT } from "./lib.mjs";

const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const FPS = 30;
const HOOK_SEC = 3;
const MAP_SEC = 3.5;
const END_SEC = 2.5;

const specPath = process.argv[2];
if (!specPath) {
  console.error("usage: npm run short -- shorts/specs/<file>.json");
  process.exit(1);
}
const spec = JSON.parse(readFileSync(resolve(specPath), "utf8").replace(/^\uFEFF/, ""));
const abs = (p) => resolve(ROOT, p);
for (const p of [spec.clip, spec.map?.image].filter(Boolean)) {
  if (!existsSync(abs(p))) throw new Error(`missing file: ${p}`);
}

const work = join(ROOT, "shorts", "work", spec.file);
const outDir = join(ROOT, "shorts", "out");
mkdirSync(work, { recursive: true });
mkdirSync(outDir, { recursive: true });

// ---- cards ----
const template = pathToFileURL(join(ROOT, "shorts", "template", "card.html")).href;
const card = (name, data) => {
  const png = join(work, `${name}.png`);
  const url = `${template}#${encodeURIComponent(JSON.stringify({ file: spec.file, ...data }))}`;
  execFileSync(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
    "--default-background-color=00000000", "--window-size=1080,1920", "--force-device-scale-factor=1",
    "--virtual-time-budget=4000", `--user-data-dir=${join(work, "chrome")}`, `--screenshot=${png}`, url,
  ], { stdio: "ignore" });
  return png;
};
const hookPng = card("hook", { mode: "hook", text: spec.hook });
const creditPng = card("credit", { mode: "credit", credit: spec.credit, fact: spec.fact });
const labelPng = spec.map ? card("label", { mode: "label", place: spec.map.place, cta: spec.map.cta }) : null;
const endPng = card("end", { mode: "end", line: spec.end?.line });

// ---- clip length and audio ----
const probe = spawnSync(ffmpeg, ["-hide_banner", "-i", abs(spec.clip)], { encoding: "utf8" }).stderr;
const hasAudio = /Stream #.*Audio:/.test(probe);
const total = (() => {
  const m = probe.match(/Duration: (\d+):(\d+):([\d.]+)/);
  return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 0;
})();
const tIn = spec.in ?? 0;
const tOut = spec.out ?? total;
const clipSec = Math.max(0.5, tOut - tIn);

// ---- ffmpeg graph ----
const args = ["-hide_banner", "-y"];
const inputs = [];
const input = (...a) => { args.push(...a); return inputs.push(a) - 1; };
const iClip = input("-ss", String(tIn), "-t", String(clipSec), "-i", abs(spec.clip));
const iHook = input("-loop", "1", "-t", String(clipSec), "-i", hookPng);
const iCredit = input("-loop", "1", "-t", String(clipSec), "-i", creditPng);
const iMap = spec.map ? input("-i", abs(spec.map.image)) : -1;
const iLabel = spec.map ? input("-loop", "1", "-t", String(MAP_SEC), "-i", labelPng) : -1;
const iEnd = input("-loop", "1", "-t", String(END_SEC), "-i", endPng);
const silence = (sec) => input("-f", "lavfi", "-t", String(sec), "-i", "anullsrc=r=48000:cl=stereo");
const iClipSilence = hasAudio ? -1 : silence(clipSec);
const iMapSilence = spec.map ? silence(MAP_SEC) : -1;
const iEndSilence = silence(END_SEC);

const V = "format=yuv420p,setsar=1";
const A = "aresample=48000,aformat=channel_layouts=stereo";
const g = [
  `[${iClip}:v]fps=${FPS},split[c1][c2]`,
  `[c1]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=28:2,eq=brightness=-0.22[bg]`,
  `[c2]scale=1080:1920:force_original_aspect_ratio=decrease[fg]`,
  `[bg][fg]overlay=(W-w)/2:(H-h)/2[g1]`,
  `[g1][${iHook}:v]overlay=0:0:enable='lt(t,${HOOK_SEC})'[g2]`,
  `[g2][${iCredit}:v]overlay=0:0:shortest=1,${V}[vA]`,
  hasAudio ? `[${iClip}:a]${A}[aA]` : `[${iClipSilence}:a]${A}[aA]`,
];
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
g.push(`${parts.join("")}concat=n=${parts.length}:v=1:a=1[v][a]`);

const out = join(outDir, `${spec.file}.mp4`);
args.push(
  "-filter_complex", g.join(";"), "-map", "[v]", "-map", "[a]",
  "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", String(FPS),
  "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", out,
);
const run = spawnSync(ffmpeg, args, { encoding: "utf8" });
if (run.status !== 0) {
  console.error(run.stderr.split("\n").slice(-25).join("\n"));
  process.exit(run.status ?? 1);
}
const secs = clipSec + (spec.map ? MAP_SEC : 0) + END_SEC;
console.log(`Wrote shorts/out/${spec.file}.mp4 (${secs.toFixed(1)} s)`);
