// Shared cast and sets for the joke shorts. Every episode loads this file, so a character looks the same everywhere.
// Format rules: shorts/jokes/STYLE.md. Change a character here, never inside an episode.
// ---------- helpers ----------
// Look of the whole channel: color cartoon by default ("clean"). The black-and-white silent film look is kept as an option
// (render.mjs --style silent); notebook and chalk are reference only. Iris out + "The End" card are in every style.
const STYLE = new URLSearchParams(location.search).get("style") || "clean";
const FILM_FPS = STYLE === "silent" ? 18 : 0; // silent-film motion: the picture moves at 18 fps inside a 30 fps video
const O = { notebook: "#1d3a8f", chalk: "#f3f0e6" }[STYLE] || "#2a2238";
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const U = (t, a, b) => clamp((t - a) / (b - a));
const ease = (u) => { u = clamp(u); return u * u * (3 - 2 * u); };
const back = (u) => { u = clamp(u); const c = 2.2; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
const lerp = (a, b, u) => a + (b - a) * u;
const S = (id) => D.T[id].s, E = (id) => D.T[id].e, MID = (id, f) => S(id) + (E(id) - S(id)) * f;
function talkOf(who, t) {
  for (const id in D.T) { const L = D.T[id]; if (L.who === who && t >= L.s - 0.02 && t <= L.e) return D.talk[Math.floor(t * D.fps)] || 0; }
  return 0;
}
const blink = (t, seed = 0) => ((t + seed) % 3.3) < 0.11;
const g = (tr, inner) => `<g transform="${tr}">${inner}</g>`;
const P = (d, f, sw = 6, extra = "") => `<path d="${d}" fill="${f}" stroke="${sw ? O : "none"}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
const ell = (x, y, rx, ry, f, sw = 6, extra = "") => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" stroke="${sw ? O : "none"}" stroke-width="${sw}" ${extra}/>`;
const circ = (x, y, r, f, sw = 6) => ell(x, y, r, r, f, sw);
const limb = (d, col, w) => `<path d="${d}" fill="none" stroke="${O}" stroke-width="${w + 12}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const word = (x, y, s, size, fill = "#ffd23f", rot = 0, sc = 1) =>
  g(`translate(${x} ${y}) rotate(${rot}) scale(${sc})`, s.split("|").map((ln, i, a) =>
    `<text x="0" y="${size * 0.35 + (i - (a.length - 1) / 2) * size * 1.02}" font-size="${size}" fill="${fill}" text-anchor="middle" stroke="${O}" stroke-width="${size * 0.16}" paint-order="stroke" stroke-linejoin="round">${ln}</text>`).join(""));
function cam(cx, cy, z, rot = 0, sx = 0, sy = 0, inner = "") {
  return g(`translate(${540 + sx} ${960 + sy}) rotate(${rot}) scale(${z}) translate(${-cx} ${-cy})`, inner);
}
const shake = (t, amp) => [Math.sin(t * 61) * amp + Math.sin(t * 37) * amp * 0.6, Math.cos(t * 53) * amp + Math.sin(t * 29) * amp * 0.5];

// ---------- faces ----------
function eyes(k, bl, look, skin, y = -18, dx = 46, sc = 1) {
  let s = "";
  for (const x0 of [-dx, dx]) {
    if (bl || k === "laugh" || k === "closed") { s += P(`M${x0 - 24 * sc},${y} q${24 * sc},${k === "laugh" ? -22 * sc : 14 * sc} ${48 * sc},0`, "none", 7 * sc); continue; }
    const big = k === "scared" || k === "shock";
    const rx = (big ? 34 : 26) * sc, ry = (big ? 42 : 32) * sc, pr = (big ? 7 : 11) * sc;
    s += ell(x0, y, rx, ry, "#fff", 5 * Math.max(sc, 0.7));
    s += `<circle cx="${x0 + look * (rx - pr - 5 * sc)}" cy="${y + (k === "sad" ? 8 : 3) * sc}" r="${pr}" fill="${O}"/>`;
    if (k === "sad" || k === "smug" || k === "bored") {
      const cut = k === "bored" ? -0.15 : 0.05;
      s += P(`M${x0 - rx - 3},${y + ry * cut} A${rx + 3},${ry + 3} 0 0 1 ${x0 + rx + 3},${y + ry * cut} Z`, skin, 5 * Math.max(sc, 0.7));
    }
  }
  return s;
}

function heroHead(o) {
  const sk = "#f6c9a4", e = o.expr || "neutral", tk = o.talk || 0;
  const bl = blink(o.t || 0, 0.7) && !["shock", "scared", "laugh"].includes(e);
  let s = ell(-106, 10, 18, 28, sk) + ell(106, 10, 18, 28, sk) + ell(0, 0, 106, 118, sk);
  s += P("M-90,-50 q20,-30 60,-46 M-74,-64 q40,-40 100,-44 M-50,-84 q60,-36 120,-10", "none", 5);
  // optional band-aid cross (o.bandaid), top right of the head
  if (o.bandaid) s += g("translate(52 -86) rotate(-28)", `<rect x="-44" y="-13" width="88" height="26" rx="12" fill="#f2cf9c" stroke="${O}" stroke-width="5"/>` +
       `<rect x="-13" y="-44" width="26" height="88" rx="12" fill="#f2cf9c" stroke="${O}" stroke-width="5"/>` +
       `<rect x="-11" y="-11" width="22" height="22" fill="#e9b97e"/><circle cx="-28" cy="0" r="2.5" fill="#c9965e"/><circle cx="28" cy="0" r="2.5" fill="#c9965e"/>`);
  const brows = { neutral: "M-72,-62 q24,-12 50,-4 M22,-66 q26,-8 50,4", sad: "M-74,-48 L-24,-72 M24,-72 L74,-48",
    scared: "M-74,-72 q22,-24 52,-12 M22,-84 q30,-12 52,12", shock: "M-74,-90 q22,-24 52,-12 M22,-102 q30,-12 52,12",
    shout: "M-74,-80 L-24,-58 M24,-58 L74,-80", smug: "M-74,-58 L-24,-58 M24,-82 q26,-12 50,4", cry: "M-74,-48 L-24,-72 M24,-72 L74,-48" };
  s += P(brows[e] || brows.neutral, "none", 9);
  const ek = { sad: "sad", cry: "sad", scared: "scared", shock: "shock", smug: "smug" }[e] || "n";
  s += eyes(ek, bl, o.look || 0, sk);
  if (e === "cry") s += P("M-60,14 q-6,60 -14,110 M58,14 q6,60 14,110", "none", 0) + `<path d="M-60,14 q-6,60 -14,110 M58,14 q6,60 14,110" stroke="#7fd0ff" stroke-width="16" fill="none" stroke-linecap="round"/>`;
  s += P("M0,-2 q-30,34 -12,58 q16,14 34,0 q10,-20 -22,-58 z", "#f0b48b", 4);
  if (tk > 0.12 && e !== "shock") {
    const ry = 10 + 40 * tk;
    s += ell(4, 86, 34 + tk * 8, ry, "#8a1f2b", 5);
    if (ry > 22) s += `<ellipse cx="4" cy="${86 + ry * 0.45}" rx="20" ry="${ry * 0.35}" fill="#ef7d8a"/>`;
  } else {
    s += ({
      neutral: P("M-30,84 q32,12 64,0", "none", 7),
      happy: P("M-46,70 q50,46 100,0 z", "#fff", 6),
      sad: P("M-38,98 q40,-28 80,0", "none", 7), cry: P("M-38,98 q40,-28 80,0", "none", 7),
      scared: `<rect x="-48" y="66" width="96" height="40" rx="16" fill="#fff" stroke="${O}" stroke-width="6"/>` + P("M-48,86 h96 M-24,68 v36 M0,68 v36 M24,68 v36", "none", 4),
      shock: ell(4, 120, 30, 62, "#8a1f2b", 6) + `<ellipse cx="4" cy="156" rx="18" ry="16" fill="#ef7d8a"/>`,
      shout: ell(4, 92, 40, 40, "#8a1f2b", 6),
      smug: P("M-56,66 q60,52 116,-6 q-56,18 -116,6 z", "#fff", 6),
    })[e] || "";
  }
  if (e === "scared" || e === "shock" || o.sweat) s += P("M-92,-20 q-14,18 0,28 q14,-10 0,-28 z M96,-40 q-14,18 0,28 q14,-10 0,-28 z", "#7fd0ff", 4);
  return s;
}

function censor(x, y, label, sc, w = 240) {
  return g(`translate(${x} ${y}) scale(${sc})`,
    `<rect x="${-w / 2}" y="-58" width="${w}" height="116" rx="16" fill="url(#pix)" stroke="${O}" stroke-width="7"/>` +
    `<text x="0" y="28" font-size="84" fill="#ffd23f" text-anchor="middle" stroke="${O}" stroke-width="12" paint-order="stroke">${label}</text>`);
}

// rain cloud over an unlucky character
function rainCloud(x, y, t, sc = 1, bolt = false) {
  let s = "";
  for (let i = 0; i < 7; i++) {
    const px = -70 + i * 24 + ((i * 37) % 11), ph = ((t * 2.4 + i * 0.37) % 1);
    s += `<path d="M${px - ph * 10},${40 + ph * 150} l-10,28" stroke="#5fb4f0" stroke-width="8" stroke-linecap="round" opacity="${1 - ph * 0.6}"/>`;
  }
  s += P("M-80,30 q-50,0 -40,-40 q6,-36 50,-30 q14,-46 66,-40 q48,6 52,44 q44,-6 48,34 q2,32 -36,32 z", "#8d93a6", 6);
  if (bolt) s += P("M10,25 l-16,34 h18 l-14,36 l38,-48 h-20 l12,-22 z", "#ffd23f", 5);
  return g(`translate(${x} ${y}) scale(${sc})`, s);
}

// ---------- characters ----------
function hero(o) {
  const sk = "#f6c9a4", sh = "#d8e9f7", pa = "#4b4f63", t = o.t || 0;
  const A = {
    down: [[-205, -400], [-195, -265], [205, -400], [195, -265]],
    finger: [[-205, -400], [-195, -265], [255, -600], [250, -760]],
    point: [[-205, -400], [-195, -265], [300, -540], [440, -560]],
    fists: [[-265, -620], [-245, -790], [265, -620], [245, -790]],
    hips: [[-255, -430], [-172, -318], [255, -430], [172, -318]],
    flail: [[-290 + 40 * Math.sin(t * 14), -600], [-340, -770 + 70 * Math.sin(t * 17)], [290, -600 + 40 * Math.sin(t * 15)], [340, -770 + 70 * Math.cos(t * 16)]],
  }[o.pose || "down"];
  let s = "";
  // o.walk: walking phase in radians (legs swing); flail kicks on its own
  const kick = o.pose === "flail" ? 30 * Math.sin(t * 13) : o.walk !== undefined ? 34 * Math.sin(o.walk) : 0;
  s += P(`M-150,-260 L${-140 - kick},-30 L${-25 - kick},-30 L-15,-260 Z`, pa, 6) + P(`M150,-260 L${140 + kick},-30 L${25 + kick},-30 L15,-260 Z`, pa, 6);
  s += ell(-95 - kick, -12, 85, 30, O, 0) + ell(95 + kick, -12, 85, 30, O, 0);
  s += P("M-150,-575 Q-182,-570 -178,-520 L-160,-245 L160,-245 L178,-520 Q182,-570 150,-575 Z", sh, 6);
  s += `<rect x="-168" y="-278" width="336" height="36" rx="8" fill="#6b4a2b" stroke="${O}" stroke-width="5"/>`;
  s += P("M-48,-575 L0,-520 L48,-575 Z", "#fff", 5);
  s += P("M-14,-540 L-30,-400 L0,-370 L30,-400 L14,-540 Z", "#e8473b", 5, `transform="rotate(${8 + 4 * Math.sin(t * 3)} 0 -540)"`);
  s += `<rect x="-26" y="-612" width="52" height="52" fill="${sk}" stroke="${O}" stroke-width="5"/>`;
  const arm = (a, el, ha) => limb(`M${a[0]},${a[1]} Q${el[0]},${el[1]} ${ha[0]},${ha[1]}`, sh, 46) + circ(ha[0], ha[1], 30, sk, 6);
  s += arm([-160, -540], A[0], A[1]) + arm([160, -540], A[2], A[3]);
  if (o.pose === "finger") s += limb("M250,-780 L250,-850", sk, 20);
  if (o.pose === "point") s += limb("M466,-562 L530,-568", sk, 20);
  if (o.hold) s += holdProp(o.hold, A[3][0], A[3][1], t);
  if (o.bar) s += censor(0, -232, o.bar, o.barScale ?? 1);
  s += g(`translate(0 ${-700 + Math.sin(t * 2.2) * 3})`, heroHead(o));
  return g(`translate(${o.x} ${o.y}) rotate(${o.rot || 0}) scale(${o.s})`, s);
}

function brickHead(o) {
  const sk = "#c98a5e", t = o.t || 0, e = o.expr || "bored";
  const chew = o.chew ? Math.abs(Math.sin(t * 7)) : 0;
  let s = ell(0, 0, 76, 86, sk);
  s += P("M-74,-15 q-2,-90 74,-92 q76,2 74,92 q-20,-40 -74,-42 q-54,2 -74,42 z", O, 0);
  s += `<path d="M-50,-20 h100" stroke="${O}" stroke-width="15" stroke-linecap="round"/>`;
  if (e === "laugh") s += eyes("laugh", false, 0, sk, 4, 28, 0.62);
  else s += eyes(e === "smug" ? "smug" : "bored", blink(t, 1.9), e === "smug" ? -0.3 : 0.2, sk, 4, 28, 0.62);
  s += P("M-30,30 h2 M-16,36 h2 M14,36 h2 M28,30 h2 M-22,56 h2 M0,60 h2 M22,56 h2", "none", 0) +
       `<path d="M-30,30 h2 M-16,36 h2 M14,36 h2 M28,30 h2 M-22,56 h2 M0,60 h2 M22,56 h2" stroke="#7a4a2c" stroke-width="5" stroke-linecap="round"/>`;
  s += ell(2, 20, 11, 8, "#b9784d", 4);
  if (e === "smug") s += P("M-16,44 q22,10 40,-8", "none", 6);
  else s += ell(6, 44 + chew * 2, 16, 3 + chew * 6, "#5a1f24", 4);
  return s;
}

function brick(o) {
  const sk = "#c98a5e", t = o.t || 0;
  let s = "";
  s += P("M-170,-300 L-160,-30 L-30,-30 L-20,-300 Z", "#3a3f5c", 6) + P("M170,-300 L160,-30 L30,-30 L20,-300 Z", "#3a3f5c", 6);
  s += ell(-100, -12, 90, 30, O, 0) + ell(100, -12, 90, 30, O, 0);
  s += P("M-240,-660 Q-300,-640 -280,-560 L-190,-290 L190,-290 L280,-560 Q300,-640 240,-660 Q120,-700 40,-712 L-40,-712 Q-120,-700 -240,-660 Z", sk, 6);
  s += P("M-150,-662 Q-120,-560 -172,-300 L172,-300 Q120,-560 150,-662 Q0,-590 -150,-662 Z", "#fbfbf6", 6);
  s += `<rect x="-188" y="-322" width="376" height="38" rx="8" fill="${O}"/>`;
  s += `<path d="M-62,-655 q62,74 124,0" fill="none" stroke="#f2c14e" stroke-width="11" stroke-linecap="round"/>`;
  const A = { down: [[-330, -480], [-300, -300], [330, -480], [300, -300]], hips: [[-370, -470], [-205, -360], [370, -470], [205, -360]],
              nuts: [[-330, -480], [-300, -300], [340, -420], [180, -520]] }[o.pose || "down"];
  s += limb(`M-250,-620 Q${A[0][0]},${A[0][1]} ${A[1][0]},${A[1][1]}`, sk, 92) + circ(A[1][0], A[1][1], 44, sk, 6);
  if (o.pose === "nuts") s += g(`translate(205 -560) rotate(-14)`, P("M-44,-50 h88 l-8,110 h-72 z", "#ff7a59", 6) +
                                 `<text x="0" y="22" font-family="Sans" font-weight="900" font-size="26" fill="#fff" text-anchor="middle">NUTS</text>`);
  s += limb(`M250,-620 Q${A[2][0]},${A[2][1]} ${A[3][0]},${A[3][1]}`, sk, 92) + circ(A[3][0], A[3][1], 44, sk, 6);
  s += `<rect x="-36" y="-725" width="72" height="72" fill="${sk}" stroke="${O}" stroke-width="5"/>`;
  if (o.bar) s += censor(0, -262, o.bar, o.barScale ?? 1, 300);
  s += g(`translate(0 -800)`, brickHead(o));
  return g(`translate(${o.x} ${o.y}) scale(${o.s})`, s);
}

function captain(o) {
  const t = o.t || 0, tk = o.talk || 0, e = o.expr || "panic";
  const wave = Math.sin(t * 11) * 10;
  let s = "";
  s += P("M-42,-150 l-10,150 h40 l8,-150 z M42,-150 l10,150 h-40 l-8,-150 z", "#1f2a55", 6);
  s += P("M-52,-4 h48 v18 h-56 z M12,-4 h48 l8,18 h-56 z", O, 0);
  if (e === "laugh") {
    s += limb("M-62,-300 q-50,40 -10,110", "#24336e", 30) + limb("M62,-300 q50,40 10,110", "#24336e", 30);
  } else {
    s += limb(`M-62,-295 q-70,-40 ${-78 + wave},-140`, "#24336e", 30) + limb(`M62,-295 q70,-40 ${78 - wave},-140`, "#24336e", 30);
    s += circ(-140 + wave, -440, 24, "#f1bf96", 5) + circ(140 - wave, -440, 24, "#f1bf96", 5);
  }
  s += P("M-70,-320 q70,-30 140,0 l12,180 h-164 z", "#24336e", 6);
  s += P("M-25,-330 l25,70 l25,-70 z", "#fff", 4) + P("M-7,-315 l7,60 l7,-60 z", O, 0);
  s += `<rect x="-85" y="-328" width="40" height="16" rx="5" fill="#f2c14e" stroke="${O}" stroke-width="4"/><rect x="45" y="-328" width="40" height="16" rx="5" fill="#f2c14e" stroke="${O}" stroke-width="4"/>`;
  s += `<path d="M-70,-165 h152" stroke="#f2c14e" stroke-width="8"/><circle cx="20" cy="-215" r="6" fill="#f2c14e"/><circle cx="20" cy="-190" r="6" fill="#f2c14e"/>`;
  // head at (0,-410)
  let h = ell(0, 0, 70, 78, "#f1bf96") + ell(-68, 10, 14, 20, "#f1bf96", 4) + ell(68, 10, 14, 20, "#f1bf96", 4);
  h += g(`rotate(${e === "laugh" ? 0 : 14} 0 -70)`, P("M-62,-55 q0,-70 62,-72 q62,2 62,72 z", "#24336e", 6) + P("M-70,-55 h140 q6,14 -8,20 h-124 q-14,-6 -8,-20 z", O, 4) + circ(0, -87, 13, "#f2c14e", 4));
  if (e === "laugh") h += eyes("laugh", false, 0, "#f1bf96", -8, 26, 0.7);
  else h += ell(-26, -8, 20, 25, "#fff", 4) + `<circle cx="-24" cy="-6" r="6" fill="${O}"/>` + ell(26, -8, 20, 25, "#fff", 4) + `<circle cx="24" cy="-6" r="6" fill="${O}"/>` +
            `<path d="M-48,-42 l40,6 M48,-42 l-40,6" stroke="${O}" stroke-width="7" stroke-linecap="round"/>`;
  const open = e === "laugh" ? 0.8 : Math.max(0.25, tk);
  h += ell(0, 52 + 12 * open, 26 + 6 * open, 10 + 30 * open, "#8a1f2b", 4) + `<ellipse cx="0" cy="${60 + 26 * open}" rx="14" ry="${4 + 9 * open}" fill="#ef7d8a"/>`;
  h += P("M-48,38 q22,-22 48,-8 q26,-14 48,8 q-14,14 -48,6 q-34,8 -48,-6 z", "#7b4a2b", 4) + ell(0, 18, 12, 9, "#e9a87c", 4);
  s += g("translate(0 -410)", h);
  return g(`translate(${o.x} ${o.y}) scale(${o.s})`, s);
}

// things a hand can hold (drawn at the hand point)
function holdProp(kind, x, y, t = 0) {
  if (kind === "icecream") return iceCream(x + 10, y - 40, 1);
  if (kind === "tickets") return g(`translate(${x + 20} ${y - 50}) rotate(-12)`, ticket(0, 0) + ticket(22, 16));
  if (kind === "popcorn") return popcorn(x + 10, y - 60, 1);
  return "";
}
function iceCream(x, y, s = 1) {
  return g(`translate(${x} ${y}) scale(${s})`, P("M-26,0 L0,70 L26,0 Z", "#e8b46a", 5) + `<path d="M-16,12 l24,30 M2,8 l14,22 M-8,4 l-10,14" stroke="#b8833f" stroke-width="3"/>` +
    circ(0, -18, 28, "#ffb3c7", 5) + circ(-12, -44, 18, "#fff3d6", 4) + circ(14, -46, 16, "#9fdcb4", 4) + circ(6, -66, 7, "#e8473b", 3));
}
function ticket(x, y) {
  return g(`translate(${x} ${y})`, P("M-50,-26 h100 v14 a10,10 0 0,0 0,24 v14 h-100 v-14 a10,10 0 0,0 0,-24 z", "#ffd23f", 5) +
    `<text x="0" y="9" font-family="Sans" font-weight="900" font-size="20" fill="${O}" text-anchor="middle">ADMIT 1</text>`);
}
function popcorn(x, y, s = 1) {
  let k = "";
  for (let i = 0; i < 9; i++) k += circ(-30 + (i % 5) * 15, -6 - Math.floor(i / 5) * 16 - (i % 2) * 6, 13, "#fff6d8", 3);
  return g(`translate(${x} ${y}) scale(${s})`, k + P("M-42,0 h84 l-10,90 h-64 z", "#fff", 5) +
    `<path d="M-26,2 l6,86 M0,2 v88 M26,2 l-6,86" stroke="#e8473b" stroke-width="12"/>` + P("M-42,0 h84 l-10,90 h-64 z", "none", 5));
}

// police officer, full body, same scale as hero(): feet on (x, y), head near -700
function cop(o) {
  const t = o.t || 0, e = o.expr || "calm", tk = o.talk || 0, sk = "#e9b48c", nv = "#1d2b52";
  const shakeFist = Math.sin(t * 22) * 14;
  const A = {
    down: [[-205, -400], [-195, -265], [205, -400], [195, -265]],
    point: [[-205, -400], [-195, -265], [300, -540], [440, -560]],
    fist: [[-205, -400], [-195, -265], [270, -600], [255 + shakeFist, -770]],
    stop: [[-205, -400], [-195, -265], [280, -560], [380, -700]],
  }[o.pose || "down"];
  let s = "";
  s += P("M-150,-260 L-140,-30 L-25,-30 L-15,-260 Z", nv, 6) + P("M150,-260 L140,-30 L25,-30 L15,-260 Z", nv, 6);
  s += ell(-95, -12, 85, 30, O, 0) + ell(95, -12, 85, 30, O, 0);
  s += P("M-150,-575 Q-182,-570 -178,-520 L-160,-245 L160,-245 L178,-520 Q182,-570 150,-575 Z", nv, 6);
  s += `<rect x="-168" y="-282" width="336" height="40" rx="8" fill="${O}"/><rect x="-22" y="-278" width="44" height="32" rx="5" fill="#c9ccd6" stroke="${O}" stroke-width="4"/>`;
  s += P("M-48,-575 L0,-525 L48,-575 Z", "#c9d6ea", 5) + `<path d="M0,-525 V-290" stroke="${O}" stroke-width="5"/><circle cx="0" cy="-470" r="6" fill="#c9ccd6"/><circle cx="0" cy="-400" r="6" fill="#c9ccd6"/>`;
  const star = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 14 : 34; return `${(-90 + Math.cos(a) * r).toFixed(1)},${(-470 + Math.sin(a) * r).toFixed(1)}`; }).join(" ");
  s += `<polygon points="${star}" fill="#f2c14e" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>`;
  s += `<rect x="100" y="-560" width="40" height="60" rx="8" fill="${O}"/><path d="M128,-560 v-34" stroke="${O}" stroke-width="6" stroke-linecap="round"/>`;
  s += `<rect x="-26" y="-612" width="52" height="52" fill="${sk}" stroke="${O}" stroke-width="5"/>`;
  const arm = (a, el, ha) => limb(`M${a[0]},${a[1]} Q${el[0]},${el[1]} ${ha[0]},${ha[1]}`, nv, 46) + circ(ha[0], ha[1], 30, sk, 6);
  s += arm([-160, -540], A[0], A[1]) + arm([160, -540], A[2], A[3]);
  if (o.pose === "point") s += limb("M466,-562 L530,-568", sk, 20);
  if (o.pose === "stop") s += P("M350,-740 h60 v60 h-60 z", sk, 0);
  // head
  let h = ell(-92, 10, 16, 24, sk) + ell(92, 10, 16, 24, sk) + ell(0, 0, 92, 104, sk);
  if (e === "angry") h += P("M-66,-46 L-14,-26 M14,-26 L66,-46", "none", 10);
  else if (e === "shock") h += P("M-66,-62 q22,-20 48,-8 M18,-70 q26,-12 48,8", "none", 8);
  else h += P("M-64,-44 q22,-10 46,-2 M18,-46 q24,-8 46,2", "none", 8);
  h += o.glasses ? P("M-74,-24 h60 q4,36 -30,36 q-32,0 -30,-36 z M14,-24 h60 q4,36 -30,36 q-32,0 -30,-36 z", O, 4) + `<path d="M-14,-18 h28" stroke="${O}" stroke-width="6"/>`
                 : eyes(e === "shock" ? "shock" : "n", blink(t, 2.4), 0, sk, -10, 38, 0.8);
  h += P("M0,6 q-18,26 -6,40 q12,8 24,0 q6,-14 -18,-40 z", "#d99a72", 4);
  const open = tk > 0.12 ? tk : e === "angry" ? 0.35 : 0;
  if (open) h += ell(0, 78, 24 + 8 * open, 8 + 26 * open, "#8a1f2b", 4);
  else h += P("M-24,80 q24,8 48,0", "none", 6);
  h += P("M-52,60 q26,-20 52,-6 q26,-14 52,6 q-16,14 -52,6 q-36,8 -52,-6 z", "#4a2f1d", 4);
  h += P("M-104,-82 q0,-84 104,-86 q104,2 104,86 z", nv, 6) + `<rect x="-106" y="-88" width="212" height="26" fill="${O}"/>`;
  h += P("M-96,-62 q96,40 192,0 l8,12 q-104,48 -208,0 z", O, 4) + circ(0, -118, 16, "#f2c14e", 4);
  if (e === "angry") h += `<ellipse cx="0" cy="-10" rx="80" ry="70" fill="#ff3b3b" opacity=".18"/>`;
  s += g(`translate(0 ${-700 + Math.sin(t * 2.1) * 3})`, h);
  return g(`translate(${o.x} ${o.y}) scale(${o.s})`, s);
}

// penguin, front view: feet on (x, y), about 380 tall at s = 1
function penguin(o) {
  const t = o.t || 0, wad = o.waddle ? Math.sin(t * 9) * 7 : 0, flap = o.flap ? Math.sin(t * 16) * 22 : 0;
  let s = "";
  s += ell(-44, -6, 40, 15, "#ff9a2e", 5) + ell(44, -6, 40, 15, "#ff9a2e", 5);
  s += g(`rotate(${-18 - flap} -96 -200)`, ell(-96, -150, 24, 82, "#20202a", 6));
  s += g(`rotate(${18 + flap} 96 -200)`, ell(96, -150, 24, 82, "#20202a", 6));
  s += ell(0, -180, 108, 170, "#20202a", 6) + ell(0, -150, 78, 128, "#fbfbf6", 0);
  s += P("M-78,-150 q0,-130 78,-132 q78,2 78,132", "none", 0);
  const pupil = o.look ?? 0;
  if (o.glasses) s += P("M-64,-282 h54 q4,40 -26,40 q-30,0 -28,-40 z M10,-282 h54 q4,40 -26,40 q-30,0 -28,-40 z", O, 4) + `<path d="M-10,-276 h20" stroke="${O}" stroke-width="6"/>`;
  else if (o.expr === "happy") s += P("M-56,-262 q18,-20 36,0 M20,-262 q18,-20 36,0", "none", 7);
  else s += ell(-34, -264, 20, 24, "#fff", 5) + circ(-34 + pupil * 8, -260, 9, O, 0) + ell(34, -264, 20, 24, "#fff", 5) + circ(34 + pupil * 8, -260, 9, O, 0);
  s += P("M-24,-226 q24,-14 48,0 q-24,26 -48,0 z", "#ff9a2e", 5);
  s += ell(-56, -214, 14, 9, "#ffb3c7", 0) + ell(56, -214, 14, 9, "#ffb3c7", 0);
  if (o.hold === "icecream") s += iceCream(112, -230, 0.9);
  if (o.hold === "tickets") s += g("translate(120 -230) rotate(-14) scale(0.9)", ticket(0, 0) + ticket(22, 16));
  if (o.hold === "popcorn") s += popcorn(116, -200, 0.85);
  return g(`translate(${o.x} ${o.y}) rotate(${wad}) scale(${o.s})`, s);
}

// parrot on a perch: feet on (x, y), ~320 tall at s = 1. expr: neutral, angry, polite, shock. o.frozen: blue + icicles + shiver
function parrot(o) {
  const t = o.t || 0, tk = o.talk || 0, e = o.expr || "neutral";
  const fz = o.frozen ? 1 : 0, sh = fz ? Math.sin(t * 60) * 4 : 0, ruff = e === "angry" ? Math.sin(t * 30) * 3 : 0;
  const G = fz ? "#7fb8c9" : "#2fb34a", G2 = fz ? "#5f97ab" : "#1f8a38", R = fz ? "#9fc6d8" : "#e8473b";
  let s = "";
  s += P("M-30,-60 q-40,90 -20,170 l30,-10 q-10,-80 20,-150 z", fz ? "#6aa3b8" : "#3f6fd8", 5);
  s += P("M-10,-60 q-10,100 20,160 l26,-14 q-30,-70 -16,-140 z", R, 5);
  s += ell(0, -120, 72, 108, G, 6) + ell(10, -100, 44, 70, fz ? "#cfe6ee" : "#ffd23f", 0);
  const wing = o.wing === "chest" ? 'rotate(-40 -20 -170) translate(30 -10)' : o.wing === "up" ? `rotate(${-70 + Math.sin(t * 18) * 15} -20 -170)` : `rotate(${8 + ruff} -20 -170)`;
  s += g(wing, P("M-20,-180 q-60,30 -50,120 q30,30 50,10 q20,-60 0,-130 z", G2, 5) + P("M-62,-80 q20,24 40,12", "none", 4));
  // head
  let h = circ(0, 0, 66, G, 6);
  h += P("M-20,-58 l-14,-44 l26,30 l2,-46 l18,44 l18,-36 l-4,48 z", R, 5);
  h += ell(24, -8, 28, 26, "#fff", 4);
  if (e === "polite") h += P("M10,-8 q14,10 28,0", "none", 6) + ell(36, 22, 12, 7, "#ffb3c7", 0);
  else if (e === "shock") h += circ(26, -8, 10, O, 0);
  else h += circ(30, -6, 8, O, 0);
  if (e === "angry") h += P("M2,-36 L50,-20", "none", 9);
  if (e === "shock") h += P("M4,-44 q20,-12 44,2", "none", 7);
  const open = Math.max(tk, e === "angry" ? 0.3 : 0);
  h += g(`rotate(${open * 26} 48 22)`, P("M46,20 q30,4 38,24 q-22,8 -42,-6 z", fz ? "#b8c6cc" : "#d8a43c", 5));
  h += P("M44,-30 q56,-8 60,46 q-16,-26 -46,-16 q-12,-10 -14,-30 z", fz ? "#c9d4d8" : "#f2c14e", 5);
  if (fz) h += P("M70,46 l-6,26 l-6,-24 M86,40 l-4,18 l-6,-16", "#e8fbff", 3);
  s += g(`translate(${8 + ruff} -236)`, h);
  s += P("M-30,-12 q-10,14 -24,16 M-16,-12 q-4,16 -10,20 M18,-12 q10,14 24,16 M30,-12 q6,16 14,18", "none", 7);
  if (fz) s += `<ellipse cx="0" cy="-150" rx="110" ry="190" fill="#bfe9ff" opacity=".25"/>` + P("M-40,-20 l-6,30 l-6,-28 M40,-30 l-5,24 l-6,-22", "#e8fbff", 3);
  return g(`translate(${o.x + sh} ${o.y}) scale(${o.s})`, s);
}

// round birdcage drawn over the bird: centre bottom on (x, y)
function cage(x, y, s = 1, front = true) {
  let k = "";
  if (!front) return g(`translate(${x} ${y}) scale(${s})`, ell(0, -10, 190, 24, "#c9a04a", 6) + `<path d="M-150,-300 h300" stroke="#8a6a2a" stroke-width="14" stroke-linecap="round"/>`);
  for (let i = -4; i <= 4; i++) k += `<path d="M${i * 40},-10 V-400 Q${i * 20},-520 0,-540" fill="none" stroke="#c9a04a" stroke-width="6"/>`;
  return g(`translate(${x} ${y}) scale(${s})`, k + `<path d="M-180,-400 h360" stroke="#c9a04a" stroke-width="8"/>` + circ(0, -556, 18, "#c9a04a", 5));
}

// kitchen wall, window, counter, floor
function kitchen(t) {
  let s = `<rect x="-400" y="-400" width="1880" height="2720" fill="#f6e6c8"/>`;
  for (let y = 1000; y < 1560; y += 70) for (let x = -70 + ((y / 70) % 2) * 35; x < 1150; x += 70) s += `<rect x="${x}" y="${y}" width="66" height="66" fill="#fff8ea" stroke="#e6d3b0" stroke-width="3"/>`;
  s += `<rect x="60" y="300" width="300" height="360" fill="url(#sky)" stroke="${O}" stroke-width="8"/><path d="M210,300 V660 M60,480 H360" stroke="${O}" stroke-width="8"/>`;
  s += P("M40,290 h340 l-20,40 h-300 z", "#e8473b", 6);
  s += `<rect x="-400" y="1560" width="1880" height="900" fill="#b88a5e" stroke="${O}" stroke-width="6"/>`;
  for (let x = -400; x < 1500; x += 160) s += `<path d="M${x},1560 v900" stroke="#a27650" stroke-width="4"/>`;
  s += `<rect x="-40" y="1180" width="560" height="380" fill="#8fb7d8" stroke="${O}" stroke-width="6"/><rect x="-60" y="1150" width="600" height="40" rx="8" fill="#e9e2d2" stroke="${O}" stroke-width="6"/>`;
  s += `<rect x="60" y="1250" width="160" height="240" rx="8" fill="#a5c8e4" stroke="${O}" stroke-width="5"/><rect x="260" y="1250" width="160" height="240" rx="8" fill="#a5c8e4" stroke="${O}" stroke-width="5"/>`;
  return s;
}

// tall fridge, freezer on top. open: 0..1 swings the freezer door; inside shows a frozen chicken
function fridge(x, y, s = 1, open = 0, t = 0) {
  let k = `<rect x="0" y="-980" width="380" height="980" rx="30" fill="#eef1f5" stroke="${O}" stroke-width="7"/>`;
  k += `<path d="M0,-650 H380" stroke="${O}" stroke-width="6"/><rect x="330" y="-560" width="18" height="200" rx="8" fill="#c9ced8" stroke="${O}" stroke-width="4"/>`;
  if (open > 0) {
    k += `<rect x="18" y="-962" width="344" height="296" rx="12" fill="#cfefff" stroke="${O}" stroke-width="5"/><path d="M18,-810 H362" stroke="#9fc7de" stroke-width="8"/>`;
    k += frozenChicken(190, -700, 0.9);
    for (let i = 0; i < 5; i++) { const a = ((t * 0.7 + i * 0.2) % 1); k += `<ellipse cx="${190 + Math.sin(i * 3) * 120 + a * 60}" cy="${-700 + a * 160}" rx="${60 + a * 70}" ry="${26 + a * 30}" fill="#fff" opacity="${(0.55 * (1 - a) * open).toFixed(2)}"/>`; }
  }
  const w = 380 * (1 - open * 0.92);
  k += `<rect x="${380 - w}" y="-980" width="${w}" height="330" rx="${Math.min(30, w / 2)}" fill="#f7f9fb" stroke="${O}" stroke-width="7"/>`;
  if (open < 0.5) k += `<rect x="${380 - w + 24}" y="-830" width="18" height="140" rx="8" fill="#c9ced8" stroke="${O}" stroke-width="4"/>`;
  return g(`translate(${x} ${y}) scale(${s})`, k);
}

function frozenChicken(x, y, s = 1) {
  return g(`translate(${x} ${y}) scale(${s})`,
    P("M-100,10 q-10,-90 90,-100 q110,0 110,80 q0,60 -100,64 q-90,0 -100,-44 z", "#f4c9a0", 6) +
    P("M80,-30 q60,-30 80,-10 q10,20 -16,28 q-20,-10 -54,6 z", "#f4c9a0", 5) + circ(162, -12, 14, "#fff", 4) +
    P("M-80,20 q-60,10 -70,40 q20,16 40,0 q10,-24 40,-26 z", "#f4c9a0", 5) + circ(-150, 62, 14, "#fff", 4) +
    `<path d="M-60,-40 q30,-20 60,-10 M0,-60 q40,-10 70,10" stroke="#d9a77a" stroke-width="5" fill="none"/>` +
    `<rect x="-120" y="-110" width="300" height="190" rx="30" fill="#bfe9ff" opacity=".35" stroke="#e8fbff" stroke-width="4"/>` +
    P("M-60,74 l-6,24 l-6,-22 M20,80 l-5,20 l-6,-18 M100,70 l-5,20 l-6,-18", "#e8fbff", 3));
}

// generic passenger bust (head centre at 0,0)
function passenger(o) {
  const { skin = "#f3cfb2", hair = "#6b3e26", style = "short", shirt = "#9ad17a", expr = "neutral", t = 0, seed = 0 } = o;
  const bob = expr === "laugh" ? Math.abs(Math.sin(t * 12 + seed)) * -14 : 0;
  let s = P("M-110,190 q0,-90 110,-90 q110,0 110,90 v200 h-220 z", shirt, 6);
  let h = "";
  if (style === "afro") h += circ(0, -30, 92, hair, 6);
  if (style === "bun") h += circ(0, -86, 30, hair, 6);
  h += ell(0, 0, 70, 78, skin);
  if (style === "short") h += P("M-68,-20 q0,-62 68,-64 q68,2 68,64 q-30,-30 -68,-30 q-38,0 -68,30 z", hair, 6);
  if (style === "bun") h += P("M-68,-10 q0,-62 68,-64 q68,2 68,64 q-34,-40 -68,-40 q-34,0 -68,40 z", hair, 6);
  if (style === "cap") h += P("M-70,-20 q0,-66 70,-66 q70,0 70,66 z", "#e8473b", 6) + P("M10,-26 h90 q6,12 -6,16 h-84 z", "#c43a30", 5);
  if (expr === "laugh") {
    h += eyes("laugh", false, 0, skin, -6, 26, 0.7) + P("M-32,26 h64 q0,44 -32,44 q-32,0 -32,-44 z", "#8a1f2b", 5);
  } else if (expr === "shock") {
    h += eyes("shock", false, 0, skin, -6, 26, 0.75) + ell(0, 44, 14, 20, "#8a1f2b", 5);
  } else if (expr === "pray") {
    h += eyes("closed", false, 0, skin, -6, 26, 0.7) + P("M-12,38 q12,7 24,0", "none", 5);
  } else {
    h += eyes("n", blink(t, seed), 0, skin, -6, 26, 0.7) + P("M-18,38 q18,8 36,0", "none", 6);
  }
  if (o.glasses) h += `<circle cx="-26" cy="-6" r="22" fill="none" stroke="${O}" stroke-width="4"/><circle cx="26" cy="-6" r="22" fill="none" stroke="${O}" stroke-width="4"/>`;
  s += g(`translate(0 ${bob})`, h);
  return g(`translate(${o.x} ${o.y}) scale(${o.s})`, s);
}

// ---------- sets ----------
function cabin(t) {
  const st = ((t * 1.7) % 1) * 120;
  let s = `<polygon points="0,0 1080,0 700,470 380,470" fill="url(#ceil)" stroke="${O}" stroke-width="4"/>
    <polygon points="0,0 380,470 380,1010 0,1540" fill="url(#wallL)" stroke="${O}" stroke-width="4"/>
    <polygon points="1080,0 700,470 700,1010 1080,1540" fill="url(#wallR)" stroke="${O}" stroke-width="4"/>
    <polygon points="0,1540 380,1010 700,1010 1080,1540 1080,2300 0,2300" fill="url(#floor)" stroke="${O}" stroke-width="4"/>
    <polygon points="470,1010 610,1010 800,2300 280,2300" fill="#4a57a0" opacity=".55"/>
    <rect x="380" y="470" width="320" height="540" fill="#eadcc4" stroke="${O}" stroke-width="4"/>
    <rect x="465" y="560" width="150" height="450" rx="10" fill="#d4c4a6" stroke="${O}" stroke-width="4"/>
    <rect x="505" y="600" width="70" height="44" rx="8" fill="#9fd3f2" stroke="${O}" stroke-width="4"/>
    <rect x="455" y="482" width="170" height="54" rx="12" fill="${O}"/>
    <rect x="463" y="490" width="154" height="38" rx="8" fill="${(t % 0.8) < 0.4 ? "#ff4b3e" : "#8a2a24"}"/>
    <text x="540" y="518" font-family="Sans" font-weight="900" font-size="22" fill="#fff" text-anchor="middle" letter-spacing="2">BRACE! BRACE!</text>`;
  for (const [x, y, rx, ry] of [[110, 700, 58, 84], [262, 770, 40, 60], [970, 700, 58, 84], [818, 770, 40, 60]]) {
    s += `<clipPath id="w${x}"><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/></clipPath>` + ell(x, y, rx, ry, "url(#sky)", 6);
    let streaks = "";
    for (let k = -1; k < 3; k++) streaks += `<path d="M${x - rx * 0.4},${y + ry - st + k * 120} v-50 M${x + rx * 0.2},${y + ry * 1.4 - st + k * 120} v-70" stroke="#fff" stroke-width="${rx / 6}" stroke-linecap="round"/>`;
    s += `<g clip-path="url(#w${x})">${streaks}</g>`;
  }
  s += `<polygon points="0,110 380,470 380,520 0,330" fill="#f1e9dc" stroke="${O}" stroke-width="4"/><polygon points="1080,110 700,470 700,520 1080,330" fill="#ebe1d0" stroke="${O}" stroke-width="4"/>`;
  for (const [x, y, L, ph] of [[150, 290, 140, 0], [300, 400, 100, 1.3], [930, 290, 140, 2.1], [790, 400, 100, 0.6]]) {
    s += g(`rotate(${Math.sin(t * 3 + ph) * 12} ${x} ${y})`, `<path d="M${x},${y} q-12,${L * 0.3} 4,${L * 0.55} q14,${L * 0.25} -4,${L}" fill="none" stroke="${O}" stroke-width="4"/>` + P(`M${x - 22},${y + L} h44 l-6,34 h-32 z`, "#ffd23f", 4));
  }
  s += `<g fill="url(#seat)" stroke="${O}" stroke-width="4"><rect x="250" y="880" width="110" height="190" rx="22"/><rect x="720" y="880" width="110" height="190" rx="22"/></g>`;
  return s;
}
const seatBack = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="56" fill="url(#seat)" stroke="${O}" stroke-width="6"/><rect x="${x + 36}" y="${y + 12}" width="${w - 72}" height="80" rx="24" fill="#f4f1ea" stroke="${O}" stroke-width="4"/>`;

function sky(t, speed = 1, dark = 0) {
  let s = `<rect x="-400" y="-400" width="1880" height="2720" fill="url(#skyBig)"/>`;
  const cl = [[100, 300, 1.2], [700, 520, 0.9], [300, 900, 1.4], [900, 1200, 1.1], [150, 1500, 1.0], [650, 1750, 1.3]];
  for (const [x, y, sc] of cl) {
    const xx = ((x - t * 260 * speed * sc) % 1500 + 1500) % 1500 - 210;
    s += g(`translate(${xx} ${y}) scale(${sc})`, `<path d="M-90,30 q-50,0 -40,-40 q6,-36 50,-30 q14,-46 66,-40 q48,6 52,44 q44,-6 48,34 q2,32 -36,32 z" fill="#fff" opacity=".95"/>`);
  }
  if (dark) s += `<rect x="-400" y="-400" width="1880" height="2720" fill="#3b2a5a" opacity="${dark}"/>`;
  return s;
}

function plane(o) {
  const { x, y, s = 1, ang = 0, t = 0, smoke = 0, face = "sad" } = o;
  let p = "";
  if (smoke) for (let k = 0; k < 9; k++) {
    const age = ((t * 1.3 + k / 9) % 1);
    p += circ(-60 - age * 620, 90 - age * 40 + Math.sin(k * 3) * 20, (24 + 80 * age), k % 2 ? "#4a4458" : "#6d6680", 5);
  }
  p += P("M-80,30 L60,30 L-110,190 L-190,190 Z", "#c7cbd6", 6);
  p += P("M-330,-10 L-300,-60 L-240,-60 L-300,-200 L-360,-200 Z", "#ff6a55", 6);
  p += P("M-340,-60 L250,-60 Q330,-58 345,0 Q330,58 250,60 L-300,60 Q-350,40 -340,-60 Z", "#fff", 7);
  p += `<path d="M-330,22 L330,22" stroke="#3f5bd1" stroke-width="16"/>`;
  p += P("M270,-48 Q320,-40 330,-8 L270,-8 Z", "#6fc3f0", 5);
  for (let i = 0; i < 7; i++) {
    const wx = -240 + i * 70;
    p += ell(wx, -18, 20, 22, "#bfe6ff", 5);
    if (i === 4) p += g(`translate(${wx} -16) scale(0.13)`, heroHead({ expr: face, t }));
  }
  p += ell(-20, 92, 70, 30, "#9aa0b2", 6);
  if (o.fire) p += g(`translate(-90 92) scale(${o.fire})`, P("M0,-60 L30,-20 L80,-40 L50,0 L90,30 L35,25 L20,70 L0,30 L-30,70 L-30,20 L-80,30 L-40,0 L-90,-40 L-30,-20 Z", "#ffb020", 6) + P("M0,-30 L15,-10 L40,-20 L25,0 L45,15 L15,12 L0,35 L-12,12 L-40,15 L-20,0 L-40,-20 L-12,-10 Z", "#ff5a2a", 0));
  return g(`translate(${x} ${y}) rotate(${ang}) scale(${s})`, p);
}

function street(t) {
  let s = `<rect x="-400" y="-400" width="1880" height="2720" fill="url(#skyBig)"/>`;
  s += g(`translate(860 380) rotate(${t * 20})`, Array.from({ length: 12 }, (_, i) => `<path d="M0,0 L${Math.cos(i * Math.PI / 6) * 300},${Math.sin(i * Math.PI / 6) * 300}" stroke="#fff3b0" stroke-width="26" opacity=".5"/>`).join("")) + circ(860, 380, 110, "#ffd23f", 7);
  const bld = [[-40, 900, 220, "#8fa3d8"], [170, 760, 180, "#a9b7e6"], [340, 980, 200, "#7c8fcf"], [590, 820, 240, "#97a9e0"], [820, 940, 260, "#8496d6"]];
  for (const [x, y, w, c] of bld) {
    s += `<rect x="${x}" y="${y}" width="${w}" height="1000" fill="${c}" stroke="${O}" stroke-width="5"/>`;
    for (let r = 0; r < 6; r++) for (let q = 0; q < Math.floor(w / 70); q++) s += `<rect x="${x + 25 + q * 70}" y="${y + 40 + r * 90}" width="34" height="48" fill="#e8f2ff" stroke="${O}" stroke-width="3"/>`;
  }
  s += `<rect x="-400" y="1500" width="1880" height="900" fill="#cfc6b8" stroke="${O}" stroke-width="6"/>`;
  s += `<rect x="-400" y="1500" width="1880" height="40" fill="#b5ab9b"/>`;
  return s;
}

function bubble(x, y, w, h, text, size, tx, ty, sc = 1, jag = false) {
  let b;
  if (jag) {
    const pts = [];
    for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, r = i % 2 ? 0.78 : 1.0; pts.push(`${(Math.cos(a) * w / 2 * r).toFixed(0)},${(Math.sin(a) * h / 2 * r).toFixed(0)}`); }
    b = `<polygon points="${pts.join(" ")}" fill="#fff" stroke="${O}" stroke-width="7" stroke-linejoin="round"/>`;
  } else b = ell(0, 0, w / 2, h / 2, "#fff", 7);
  const tail = P(`M${-w * 0.08},${h * 0.3} L${tx - x},${ty - y} L${w * 0.1},${h * 0.32} Z`, "#fff", 7) + P(`M${-w * 0.07},${h * 0.27} L${tx - x - 4},${ty - y - 10} L${w * 0.09},${h * 0.29} Z`, "#fff", 0);
  const lines = text.split("|");
  const tt = lines.map((l, i) => `<text x="0" y="${(i - (lines.length - 1) / 2) * size * 1.08 + size * 0.36}" font-size="${size}" fill="${O}" text-anchor="middle">${l}</text>`).join("");
  return g(`translate(${x} ${y}) scale(${sc})`, tail + b + tail.replace(/stroke-width="7"/g, 'stroke-width="0"') + tt);
}


