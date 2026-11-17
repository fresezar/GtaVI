import { checklistsMetadata, ChecklistsIndexView } from "@/views/ChecklistsView";

export const metadata = checklistsMetadata("tr");

export default function Page() {
  return <ChecklistsIndexView locale="tr" />;
}
