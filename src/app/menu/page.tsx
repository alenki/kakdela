import type { Metadata } from "next";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { JsonLd } from "@/components/seo/JsonLd";
import { MenuMast } from "@/components/menu/MenuMast";
import { NoticeBack } from "@/components/menu/NoticeBack";
import { MenuTable } from "@/components/menu/MenuTable";
import { KitchenChapter } from "@/components/menu/KitchenChapter";
import { BarChapter } from "@/components/menu/BarChapter";
import { DessertsChapter } from "@/components/menu/DessertsChapter";
import { MenuJsonLd } from "@/components/menu/MenuJsonLd";
import { MENU_PICK_STYLE } from "@/components/menu/pick-script";
import { DEFAULT_TABLE_ITEM, itemForAnswer } from "@/components/menu/model";
import { TableController } from "@/components/menu/islands/TableController";
import { MenuMotion } from "@/components/menu/islands/MenuMotion";
import { t } from "@/i18n";
import { EN } from "@/i18n/locale";
import { ogImage } from "@/lib/og";

const { title, description } = t.menu.meta;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/menu" },
  // A page's openGraph replaces the layout's whole: the site-wide fields come along. The card is the page's own
  // first screen in each language (scripts/make-menu-card.mjs).
  openGraph: {
    type: "website",
    locale: EN ? "en_US" : "ru_RU",
    siteName: t.meta.brand,
    title,
    description,
    url: "/menu",
    images: ogImage(
      "menu.jpg",
      EN
        ? "The “Kak dela?” menu: “What will it be?” and the “Never Better” breakfast on the table"
        : "Меню «Как дела?»: «Что будете?» и завтрак «Лучше всех» на столе",
    ),
  },
};

/** The table's dish for each answer, for the controller (a small map, so the client never loads the menu's data). */
const COVER = Object.fromEntries(Object.entries(itemForAnswer).map(([answer, item]) => [answer, item.id]));

// The waiter's line of the conversation: the homepage asks «Как дела?», the menu «Что будете?». The day's cream
// holds the title, the notice turned over (its tabs carry their dishes, its sheet the contents) and the kitchen,
// with the table beside them; then the bar, and the desserts at night.
export default function MenuPage() {
  return (
    <>
      <main id="main" tabIndex={-1} className="mn">
        {/* Before paint: the answer's dish on the table, its tab red, today's torn tab gone (pick-script.ts). */}
        <style dangerouslySetInnerHTML={{ __html: MENU_PICK_STYLE }} />
        <div className="field mn-day" data-theme="cream">
          <div className="wrap mn-day__grid">
            <MenuMast />
            <NoticeBack />
            <KitchenChapter />
            <MenuTable />
          </div>
        </div>
        <BarChapter />
        <DessertsChapter />
        <TableController cover={COVER} fallback={DEFAULT_TABLE_ITEM} />
        <MenuMotion />
      </main>
      {/* Outside <main>: the footer is the page's contentinfo landmark. */}
      <SiteFooter />
      <JsonLd />
      <MenuJsonLd />
    </>
  );
}