const DEFS = `<defs>
  <linearGradient id="wallL" x1="0" x2="1"><stop offset="0" stop-color="#e9d9bd"/><stop offset="1" stop-color="#f6ecdb"/></linearGradient>
  <linearGradient id="wallR" x1="1" x2="0"><stop offset="0" stop-color="#e3d2b4"/><stop offset="1" stop-color="#f6ecdb"/></linearGradient>
  <linearGradient id="ceil" y1="0" y2="1"><stop offset="0" stop-color="#fbf5ea"/><stop offset="1" stop-color="#efe4d1"/></linearGradient>
  <linearGradient id="floor" y1="0" y2="1"><stop offset="0" stop-color="#3a4688"/><stop offset="1" stop-color="#232a5c"/></linearGradient>
  <linearGradient id="sky" y1="0" y2="1"><stop offset="0" stop-color="#5fb4f0"/><stop offset="1" stop-color="#bfe6ff"/></linearGradient>
  <linearGradient id="skyBig" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1920"><stop offset="0" stop-color="#4aa8ef"/><stop offset="1" stop-color="#cdeeff"/></linearGradient>
  <linearGradient id="seat" y1="0" y2="1"><stop offset="0" stop-color="#4a68e0"/><stop offset="1" stop-color="#2f46a8"/></linearGradient>
  <radialGradient id="alarm" cx="0.5" cy="0.1" r="0.8"><stop offset="0" stop-color="#ff3030" stop-opacity=".30"/><stop offset="1" stop-color="#ff3030" stop-opacity="0"/></radialGradient>
  <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1a0f2e" stop-opacity=".45"/></radialGradient>
  <pattern id="pix" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#2b2b33"/><rect width="20" height="20" fill="#45454f"/><rect x="20" y="20" width="20" height="20" fill="#3a3a44"/></pattern>
</defs>`;

