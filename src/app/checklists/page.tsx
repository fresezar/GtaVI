import type { Metadata } from "next";
import SiteHeader from "@/components/ui/SiteHeader";
import ChecklistIndex from "@/features/checklists/ChecklistIndex";
import { t } from "@/i18n";

export const metadata: Metadata = { title: "Checklists" };

export default function ChecklistsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-5 font-display text-4xl">{t("ui.nav.checklists")}</h1>
        <ChecklistIndex />
      </main>
    </>
  );
}
