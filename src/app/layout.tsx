import type { Metadata, Viewport } from "next";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource-variable/dm-sans";
import "./globals.css";
import { SITE } from "@/config/site";

// ?theme=vice|dark in the URL wins (and is remembered); otherwise the saved choice.
const THEME_INIT = `try{var q=new URLSearchParams(location.search).get("theme"),t=q==="vice"||q==="dark"?q:localStorage.getItem("theme");if(q===t)localStorage.setItem("theme",t);if(t==="vice"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.baseUrl),
  title: { default: `${SITE.name}: unofficial GTA VI companion`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  robots: SITE.indexable ? undefined : { index: false, follow: false },
  // Link previews (TikTok bio, X, Discord, WhatsApp). Images come from `npm run media`.
  openGraph: {
    type: "website",
    siteName: SITE.name,
    images: [{ url: SITE.officialArt ? "/og.jpg" : "/og-plain.jpg", width: 1200, height: 630, alt: `${SITE.name}: unofficial GTA VI map` }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B1422",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before first paint (no flash). Kept tiny and dependency-free. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-dvh">
        {children}
        {SITE.analytics.cloudflareToken && (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: SITE.analytics.cloudflareToken })}
          />
        )}
      </body>
    </html>
  );
}