// ---------- channel look ----------
(() => {
  const css = {
    notebook: `@font-face{font-family:Hand;src:url("../fonts/patrick-hand.woff2")} text{font-family:Hand!important}
      .cap{font-family:Hand!important;font-weight:400!important;color:#1d3a8f!important;-webkit-text-stroke:14px #fbf7ea!important;
           text-shadow:none!important;font-size:100px!important} .cap b{color:#d0312d!important}`,
    silent: `@font-face{font-family:Lime;src:url("../fonts/limelight.woff2")} text{font-family:Lime!important}
      .cap{font-family:Lime!important;font-weight:400!important;color:#f1f1ee!important;-webkit-text-stroke:0!important;text-shadow:none!important;
           background:#0b0b0b;border:7px double #f1f1ee;padding:22px 20px 14px;font-size:70px!important;line-height:1.15!important}
      .cap:empty{display:none} .cap b{color:#f1f1ee!important}`,
    chalk: `@font-face{font-family:Sketch;src:url("../fonts/cabin-sketch-700.woff2")} text{font-family:Sketch!important}
      .cap{font-family:Sketch!important;color:#f6f3ea!important;-webkit-text-stroke:14px #2c4437!important;text-shadow:none!important}
      .cap b{color:#ffe08a!important}`,
  }[STYLE];
  const el = document.createElement("style");
  el.textContent = `@font-face{font-family:Lime;src:url("../fonts/limelight.woff2")}` + (css || "");
  document.head.appendChild(el);
})();

