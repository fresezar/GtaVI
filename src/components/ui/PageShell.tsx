import Backdrop from "./Backdrop";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/** Every content page: neon backdrop, sticky header, footer. The map page has its own full-screen layout. */
export default function PageShell({ children, width = "max-w-6xl" }: { children: React.ReactNode; width?: string }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Backdrop />
      <SiteHeader />
      <main className={`mx-auto w-full flex-1 ${width} px-4 py-8 sm:py-10`}>{children}</main>
      <SiteFooter />
    </div>
  );
}
