import type { Metadata, Viewport } from "next";
import "@fontsource/shrikhand/400.css";
import "@fontsource-variable/dm-sans";
import "./globals.css";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.baseUrl),
  title: { default: `${SITE.name}: unofficial companion`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff1d6" },
    { media: "(prefers-color-scheme: dark)", color: "#14192b" },
  ],
};

// Runs before paint so the saved/system theme never flashes.
const themeScript = `(function(){try{var t=localStorage.getItem('atlas:theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
