import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageBanner from "@/components/ui/PageBanner";
import PageShell from "@/components/ui/PageShell";
import { CHECKLISTS } from "@/data/checklists";
import { PIN_BY_ID, pinPath } from "@/data/pins";
import { isPlaced, type Checklist } from "@/domain";
import ChecklistIndex, { type ChecklistCard } from "@/features/checklists/ChecklistIndex";
import ChecklistView, { type ChecklistPinLink } from "@/features/checklists/ChecklistView";
import { checklistRef } from "@/lib/progress";
import { alternates, localePath, tFor, type Locale } from "@/i18n/server";
import { checklistItemKey, checklistKey, checklistSectionKey, pinKey } from "@/i18n/keys";

const find = (slug: string) => CHECKLISTS.find((c) => c.slug === slug && c.status !== "deprecated");
export const checklistStaticParams = () => CHECKLISTS.filter((c) => c.status !== "deprecated").map((c) => ({ slug: c.slug }));

export function checklistsMetadata(locale: Locale): Metadata {
  return { title: tFor(locale)("ui.meta.checklists"), alternates: alternates(locale, "/checklists") };
}

export function checklistMetadata(locale: Locale, slug: string): Metadata {
  const c = find(slug);
  return { title: c ? tFor(locale)(checklistKey(c.id)) : "Not found", alternates: alternates(locale, `/checklists/${slug}`) };
}

function cards(locale: Locale): ChecklistCard[] {
  const t = tFor(locale);
  return CHECKLISTS.filter((c) => c.status !== "deprecated").map((c) => ({
    id: c.id,
    slug: c.slug,
    title: t(checklistKey(c.id)),
    refs: c.sections.flatMap((s) => s.items.map(checklistRef)),
  }));
}

/** Everything the client checklist shows, resolved here: titles, section names, item labels, pin links. */
function checklistProps(locale: Locale, checklist: Checklist) {
  const t = tFor(locale);
  const labels: Record<string, string> = { [checklistKey(checklist.id)]: t(checklistKey(checklist.id)) };
  const pinLinks: Record<string, ChecklistPinLink> = {};
  for (const s of checklist.sections) {
    labels[checklistSectionKey(checklist.id, s.id)] = t(checklistSectionKey(checklist.id, s.id));
    for (const item of s.items) {
      labels[checklistItemKey(item.id)] = t(item.linkedPinId ? pinKey(item.linkedPinId, "title") : checklistItemKey(item.id));
      const pin = item.linkedPinId ? PIN_BY_ID.get(item.linkedPinId) : undefined;
      if (pin) pinLinks[pin.id] = { placed: isPlaced(pin), path: pinPath(pin) };
    }
  }
  return { labels, pinLinks };
}

export function ChecklistsIndexView({ locale }: { locale: Locale }) {
  return (
    <PageShell locale={locale} path="/checklists" width="max-w-4xl">
      <PageBanner art="banner-checklists" title={tFor(locale)("ui.nav.checklists")} />
      <ChecklistIndex lists={cards(locale)} />
    </PageShell>
  );
}

export function ChecklistPageView({ locale, slug }: { locale: Locale; slug: string }) {
  const checklist = find(slug);
  if (!checklist) notFound();
  return (
    <PageShell locale={locale} path={`/checklists/${slug}`} width="max-w-3xl">
      <Link href={localePath(locale, "/checklists")} className="mb-4 inline-block text-sm font-bold text-muted underline hover:text-ink">
        ← {tFor(locale)("ui.checklist.index")}
      </Link>
      <ChecklistView checklist={checklist} {...checklistProps(locale, checklist)} />
    </PageShell>
  );
}
