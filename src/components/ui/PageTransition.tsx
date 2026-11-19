import { ViewTransition } from "react";

const SLIDE = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" } as const;

/**
 * Page content slides with the tab direction (header tabs tag their links nav-forward / nav-back).
 * Navigations without a type (browser back, plain links) swap instantly. CSS: globals.css "View transitions".
 * Lives in each page (PageShell, map), not the layout: layouts persist, so enter/exit would never fire.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={SLIDE} exit={SLIDE} default="none">
      {children}
    </ViewTransition>
  );
}
