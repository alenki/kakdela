import { photos } from "./photos";
import type { Cafe, City } from "./types";

// Sources: Yandex Maps org pages (ratings as of 26.09.2026), kakdelacoffee.ru contacts, Telegram.
// Closing times follow Yandex; three cafés close at 23:00 (old site says 00:00, so verify).
export const cafes: Cafe[] = [
  {
    id: "bajsultanova-1", city: "nalchik", address: "ул. Байсултанова, 1", alias: "флагман",
    coords: { lat: 43.478967, lon: 43.585515 }, open: "07:30", close: "23:00",
    phone: "+79280826111", phoneDisplay: "+7 (928) 082-61-11",
    rating: 5.0, ratingsCount: 626, yandexOrgId: "231916384633",
    tags: ["все завтраки", "летняя веранда", "можно с ноутбуком"], kitchen: "full",
    photo: photos.cafeBajsultanova1, verify: { verified: false, note: "Закрытие 23:00 или 00:00" },
  },
  {
    id: "lermontova-4", city: "nalchik", address: "ул. Лермонтова, 4", alias: "«Саральп»",
    coords: { lat: 43.476805, lon: 43.603682 }, open: "07:30", close: "23:00",
    phone: "+79380820782", phoneDisplay: "+7 (938) 082-07-82",
    rating: 5.0, ratingsCount: 160, yandexOrgId: "205101204327",
    tags: ["детская комната", "летняя и зимняя веранды", "все завтраки"], kitchen: "full",
    photo: photos.cafeLermontova4, verify: { verified: false, note: "Закрытие 23:00 или 00:00" },
  },
  {
    id: "shogencukova-19", city: "nalchik", address: "пр. Шогенцукова, 19", alias: "новая",
    coords: { lat: 43.481052, lon: 43.606337 }, open: "07:30", close: "23:00",
    phone: "+79380773525", phoneDisplay: "+7 (938) 077-35-25",
    rating: 5.0, ratingsCount: 48, yandexOrgId: "93920355406",
    tags: ["шахматный блиц", "летняя веранда", "лёгкое меню"], kitchen: "light",
    photo: photos.cafeShogencukova19, verify: { verified: false, note: "Закрытие 23:00 или 00:00 (на двери на фото открытия: 7:30–00:00)" },
  },
  {
    id: "lermontova-59", city: "nalchik", address: "ул. Лермонтова, 59",
    coords: { lat: 43.48576, lon: 43.590532 }, open: "07:30", close: "00:00",
    phone: "+79380773908", phoneDisplay: "+7 (938) 077-39-08",
    rating: 4.8, ratingsCount: 292, yandexOrgId: "225938785000",
    tags: ["все завтраки", "летняя веранда"], kitchen: "full",
    photo: photos.cafeLermontova59, verify: { verified: true },
  },
  {
    id: "lenina-32", city: "nalchik", address: "пр. Ленина, 32",
    coords: { lat: 43.484104, lon: 43.607886 }, open: "07:30", close: "00:00",
    phone: "+79380773532", phoneDisplay: "+7 (938) 077-35-32",
    rating: 4.9, ratingsCount: 383, yandexOrgId: "108832598632",
    tags: ["лёгкое меню", "в центре"], kitchen: "light",
    photo: photos.cafeLenina32, verify: { verified: true },
  },
  {
    id: "shogencukova-14", city: "nalchik", address: "пр. Шогенцукова, 14", alias: "Долинск",
    coords: { lat: 43.456158, lon: 43.584882 }, open: "07:30", close: "00:00",
    phone: "+79380773462", phoneDisplay: "+7 (938) 077-34-62",
    rating: 5.0, ratingsCount: 437, yandexOrgId: "162006323773",
    tags: ["лёгкое меню", "мороженое"], kitchen: "light",
    photo: photos.cafeShogencukova14, verify: { verified: true },
  },
  {
    id: "atazhukina-10v", city: "nalchik", address: "ул. Атажукина, 10В",
    coords: { lat: 43.476047, lon: 43.569247 }, open: "07:30", close: "00:00",
    phone: "+79380773487", phoneDisplay: "+7 (938) 077-34-87",
    rating: 4.9, ratingsCount: 226, yandexOrgId: "70497343476",
    tags: ["лёгкое меню", "веранда"], kitchen: "light",
    photo: photos.cafeAtazhukina10v, verify: { verified: true },
  },
  {
    id: "kujbysheva-3", city: "vladikavkaz", address: "ул. Куйбышева, 3",
    coords: { lat: 43.030683, lon: 44.681272 }, open: "07:30", close: "00:00",
    phone: "+79280773249", phoneDisplay: "+7 (928) 077-32-49",
    rating: 5.0, ratingsCount: 214, yandexOrgId: "222967832370",
    tags: ["все завтраки", "мороженое"], kitchen: "full",
    photo: photos.cafeKujbysheva3, verify: { verified: true },
  },
  {
    id: "plieva-32", city: "vladikavkaz", address: "ул. Генерала Плиева, 32",
    coords: { lat: 43.019127, lon: 44.673946 }, open: "07:30", close: "00:00",
    phone: "+79380773396", phoneDisplay: "+7 (938) 077-33-96",
    rating: 4.9, ratingsCount: 323, yandexOrgId: "113992671204",
    tags: ["лёгкое меню"], kitchen: "light",
    photo: photos.cafePlieva32, verify: { verified: true },
  },
];

export const cafesByCity = (city: City) => cafes.filter((c) => c.city === city);
export const flagship: Record<City, Cafe> = {
  nalchik: cafes[0],
  vladikavkaz: cafes.find((c) => c.id === "kujbysheva-3")!,
};

export const ratingsTotal = { ratings: 2709, reviews: 1460, min: 4.8, max: 5.0 };
