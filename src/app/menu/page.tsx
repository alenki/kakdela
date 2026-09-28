import type { Metadata } from "next";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { MenuTop } from "@/components/menu/MenuTop";
import { MenuRunningHead } from "@/components/menu/MenuRunningHead";
import { KitchenChapter } from "@/components/menu/KitchenChapter";
import { BarChapter } from "@/components/menu/BarChapter";
import { DessertsChapter } from "@/components/menu/DessertsChapter";
import { MenuNav } from "@/components/menu/islands/MenuNav";
import { RunningHeadController } from "@/components/menu/islands/RunningHeadController";
import { MenuMotion } from "@/components/menu/islands/MenuMotion";
import { MENU_PICK_SCRIPT } from "@/components/menu/pick-script";
import { t } from "@/i18n";

export const metadata: Metadata = {
  title: t.menu.meta.title,
  description: t.menu.meta.description,
  alternates: { canonical: "/menu" },
  openGraph: { title: t.menu.meta.title, description: t.menu.meta.description, url: "/menu" },
};

// The waiter's side of the conversation: the homepage asks «Как дела?», the menu asks «Что будете?». A cover
// set by answer, then one café day in three chapters: the kitchen and the bar by day, the desserts at night.
export default function MenuPage() {
  return (
    <>
      <main id="main" tabIndex={-1} className="mn">
        {/* Before paint: a hash naming an answer dish (/menu#espresso-tonik) marks that answer. */}
        <script dangerouslySetInnerHTML={{ __html: MENU_PICK_SCRIPT }} />
        <MenuTop />
        <MenuRunningHead />
        <KitchenChapter />
        <BarChapter />
        <DessertsChapter />
        <MenuNav />
        <RunningHeadController />
        <MenuMotion />
      </main>
      {/* Outside <main>: the footer is the page's contentinfo landmark. */}
      <SiteFooter />
    </>
  );
}
