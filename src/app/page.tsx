import Link from "next/link";
import SiteHeader from "@/components/ui/SiteHeader";
import { SITE } from "@/config/site";

const SOON = ["Interactive map", "100% completion checklists", "Vehicle & weapon comparison", "Money & heist calculators", "Mini-games"];

export default function Home() {
  return (
    <>
    <SiteHeader />
    <main className="mx-auto flex max-w-3xl flex-col justify-center gap-8 px-4 py-12">
      <div>
        <p className="sticker inline-block bg-sun text-[#1d2b3a]">UNOFFICIAL · EARLY BUILD</p>
        <h1 className="mt-4 font-display text-6xl leading-[0.95] sm:text-7xl">
          Every secret.
          <br />
          <span className="text-accent">Every spot.</span>
          <br />
          One map.
        </h1>
        <p className="mt-5 max-w-xl text-lg">{SITE.description} Fast, mobile-first, and honest about what is verified.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/map" className="btn btn-primary min-h-[48px] px-6 text-base">Open the map</Link>
          <Link href="/checklists" className="btn min-h-[48px] px-6 text-base">Checklists</Link>
        </div>
      </div>

      <section className="card" aria-label="Roadmap">
        <h2 className="font-display text-xl">Coming up</h2>
        <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          {SOON.map((s) => (
            <li key={s} className="flex items-center gap-2">
              <span className="dot !h-3 !w-3 bg-accent2" /> {s}
            </li>
          ))}
        </ul>
      </section>

      <footer className="text-xs text-muted">{SITE.disclaimer}</footer>
    </main>
    </>
  );
}
