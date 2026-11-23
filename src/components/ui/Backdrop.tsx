/**
 * Page backdrop, one per theme (globals.css shows the one matching <html data-theme>):
 *  - dark: the Leonida map, blurred and darkened (public/brand/backdrop-map.jpg, scripts/make-backdrop.mjs)
 *  - vice: the game menu's purple-pink gradient with palm silhouettes (our own SVG, no game art)
 */

import FieldCanvas from "./FieldCanvas";

const W = 1440;
const H = 900;
const LEAF = "M0 0C28-26 80-32 122 2C84-12 38-9 0 0Z";

function Palm({ x, height, lean, scale = 1 }: { x: number; height: number; lean: number; scale?: number }) {
  const base = H + 10;
  const cx = x + lean;
  const cy = base - height;
  const angles = [-38, -14, 10, 34];
  return (
    <g>
      <path d={`M${x} ${base}Q${x + lean * 0.15} ${base - height * 0.55} ${cx} ${cy}`} stroke="currentColor" strokeWidth={13 * scale} strokeLinecap="round" fill="none" />
      <g transform={`translate(${cx} ${cy}) scale(${scale})`} fill="currentColor">
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

export default function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bd-dark absolute inset-0">
        {/* The Leonida map, far back and barely there; the live contour field sits on top. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, one small pre-blurred image */}
        <img src="/brand/backdrop-map.jpg" alt="" className="h-full w-full object-cover opacity-25 saturate-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/70 via-bg/80 to-bg/95" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(90% 70% at 80% -10%, rgba(240,164,58,0.07), transparent 60%)" }} />
        <FieldCanvas />
      </div>
      <div className="bd-vice absolute inset-0" style={{ background: "linear-gradient(160deg, #5b2370 0%, #7a3a8c 45%, #a0518f 75%, #c06a95 100%)" }}>
        <svg className="absolute inset-0 h-full w-full text-[#3a1650] opacity-55" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice">
          <Palm x={980} height={600} lean={-40} scale={1.25} />
          <Palm x={1140} height={480} lean={30} scale={1} />
          <Palm x={1300} height={640} lean={-60} scale={1.3} />
          <Palm x={1420} height={420} lean={20} scale={0.85} />
          <Palm x={60} height={360} lean={40} scale={0.7} />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-r from-[#3a1650]/55 via-transparent to-transparent" />
      </div>
    </div>
  );
}
