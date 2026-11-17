import { SITE } from "@/config/site";
import Art from "./Art";

/**
 * Our own neon-sunset scene (sky, striped sun, skyline, palms, water). Pure SVG, generated
 * deterministically: no photos, no Rockstar art, ~6 KB, no network request.
 */

const W = 1440;
const H = 900;
const HORIZON = 690;

// Tiny deterministic PRNG so server and client render the same skyline.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function skyline(): string {
  const r = rng(7);
  let d = "";
  let x = 300;
  while (x < 1140) {
    const w = 18 + Math.round(r() * 46);
    const centerBoost = 1 - Math.min(1, Math.abs(x + w / 2 - 720) / 420); // taller toward the middle
    const h = 40 + Math.round(r() * 90 + centerBoost * 150);
    d += `M${x} ${HORIZON}V${HORIZON - h}h${w}V${HORIZON}Z`;
    if (r() > 0.72) d += `M${x + w / 2 - 1} ${HORIZON - h}v-${12 + Math.round(r() * 24)}h2V${HORIZON - h}Z`; // antenna
    x += w + Math.round(r() * 6);
  }
  return d;
}

const LEAF = "M0 0C28-26 80-32 122 2C84-12 38-9 0 0Z";

function Palm({ x, height, lean, scale = 1 }: { x: number; height: number; lean: number; scale?: number }) {
  const base = H + 10;
  const cx = x + lean;
  const cy = base - height;
  const angles = [-38, -14, 10, 34];
  return (
    <g>
      <path
        d={`M${x} ${base}Q${x + lean * 0.15} ${base - height * 0.55} ${cx} ${cy}`}
        stroke="#0a0512"
        strokeWidth={13 * scale}
        strokeLinecap="round"
        fill="none"
      />
      <g transform={`translate(${cx} ${cy}) scale(${scale})`} fill="#0a0512">
        {angles.map((a) => (
          <path key={`r${a}`} d={LEAF} transform={`rotate(${a})`} />
        ))}
        {angles.map((a) => (
          <path key={`l${a}`} d={LEAF} transform={`scale(-1 1) rotate(${a})`} />
        ))}
        <path d={LEAF} transform="rotate(-80) scale(0.8)" />
        <circle r={9} />
      </g>
    </g>
  );
}

/** Photo backdrop when official art is on; our own SVG scene otherwise (and as the takedown fallback). */
export default function Backdrop() {
  if (SITE.officialArt) {
    return (
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <Art name="backdrop" sizes="100vw" priority className="h-full w-full object-[50%_45%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#120b1e]/55 via-[#120b1e]/70 to-[#120b1e]/95" />
      </div>
    );
  }
  return <SvgBackdrop />;
}

function SvgBackdrop() {
  const stripes = Array.from({ length: 7 }, (_, i) => ({ y: 600 + i * 15, h: 2 + i * 1.6 }));
  const reflections = Array.from({ length: 9 }, (_, i) => ({ y: HORIZON + 14 + i * 20, w: 420 - i * 38, o: 0.55 - i * 0.055 }));

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <svg className="h-full w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="bd-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#120b1e" />
            <stop offset="0.38" stopColor="#2a1046" />
            <stop offset="0.6" stopColor="#7a1f66" />
            <stop offset="0.72" stopColor="#d8386f" />
            <stop offset="0.77" stopColor="#ff7a55" />
          </linearGradient>
          <linearGradient id="bd-sun" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe08a" />
            <stop offset="0.55" stopColor="#ff9a4d" />
            <stop offset="1" stopColor="#ff3d8b" />
          </linearGradient>
          <linearGradient id="bd-sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a0f3a" />
            <stop offset="1" stopColor="#0c0614" />
          </linearGradient>
          <mask id="bd-sun-cut">
            <rect width={W} height={H} fill="#fff" />
            {stripes.map((s) => (
              <rect key={s.y} x="0" y={s.y} width={W} height={s.h} fill="#000" />
            ))}
          </mask>
          <radialGradient id="bd-glow" cx="0.5" cy="0.72" r="0.45">
            <stop offset="0" stopColor="#ff3d8b" stopOpacity="0.35" />
            <stop offset="1" stopColor="#ff3d8b" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width={W} height={H} fill="url(#bd-sky)" />
        <rect width={W} height={H} fill="url(#bd-glow)" />
        <circle cx="720" cy="560" r="185" fill="url(#bd-sun)" mask="url(#bd-sun-cut)" />
        <path d={skyline()} fill="#1a0b2c" />
        <rect y={HORIZON} width={W} height={H - HORIZON} fill="url(#bd-sea)" />
        {reflections.map((l) => (
          <rect key={l.y} x={720 - l.w / 2} y={l.y} width={l.w} height="3" rx="1.5" fill="#ff6a8f" opacity={l.o} />
        ))}

        <Palm x={70} height={520} lean={60} scale={1.15} />
        <Palm x={210} height={380} lean={-30} scale={0.8} />
        <Palm x={1370} height={560} lean={-70} scale={1.2} />
        <Palm x={1230} height={360} lean={35} scale={0.75} />
      </svg>
      {/* Readability veil: content sits on top of the scene. */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#120b1e]/30 via-[#120b1e]/55 to-[#120b1e]/90" />
    </div>
  );
}