function stylize(inner, t) {
  const f = Math.floor(t * 8), fr = Math.floor(t * 30); // lines "boil" 8 times a second, like hand-drawn animation
  const rnd = (k) => { const x = Math.sin(fr * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
  if (STYLE === "notebook") {
    let s = `<defs><filter id="boil" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="${f % 6}"/>
      <feDisplacementMap in="SourceGraphic" scale="10" xChannelSelector="R" yChannelSelector="G"/><feColorMatrix type="saturate" values="0.8"/></filter></defs>`;
    s += `<rect width="1080" height="1920" fill="#fbf7ea"/>`;
    for (let y = 150; y < 1920; y += 60) s += `<path d="M0,${y} H1080" stroke="#a9c3e8" stroke-width="2.5"/>`;
    s += `<path d="M130,0 V1920" stroke="#e79a9a" stroke-width="3"/>`;
    return s + `<g filter="url(#boil)" style="mix-blend-mode:multiply" opacity="0.94">${inner}</g>`;
  }
  if (STYLE === "silent") {
    const jx = (rnd(1) - 0.5) * 4, jy = (rnd(2) - 0.5) * 6;
    let s = `<defs><filter id="bw"><feColorMatrix type="matrix" values="0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0 0 0 1 0"/>
      <feComponentTransfer><feFuncR type="gamma" amplitude="1.08" exponent="0.78" offset="0.03"/><feFuncG type="gamma" amplitude="1.08" exponent="0.78" offset="0.03"/><feFuncB type="gamma" amplitude="1.08" exponent="0.78" offset="0.03"/></feComponentTransfer></filter>
      <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="${fr % 50}"/><feColorMatrix type="saturate" values="0"/></filter>
      <radialGradient id="vigHard" cx="0.5" cy="0.5" r="0.72"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient></defs>`;
    s += `<g filter="url(#bw)" transform="translate(${jx} ${jy})">${inner}</g>`;
    s += `<rect width="1080" height="1920" filter="url(#grain)" opacity="0.25" style="mix-blend-mode:overlay"/>`;
    if (rnd(4) < 0.5) s += `<path d="M${(rnd(5) * 1080).toFixed(0)},0 v1920" stroke="#fff" stroke-width="${(1 + rnd(6) * 2).toFixed(1)}" opacity="${(0.25 + rnd(7) * 0.3).toFixed(2)}"/>`;
    for (let k = 0; k < 3; k++) if (rnd(10 + k) < 0.4) s += `<circle cx="${(rnd(20 + k) * 1080).toFixed(0)}" cy="${(rnd(30 + k) * 1920).toFixed(0)}" r="${(2 + rnd(40 + k) * 5).toFixed(1)}" fill="#1a120a" opacity=".6"/>`;
    s += `<rect width="1080" height="1920" fill="#000" opacity="${(0.09 * rnd(3)).toFixed(3)}"/><rect width="1080" height="1920" fill="url(#vigHard)"/>`;
    return s + irisEnd(t, true);
  }
  if (STYLE === "chalk") {
    let s = `<defs><filter id="chalk" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="${f % 6}" result="w"/>
      <feDisplacementMap in="SourceGraphic" in2="w" scale="8" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feColorMatrix in="d" type="saturate" values="0.5" result="c"/>
      <feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="1" seed="3" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3 0 0 0 -0.75" result="m"/>
      <feComposite in="c" in2="m" operator="in"/></filter>
      <filter id="smudge"><feTurbulence type="fractalNoise" baseFrequency="0.004" numOctaves="3" seed="7"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.12 0"/></filter></defs>`;
    s += `<rect width="1080" height="1920" fill="#2c4437"/><rect width="1080" height="1920" filter="url(#smudge)"/>`;
    return s + `<g filter="url(#chalk)" opacity="0.9">${inner}</g>`;
  }
  return inner + `<rect x="0" y="0" width="1080" height="1920" fill="url(#vig)"/>` + irisEnd(t, false);
}

// iris in at the start (silent only), iris out and the "The End" card in the last 2 s of every episode
function irisEnd(t, irisIn) {
  const total = typeof D !== "undefined" && D ? D.total : 999, endAt = total - 1.3;
  const r = irisIn && t < 0.6 ? 80 + 1300 * (t / 0.6) : t > endAt - 0.7 ? Math.max(0, 1380 * (1 - (t - (endAt - 0.7)) / 0.7)) : 0;
  let s = r ? `<path d="M-50,-50 H1130 V1970 H-50 Z M540,${960 - r} a${r},${r} 0 1,0 0.1,0 Z" fill="#0b0b0b" fill-rule="evenodd"/>` : "";
  if (t >= endAt) s += filmEnd(t - endAt);
  return s;
}

// silent-film "The End" card
function filmEnd(u) {
  const a = Math.min(1, u / 0.25);
  return `<g opacity="${a}"><rect width="1080" height="1920" fill="#0b0b0b"/>
    <rect x="150" y="700" width="780" height="420" fill="none" stroke="#f1f1ee" stroke-width="5"/>
    <rect x="168" y="718" width="744" height="384" fill="none" stroke="#f1f1ee" stroke-width="2"/>
    <path d="M150,700 l60,0 M150,700 l0,60 M930,700 l-60,0 M930,700 l0,60 M150,1120 l60,0 M150,1120 l0,-60 M930,1120 l-60,0 M930,1120 l0,-60" stroke="#f1f1ee" stroke-width="12"/>
    <text x="540" y="950" font-size="150" fill="#f1f1ee" text-anchor="middle" style="font-family:Lime">The End</text>
    <path d="M380,1010 h320 M440,1035 h200" stroke="#f1f1ee" stroke-width="3"/></g>`;
}
