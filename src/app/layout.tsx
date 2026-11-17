import type { Metadata, Viewport } from "next";
import "@fontsource/shrikhand/400.css";
import "@fontsource-variable/dm-sans";
import "./globals.css";
import { SITE } from "@/config/site";

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
  themeColor: "#120b1e",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
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
