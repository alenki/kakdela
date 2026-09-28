import type { Metadata } from "next";
import { menuSections } from "@/content/full-menu";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { MenuHead } from "@/components/menu/MenuHead";
import { MenuTabs } from "@/components/menu/MenuTabs";
import { MenuSectionBlock } from "@/components/menu/MenuSectionBlock";
import { MenuCta } from "@/components/menu/MenuCta";
import { MenuNav } from "@/components/menu/islands/MenuNav";
import { MenuMotion } from "@/components/menu/islands/MenuMotion";
import { MENU_PICK_SCRIPT } from "@/components/menu/pick-script";
import { t } from "@/i18n";

export const metadata: Metadata = {
  title: t.menu.meta.title,
  description: t.menu.meta.description,
  alternates: { canonical: "/menu" },
  openGraph: { title: t.menu.meta.title, description: t.menu.meta.description, url: "/menu" },
};

// The waiter's side of the conversation: the homepage asks «Как дела?», the menu asks «Что будете?». The top,
// the tabs, then one café day in six sections of photo cards (cream by day, the desserts at night), and a
// last word before the footer.
export default function MenuPage() {
  const tabs = menuSections.map((s) => ({ id: s.id, label: t.menu.sections[s.id].title }));
  return (
    <>
      <main id="main" tabIndex={-1} className="mn">
        {/* Before paint: a hash naming an answer dish (/menu#espresso-tonik) marks that answer. */}
        <script dangerouslySetInnerHTML={{ __html: MENU_PICK_SCRIPT }} />
        <MenuHead />
        <MenuTabs tabs={tabs} />
        {menuSections.map((s) => (
          <MenuSectionBlock key={s.id} section={s} />
        ))}
        <MenuCta />
        <MenuNav />
        <MenuMotion />
      </main>
      {/* Outside <main>: the footer is the page's contentinfo landmark. */}
      <SiteFooter />
    </>
  );
}
