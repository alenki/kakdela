import type { StaticImageData } from "next/image";

export type City = "nalchik" | "vladikavkaz";
export type Mood = "good" | "hungry" | "tired" | "meh";

/** Per-city price in rubles. `null` = «уточняйте в кофейне». */
export type Price = { nalchik: number | null; vladikavkaz: number | null };

/** Facts that still need client sign-off before production. */
export type Verify = { verified: boolean; note?: string };

export type Photo = {
  src: StaticImageData;
  alt: string;
  /** Stock stand-in to be replaced with the client's own photography. */
  placeholder?: boolean;
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
  /** The café's reply, Cormorant italic. */
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
  answer: string;
  line: string;
  photo: Photo;
  placeholder: boolean;
};
