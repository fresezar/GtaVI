import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/ui/PageShell";
import { CHECKLISTS } from "@/data/checklists";
import ChecklistView from "@/features/checklists/ChecklistView";
import { t } from "@/i18n";
import { checklistKey } from "@/i18n/keys";

export const dynamicParams = false;

export function generateStaticParams() {
  return CHECKLISTS.filter((c) => c.status !== "deprecated").map((c) => ({ slug: c.slug }));
}

type Params = { params: Promise<{ slug: string }> };
const find = (slug: string) => CHECKLISTS.find((c) => c.slug === slug && c.status !== "deprecated");

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const c = find((await params).slug);
  return { title: c ? t(checklistKey(c.id)) : "Not found" };
}

export default async function ChecklistPage({ params }: Params) {
  const checklist = find((await params).slug);
  if (!checklist) notFound();
  return (
    <PageShell width="max-w-3xl">
      <Link href="/checklists" className="mb-4 inline-block text-sm font-bold text-muted underline hover:text-ink">← {t("ui.checklist.index")}</Link>
      <ChecklistView checklist={checklist} />
    </PageShell>
  );
}
