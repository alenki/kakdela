import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import { HEAD_SCRIPT } from "@/lib/head-script";
import { Providers } from "@/components/providers/Providers";
import { Header } from "@/components/chrome/Header";
import { MobileActionBar } from "@/components/chrome/MobileActionBar";
import { t } from "@/i18n";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.kakdelacoffee.ru"),
  title: t.meta.title,
  description: t.meta.description,
  applicationName: "Как дела?",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Как дела?",
    title: "Как дела? — кофейни в Нальчике и Владикавказе",
    description: t.meta.description,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#dce8f4",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-city="nalchik" data-motion="full" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: HEAD_SCRIPT }} />
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
