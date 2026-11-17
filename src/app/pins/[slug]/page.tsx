import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/ui/SiteHeader";
import { CATEGORIES } from "@/data/categories";
import { PINS } from "@/data/pins";
import { t } from "@/i18n";
import { categoryKey, pinKey } from "@/i18n/keys";

export const dynamicParams = false;

export function generateStaticParams() {
  return PINS.filter((p) => p.status !== "deprecated").map((p) => ({ slug: p.slug }));
}

type Params = { params: Promise<{ slug: string }> };

const find = (slug: string) => PINS.find((p) => p.slug === slug && p.status !== "deprecated");

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const pin = find((await params).slug);
  return { title: pin ? t(pinKey(pin.id, "title")) : "Not found" };
}

export default async function PinPage({ params }: Params) {
  const pin = find((await params).slug);
  if (!pin) notFound();
  const category = CATEGORIES.find((c) => c.id === pin.categoryId);
  const hasDescription = t(pinKey(pin.id, "description")) !== pinKey(pin.id, "description");

  return (
    <>
    <SiteHeader />
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/map" className="text-sm font-bold underline">← Back to map</Link>
      <article className="card mt-4">
        <p className="text-xs font-bold uppercase tracking-widest text-muted">
          {category ? t(categoryKey(category.id)) : ""} · {t(`ui.pin.status.${pin.status}`)}
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight">{t(pinKey(pin.id, "title"))}</h1>
        {hasDescription && pin.spoilerLevel === "none" && <p className="mt-3">{t(pinKey(pin.id, "description"))}</p>}
        {hasDescription && pin.spoilerLevel !== "none" && (
          <details className="mt-3">
            <summary className="cursor-pointer font-bold text-accent">{t("ui.pin.spoiler")}</summary>
            <p className="mt-2">{t(pinKey(pin.id, "description"))}</p>
          </details>
        )}
        {pin.credit && <p className="mt-3 text-sm text-muted">{t("ui.pin.foundBy", { name: pin.credit.name })}</p>}
        <Link href={`/map?pin=${pin.id}`} className="btn btn-primary mt-5">Show on map</Link>
      </article>
    </main>
    </>
  );
}
