import type { NewsItem, TimelineEvent } from "@/domain";
import rawNews from "@content/news.json";
import rawTimeline from "@content/timeline.json";

/** Oldest first (it is a road to launch). */
export const TIMELINE: readonly TimelineEvent[] = [...(rawTimeline as TimelineEvent[])].sort((a, b) => a.date.localeCompare(b.date));

/** Newest first. */
export const NEWS: readonly NewsItem[] = [...(rawNews as unknown as NewsItem[])].sort((a, b) => b.date.localeCompare(a.date));
