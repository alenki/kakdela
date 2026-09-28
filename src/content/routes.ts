// Every internal link goes through here. Pages marked "planned" are not built yet: they render
// the voiced 404 until their phase ships, and links to them are not prefetched.
export type RouteStatus = "live" | "planned";

export const routes = {
  home: { href: "/", status: "live" },
  menu: { href: "/menu", status: "planned" },
  locations: { href: "/locations", status: "planned" },
  events: { href: "/events", status: "planned" },
  about: { href: "/about", status: "planned" },
  delivery: { href: "/delivery", status: "planned" },
  catering: { href: "/catering", status: "planned" },
  careers: { href: "/careers", status: "planned" },
  bonus: { href: "/bonus", status: "planned" },
  feedback: { href: "/feedback", status: "live" },
  certificates: { href: "/bonus#sertifikaty", status: "planned" },
} as const satisfies Record<string, { href: string; status: RouteStatus }>;

export type RouteKey = keyof typeof routes;

export const external = {
  telegram: "https://t.me/kakdelaKD",
  instagram: "https://www.instagram.com/kakdela.coffee/",
  yandexNalchik: "https://yandex.ru/maps/30/nalchik/chain/kak_dela_/35254358097/",
  yandexVladikavkaz: "https://yandex.ru/maps/33/vladikavkaz/chain/kak_dela_/35254358097/",
} as const;

export const yandexOrg = (oid: string) => `https://yandex.ru/maps/org/kak_dela_/${oid}/`;
export const yandexReviews = (oid: string) => `https://yandex.ru/maps/org/kak_dela_/${oid}/reviews/`;
export const yandexRoute = (lat: number, lon: number) => `https://yandex.ru/maps/?rtext=~${lat},${lon}&rtt=auto`;
