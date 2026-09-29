import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import { HEAD_SCRIPT } from "@/lib/head-script";
import { LOADER_SCRIPT } from "@/components/loader/loader-script";
import { Providers } from "@/components/providers/Providers";
import { Header } from "@/components/chrome/Header";
import { MobileActionBar } from "@/components/chrome/MobileActionBar";
import { t } from "@/i18n";
import { EN, LOCALE } from "@/i18n/locale";
import { ogImage } from "@/lib/og";
import "./globals.css";

export const metadata: Metadata = {
  // The English build is its own site under /en: its relative URLs (canonical, og:url) resolve there.
  metadataBase: new URL(EN ? "https://www.kakdelacoffee.ru/en/" : "https://www.kakdelacoffee.ru"),
  title: t.meta.title,
  description: t.meta.description,
  applicationName: t.meta.brand,
  alternates: { languages: { ru: "https://www.kakdelacoffee.ru/", en: "https://www.kakdelacoffee.ru/en" } },
  openGraph: {
    type: "website",
    locale: EN ? "en_US" : "ru_RU",
    alternateLocale: EN ? "ru_RU" : "en_US",
    siteName: t.meta.brand,
    title: EN ? "Kak dela? Cafés in Nalchik and Vladikavkaz" : "Как дела? Кофейни в Нальчике и Владикавказе",
    description: t.meta.description,
    // The wordmark is the brand: one card for both languages, its alt in each.
    images: ogImage(
      "kakdela.png",
      EN
        ? "“Kak dela?”: specialty coffee and breakfast cafés in Nalchik and Vladikavkaz"
        : "«Как дела?»: кофейни specialty-кофе и завтраков в Нальчике и Владикавказе",
      { localized: false },
    ),
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f3ebdc",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={LOCALE} data-city="nalchik" data-motion="full" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: HEAD_SCRIPT }} />
        {/* The loading screen (docs/CONVENTIONS.md, «До краёв»): runs only when the head script says so. */}
        <script dangerouslySetInnerHTML={{ __html: LOADER_SCRIPT }} />
      </head>
      <body>
        <Providers>
          <Header />
          {/* Each page renders its own <main id="main" tabIndex={-1}> (the skip link's target), so the
              site footer can follow it at the top level as the page's contentinfo landmark. */}
          {children}
          <MobileActionBar />
        </Providers>
      </body>
    </html>
  );
}
