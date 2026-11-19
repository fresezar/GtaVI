/**
 * Header band for the community pages (Finds, Community). Always in the Vice gradient, whatever the
 * site theme: the community area carries its own look. Our own gradient + palm silhouettes, no game art.
 */
const LEAF = "M0 0C28-26 80-32 122 2C84-12 38-9 0 0Z";

function Palm({ x, height, lean, scale = 1 }: { x: number; height: number; lean: number; scale?: number }) {
  const base = 330;
  const cx = x + lean;
  const cy = base - height;
  return (
    <g>
      <path d={`M${x} ${base}Q${x + lean * 0.15} ${base - height * 0.55} ${cx} ${cy}`} stroke="currentColor" strokeWidth={11 * scale} strokeLinecap="round" fill="none" />
      <g transform={`translate(${cx} ${cy}) scale(${scale})`} fill="currentColor">
        {[-38, -14, 10, 34].map((a) => (
          <g key={a}>
            <path d={LEAF} transform={`rotate(${a})`} />
            <path d={LEAF} transform={`scale(-1 1) rotate(${a})`} />
          </g>
        ))}
        <circle r={8} />
      </g>
    </g>
  );
}

export default function ViceBand({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead?: string; children?: React.ReactNode }) {
  return (
    <header
      className="relative mb-8 overflow-hidden border border-white/20 text-white"
      style={{ background: "linear-gradient(120deg, #3a1650 0%, #6d2c82 45%, #a0518f 80%, #c06a95 100%)" }}
    >
      <svg aria-hidden="true" className="absolute inset-y-0 right-0 h-full w-2/3 text-[#2a0e3c] opacity-50" viewBox="0 0 800 330" preserveAspectRatio="xMaxYMax slice">
        <Palm x={430} height={260} lean={-30} scale={1} />
        <Palm x={560} height={300} lean={25} scale={1.15} />
        <Palm x={700} height={240} lean={-20} scale={0.9} />
      </svg>
      <div className="relative p-5 sm:p-8">
        <p className="font-display text-[13px] tracking-[0.26em] text-white/75">{eyebrow}</p>
        <h1 className="mt-1 font-display text-4xl leading-none sm:text-6xl">{title}</h1>
        {lead && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">{lead}</p>}
        {children && <div className="mt-5">{children}</div>}
      </div>
    </header>
  );
}
