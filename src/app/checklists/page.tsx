import type { Metadata } from "next";
import PageShell from "@/components/ui/PageShell";
import ChecklistIndex from "@/features/checklists/ChecklistIndex";
import { t } from "@/i18n";

export const metadata: Metadata = { title: "Checklists" };

export default function ChecklistsPage() {
  return (
    <PageShell width="max-w-4xl">
      <h1 className="mb-6 font-display text-4xl sm:text-5xl">{t("ui.nav.checklists")}</h1>
      <ChecklistIndex />
    </PageShell>
  );
}
