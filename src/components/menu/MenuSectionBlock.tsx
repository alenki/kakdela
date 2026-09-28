import type { City, MenuSection } from "@/content/types";
import { citiesOf, kitchenCafes, sectionItems } from "@/content/full-menu";
import { CafeStatus } from "@/components/chrome/CafeStatus";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { MenuItemCard } from "./MenuItemCard";

const CITIES: City[] = ["nalchik", "vladikavkaz"];

/** Where the kitchen dishes are cooked, and whether that café is open now: the question of a guest at 8:10. */
function KitchenLine({ id }: { id: string }) {
  return (
    <div className="mn-kitchen">
      <p id={id} className="label mn-kitchen__label">
        {t.menu.fullKitchen}
      </p>
      <ul className="mn-kitchen__list" role="list" aria-labelledby={id}>
        {CITIES.flatMap((c) =>
          kitchenCafes[c].map((cafe) => (
            <li key={cafe.id} className="mn-kitchen__cafe" data-city-only={c}>
              <span className="mn-kitchen__addr">{typograf(cafe.address)}</span>
              <CafeStatus cafe={cafe} />
            </li>
          )),
        )}
      </ul>
      <p className="label mn-kitchen__note">{typograf(t.menu.lightKitchen)}</p>
    </div>
  );
}

/**
 * One section of the menu (one tab): its title with the waiter's question beside it (the shared section
 * head: title 1–8, the line 9–12 on its last baseline), then its dishes as a grid of photo cards, and the
 * few without a photo as rows under it.
 */
export function MenuSectionBlock({ section }: { section: MenuSection }) {
  const copy = t.menu.sections[section.id];
  const entries = sectionItems(section);
  const cards = entries.filter((e) => e.item.photo);
  const rows = entries.filter((e) => !e.item.photo);
  return (
    <section
      id={section.id}
      className="field section-pad mn-sec"
      data-theme={section.theme}
      aria-labelledby={`${section.id}-title`}
      data-mn-section
    >
      <div className="wrap">
        <header className="section-head mn-sec__head" data-mn-head>
          <DialogueHeading id={`${section.id}-title`} q={typograf(copy.title)} />
          <p className="mn-sec__line reply">{typograf(copy.line)}</p>
        </header>

        {section.servedAt === "full-kitchen" && <KitchenLine id={`${section.id}-kitchen`} />}

        <ul className="mn-grid" role="list">
          {cards.map(({ item, category }) => (
            <MenuItemCard key={item.id} item={item} cities={citiesOf(item, category)} />
          ))}
        </ul>
        {rows.length > 0 && (
          <ul className="mn-rest" role="list">
            {rows.map(({ item, category }) => (
              <MenuItemCard key={item.id} item={item} cities={citiesOf(item, category)} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
