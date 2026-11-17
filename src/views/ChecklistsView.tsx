import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageBanner from "@/components/ui/PageBanner";
import PageShell from "@/components/ui/PageShell";
import { CHECKLISTS } from "@/data/checklists";
import ChecklistIndex from "@/features/checklists/ChecklistIndex";
import ChecklistView from "@/features/checklists/ChecklistView";
import { alternates, localePath, tFor, type Locale } from "@/i18n";
import { checklistKey } from "@/i18n/keys";

const find = (slug: string) => CHECKLISTS.find((c) => c.slug === slug && c.status !== "deprecated");
export const checklistStaticParams = () => CHECKLISTS.filter((c) => c.status !== "deprecated").map((c) => ({ slug: c.slug }));

export function checklistsMetadata(locale: Locale): Metadata {
  return { title: tFor(locale)("ui.meta.checklists"), alternates: alternates(locale, "/checklists") };
}

export function checklistMetadata(locale: Locale, slug: string): Metadata {
  const c = find(slug);
  return { title: c ? tFor(locale)(checklistKey(c.id)) : "Not found", alternates: alternates(locale, `/checklists/${slug}`) };
}

export function ChecklistsIndexView({ locale }: { locale: Locale }) {
  return (
    <PageShell locale={locale} path="/checklists" width="max-w-4xl">
      <PageBanner art="banner-checklists" title={tFor(locale)("ui.nav.checklists")} />
      <ChecklistIndex />
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
      <ChecklistView checklist={checklist} />
    </PageShell>
  );
}
