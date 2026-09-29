/**
 * The /menu page's reading of the full menu (src/content/full-menu.ts): which rows the table serves, which dish
 * each of the eight answers stands for, where a chapter is cooked, and the back of the notice's torn stub. Pure
 * and server-safe, so the page, the islands and the tests share one account of it.
 */
import { answers } from "@/content/answers";
import { cafes } from "@/content/cafes";
import { chapterById, citiesOf, fullMenu, kitchenCafes, menuItemById } from "@/content/full-menu";
import type { Answer, AnswerId, City, MenuCategory, MenuChapter, MenuItem } from "@/content/types";

export const CITIES: City[] = ["nalchik", "vladikavkaz"];

/** The eight answers, in the notice's order, each with the menu item it stands for (answers.ts `item.anchor`). */
export const answerDishes: { answer: Answer; item: MenuItem }[] = answers.map((answer) => {
  const item = menuItemById[answer.item.anchor];
  if (!item) throw new Error(`full-menu.ts: no item «${answer.item.anchor}» for the answer «${answer.id}»`);
  return { answer, item };
});

/** Which answer names a dish: «Лучше всех» names the breakfast «Лучше всех», «Сонно» the espresso tonic. */
export const answerForItem: Record<string, Answer> = Object.fromEntries(answerDishes.map(({ answer, item }) => [item.id, answer]));

/** The dish an answer stands for, by the answer's id. */
export const itemForAnswer = Object.fromEntries(answerDishes.map(({ answer, item }) => [answer.id, item])) as Record<AnswerId, MenuItem>;

/**
 * What the table serves, in page order: every kitchen dish (the table stands beside the kitchen), then the
 * answers' dishes from the bar (the cover's table shows whichever answer is on show). One slide per item id.
 */
export const tableItems: MenuItem[] = (() => {
  const kitchen = chapterById.kuhnya.categories.flatMap((c) => c.items);
  const extra = answerDishes.map((d) => d.item).filter((i) => !kitchen.includes(i));
  return [...kitchen, ...extra];
})();

/** The table's first dish before any answer is known (no JS): the first answer's. */
export const DEFAULT_TABLE_ITEM = answerDishes[0].item.id;

/** A row's place in the menu. */
export type Row = { item: MenuItem; category: MenuCategory; chapter: MenuChapter; cities: City[] };

export const rowsOf = (chapter: MenuChapter, category: MenuCategory): Row[] =>
  category.items.map((item) => ({ item, category, chapter, cities: citiesOf(item, category) }));

/** Where each item is served, by id (its own cities, else its category's, else both). */
export const citiesById: Record<string, City[]> = Object.fromEntries(
  fullMenu.flatMap((ch) => ch.categories.flatMap((c) => c.items.map((i): [string, City[]] => [i.id, citiesOf(i, c)]))),
);

/** Served in one city only: that city; otherwise null. */
export const onlyCity = (cities: City[]): City | null => (cities.length === 1 ? cities[0] : null);

/** The cafés that cook a chapter in a city: the full kitchens for «Кухня», every café for the bar and desserts. */
export const servedAt = (chapter: MenuChapter, city: City) =>
  chapter.servedAt === "full-kitchen" ? kitchenCafes[city] : cafes.filter((c) => c.city === city);

/** «ул. Байсултанова, 1» → «Байсултанова, 1»: a street in a list of streets. */
export const street = (address: string) => address.replace(/^(ул|пр|пер|пл)\.\s*/u, "");

/** How many dishes a category has in a city (a one-city dish counts only there). */
export const categoryCount = (category: MenuCategory, city: City) =>
  category.items.filter((i) => citiesOf(i, category).includes(city)).length;

/** Every item the page shows, in page order. */
export const pageItems: MenuItem[] = fullMenu.flatMap((ch) => ch.categories.flatMap((c) => c.items));

/**
 * The notice's torn stub, seen from the back. On the front (tornEdge in src/lib/tear.ts) the stub is the top of
 * the tab, torn along its lower edge; the menu shows the notice turned over top to bottom, so the same paper is
 * the bottom of the slot, torn along its upper edge: every point's y is mirrored. Takes and returns a CSS
 * `polygon()` in percent.
 */
export function flipStub(polygon: string): string {
  return polygon.replace(/(-?[\d.]+)% (-?[\d.]+)%/g, (_, x: string, y: string) => `${x}% ${Math.round((100 - Number(y)) * 10) / 10}%`);
}
