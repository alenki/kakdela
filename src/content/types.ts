import type { StaticImageData } from "next/image";

export type City = "nalchik" | "vladikavkaz";
export type Mood = "good" | "hungry" | "tired" | "meh";

/** Per-city price in rubles. `null` = «уточняйте в кофейне». */
export type Price = { nalchik: number | null; vladikavkaz: number | null };

/** Facts that still need client sign-off before production. */
export type Verify = { verified: boolean; note?: string };

/**
 * Where a café's «Как дела?» sign is in its photo, as fractions of the photo: `x` and `y` are the middle of
 * the sign's line (at the clover, or where the clover would be), `w` is the line's width. Measured by eye
 * off the photo; the about page's street lays every photo so its sign sits on one line (src/lib/crop.ts).
 */
export type SignBox = { x: number; y: number; w: number };

export type Photo = {
  src: StaticImageData;
  alt: string;
  /** Stock stand-in to be replaced with the client's own photography. */
  placeholder?: boolean;
  /** The café's sign in this photo (café photos only). Re-measure it when the photo changes. */
  sign?: SignBox;
};

export type AnswerId =
  | "luchshe-vseh"
  | "kak-v-skazke"
  | "vsyo-shik"
  | "10-iz-10"
  | "est-hochu"
  | "normalno"
  | "sonno"
  | "tak-sebe";

export type Answer = {
  id: AnswerId;
  /** What the guest tears off, e.g. «Лучше всех». */
  label: string;
  mood: Mood;
  item: {
    kind: "breakfast" | "drink" | "dish";
    /** How the item is named on the receipt line, e.g. «Завтрак «Лучше всех»». */
    name: string;
    price: Price;
    photo: Photo;
    /** The dish's anchor on the menu page: `<RouteLink to="menu" hash={anchor}>`. */
    anchor: string;
  };
  /** The café's reply, Montserrat italic. */
  reply: string;
  verify: Verify;
};

export type Breakfast = {
  id: string;
  name: string;
  desc: string;
  price: Price;
  kbju?: { k: number; b: number; zh: number; u: number };
  photo: Photo;
  verify: Verify;
};

export type Drink = {
  id: string;
  name: string;
  desc?: string;
  price: Price | { sizes: [number, number] };
  /**
   * The barista's note on the coffee cup, in their own lower case: a question and the drink it
   * suggests («классика?», «капучино»). Never a price: `noteLines()` adds it from `price`.
   */
  cupNote?: { ask: string; say: string };
  lang?: "en";
};

export type Dessert = {
  id: string;
  name: string;
  desc: string;
  price: Price;
  photo: Photo;
  verify: Verify;
};

// ── The full menu (/menu). Curated dishes above are referenced, never copied (src/content/full-menu.ts). ──

/** Калории, белки, жиры, углеводы per serving. b/zh/u are missing only where the source gives calories alone. */
export type Kbju = { k: number; b?: number; zh?: number; u?: number };

export type Nutrition = {
  kbju: Kbju;
  /** Alternative values for the same dish (e.g. by sauce). Kept for the client check, never rendered. */
  variants?: { label?: string; kbju: Kbju }[];
  verified: boolean;
  /** Only in these cities (e.g. «Капитальный»: the Нальчик recipe). */
  cities?: City[];
  note?: string;
};

/** Serving volume: one size, or the two cup sizes that go with a `{ sizes }` price. */
export type Volume = { ml: number } | { sizes: [number, number] };

/** Per-city rubles, or two cup sizes (the same in both cities): Drink["price"]. */
export type MenuPrice = Price | { sizes: [number, number] };

export type MenuItem = {
  /** Stable Latin slug, unique on the page: the item's anchor (/menu#id). */
  id: string;
  name: string;
  lang?: "en";
  desc?: string;
  /** A city's own recipe: rendered next to `desc`, each with data-city-only. */
  descByCity?: Partial<Record<City, string>>;
  price: MenuPrice;
  volume?: Volume;
  nutrition?: Nutrition;
  photo?: Photo;
  /** Served only in these cities. Omitted: both (a null price there reads «уточняйте в кофейне»). */
  cities?: City[];
  /** A signature row: set large, as on the homepage. */
  signature?: true;
  /** Comes from src/content/menu.ts, so the homepage shows the same name, price and copy. */
  curated?: true;
  /** Provenance for the client check, never rendered. */
  oldName?: string;
  seenAt?: string[];
  draftNote?: string;
  verify?: Verify;
};

export type MenuCategory = {
  /** Latin slug: the category's anchor (/menu#id). */
  id: string;
  title: string;
  /** The whole category is served only in these cities. */
  cities?: City[];
  /** The chapter's signature block (set large, as on the homepage). */
  signature?: true;
  items: MenuItem[];
};

export type MenuChapterId = "kuhnya" | "bar" | "deserty";

export type MenuChapter = {
  id: MenuChapterId;
  title: string;
  /** "full-kitchen": only the cafés with kitchen: "full"; "every-cafe": all nine. */
  servedAt: "full-kitchen" | "every-cafe";
  categories: MenuCategory[];
};

export type Cafe = {
  id: string;
  city: City;
  address: string;
  alias?: string;
  coords: { lat: number; lon: number };
  open: string;
  close: "23:00" | "00:00";
  /** E.164 for tel: links. */
  phone: string;
  phoneDisplay: string;
  rating: number;
  ratingsCount: number;
  yandexOrgId: string;
  tags: string[];
  kitchen: "full" | "light";
  photo: Photo;
  verify: Verify;
};

export type Review = {
  id: string;
  text: string;
  cafeId: string;
  sourceUrl: string;
  permission: boolean;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  line: string;
  photo: Photo;
  placeholder: boolean;
} & (
  /** One of the notice's answers: its slip has that tab's tear, the card links to the dish of that
   *  name, and it turns red while the guest's answer in the hero is the same. */
  | { answerId: AnswerId; answer?: never }
  /** Their own words: a slip of its own (seeded by `id`), no dish, no match. The slip never wraps, so
   *  keep it no longer than «Как в сказке» (12 characters); a test guards it. */
  | { answer: string; answerId?: never }
);
