import type { CategoryId, PinId } from "@/domain";

export const pinKey = (id: PinId, field: "title" | "description") => `pin.${id}.${field}`;
export const categoryKey = (id: CategoryId) => `category.${id}.name`;

export const checklistKey = (id: string) => `checklist.${id}.title`;
export const checklistSectionKey = (checklistId: string, sectionId: string) => `checklist.${checklistId}.section.${sectionId}`;
export const checklistItemKey = (id: string) => `checklistItem.${id}.label`;
