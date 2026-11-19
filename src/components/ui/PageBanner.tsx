import { SITE } from "@/config/site";
import type { ArtName } from "@/config/art";
import Art from "./Art";

/** Page title over a wide artwork strip; falls back to a plain heading when official art is off. */
export default function PageBanner({ art, title, lead }: { art: ArtName; title: string; lead?: string }) {
  if (!SITE.officialArt) {
    return (
      <header className="mb-8">
        <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
        {lead && <p className="mt-2 max-w-2xl text-muted">{lead}</p>}
      </header>
    );
  }
  return (
    <header className="relative mb-8 overflow-hidden rounded-3xl border border-line-strong">
      <Art name={art} sizes="(min-width: 1152px) 1152px, 100vw" priority className="aspect-[2/1] w-full sm:aspect-[3/1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
        <h1 className="font-display text-4xl leading-none sm:text-5xl">{title}</h1>
        {lead && <p className="mt-2 max-w-2xl text-sm text-ink sm:text-base">{lead}</p>}
      </div>
    </header>
  );
}
