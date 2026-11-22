import { checklistsMetadata, ChecklistsIndexView } from "@/views/ChecklistsView";

export const metadata = checklistsMetadata("es");

export default function Page() {
  return <ChecklistsIndexView locale="es" />;
}
