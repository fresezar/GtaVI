import { checklistsMetadata, ChecklistsIndexView } from "@/views/ChecklistsView";

export const metadata = checklistsMetadata("en");

export default function Page() {
  return <ChecklistsIndexView locale="en" />;
}
