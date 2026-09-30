import { answerById } from "./answers";
import { cafes, cafesByCity } from "./cafes";
import { breakfasts, signatureDrinks } from "./menu";
import { photos } from "./photos";
import { reviews } from "./people";
import type { Cafe, City } from "./types";
import { t } from "@/i18n";

// The about page (src/components/about) takes everything it says from the rest of the content: the cafés
// and their tags, the menu, the answers and the guests' own words. Nothing here is new data, only a
// choice and an order.

const CITIES: City[] = ["nalchik", "vladikavkaz"];

/**
 * The street: every café, city by city (the cities in order, each café as in cafes.ts), the photos
 * with a measured sign first, so the line through the signs runs unbroken as long as it can.
 */
export const street: { city: City; cafes: Cafe[] }[] = CITIES.map((city) => ({
  city,
  cafes: [...cafesByCity(city)].sort((a, b) => Number(!a.photo.sign) - Number(!b.photo.sign)),
}));

const byId = <T extends { id: string }>(list: T[], id: string) => {
  const found = list.find((x) => x.id === id);
  if (!found) throw new Error(`about: no «${id}»`);
  return found;
};

/** «Что у вас своё?»: the two things the menu says are made in-house, and the names. */
export const own = [
  {
    id: "hollandaise",
    ...t.about.own.hollandaise,
    photo: byId(breakfasts, "10-iz-10").photo,
    link: { label: answerById["10-iz-10"].item.name, hash: "10-iz-10" },
  },
  {
    id: "syrup",
    ...t.about.own.syrup,
    photo: photos.stanciyaMir,
    link: { label: t.about.own.syrup.link, hash: byId(signatureDrinks, "stanciya-mir").id },
  },
  {
    id: "names",
    ...t.about.own.names,
    photo: byId(breakfasts, "luchshe-vseh").photo,
    // The answer on its slip, lying across the dish of that name, as in the hero.
    slip: answerById["luchshe-vseh"],
    link: { label: t.about.own.names.link, hash: undefined },
  },
] as const;

const tagged = (re: RegExp) => cafes.filter((c) => c.tags.some((tag) => re.test(tag)));
const only = (list: Cafe[]) => {
  if (list.length !== 1) throw new Error("about: expected exactly one café");
  return list[0].address;
};

/**
 * «Всем, кто зайдёт.»: what the cafés have. The first four are in every café (t.locations.common); the rest
 * are counted and placed from the cafés' own tags, so the list stays true when a café changes.
 */
export const house: { name: string; where: string }[] = [
  { name: t.about.welcome.house.halal, where: t.about.welcome.everywhere },
  { name: t.about.welcome.house.prayer, where: t.about.welcome.everywhere },
  { name: t.about.welcome.house.wifi, where: t.about.welcome.laptop },
  { name: t.about.welcome.house.english, where: t.about.welcome.everywhere },
  { name: t.about.welcome.house.kids, where: only(tagged(/детская комната|kids/)) },
  { name: t.about.welcome.house.verandas, where: t.about.welcome.inCafes(tagged(/веранд|terrace/).length) },
  { name: t.about.welcome.house.blitz, where: only(tagged(/шахматный блиц|blitz/)) },
];

/** The guest's words over the list: the warmth at the door. */
export const welcomeQuote = byId(reviews, "warmth");

/** «Отзывы», the homepage's pile, less the words the welcome's note already says. */
export const aboutReviews = reviews.filter((r) => r.id !== welcomeQuote.id);
