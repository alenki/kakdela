import { photos } from "./photos";
import type { Breakfast, Dessert, Drink, Photo, Price } from "./types";
import { EN } from "@/i18n/locale";
import { overlay } from "./en/overlay";
import { menuEn } from "./en";

const p = (nalchik: number | null, vladikavkaz: number | null = nalchik): Price => ({ nalchik, vladikavkaz });

// Breakfast names are answers to «Как дела?». Prices: Нальчик / Владикавказ (old site, 2026).
export const breakfasts: Breakfast[] = [
  {
    id: "luchshe-vseh",
    name: "Лучше всех",
    desc: "Глазунья, копчёные домашние колбаски, свежие овощи, грибной соус.",
    price: p(670, 710),
    kbju: { k: 646, b: 37.6, zh: 36.8, u: 34.6 },
    photo: photos.luchsheVseh,
    verify: { verified: true },
  },
  {
    id: "kak-v-skazke",
    name: "Как в сказке",
    desc: "Скрэмбл с креветками, тёплый тост и свежая зелень.",
    price: p(730, 770),
    photo: photos.kakVSkazke,
    verify: { verified: false, note: "Рецепт уточнить: на фото 2026 года скрэмбл с креветками и киноа, в тексте старого сайта прежний рецепт с цыплёнком" },
  },
  {
    id: "otlichnyj",
    name: "Отличный",
    desc: "Омлет с моцареллой, тост с авокадо, свежий салат и соус.",
    price: p(670, 710),
    photo: photos.otlichnyj,
    verify: { verified: false, note: "Состав сверить с меню" },
  },
  {
    id: "shik",
    name: "Шик",
    desc: "Бурый и дикий рис, цыплёнок в сливочном соусе, авторский соус.",
    price: p(730, 750),
    photo: photos.shik,
    verify: { verified: true },
  },
  {
    id: "10-iz-10",
    name: "10 из 10",
    desc: "Бриошь с сёмгой, творожным сыром и авокадо под голландезом собственного приготовления.",
    price: p(840, null),
    photo: photos.desyatIzDesyati,
    verify: { verified: false, note: "Цена во Владикавказе" },
  },
  {
    id: "kapitalnyj",
    name: "Капитальный",
    desc: "Яйца, гренки, хумус, моцарелла, фризе и черри.",
    price: p(670, 710),
    photo: photos.kapitalnyj,
    verify: { verified: true },
  },
];

// Off the homepage now; the /menu page still lists them (full-menu.ts).
export const extras = {
  shakshuka: { name: "Шакшука", price: p(550, null), photo: photos.shakshuka as Photo },
  syrniki: { name: "Сырники", price: p(380, null) },
  pancakes: { name: "Мини-панкейки", price: p(410, null) },
};

// The coffee card: the house signatures, each with the note the barista writes on the cup.
export const signatureDrinks: Drink[] = [
  {
    id: "kapuchino",
    name: "Капучино",
    price: { sizes: [240, 270] },
    cupNote: { ask: "классика?", say: "капучино" },
  },
  {
    id: "klever",
    name: "«Клевер»",
    desc: "Альтернативное заваривание.",
    price: p(280),
    cupNote: { ask: "новенького?", say: "клевер" },
  },
  {
    id: "v60",
    name: "Воронка V60",
    desc: "Ручное заваривание на одну чашку.",
    price: p(280),
    cupNote: { ask: "не спеша?", say: "V60" },
  },
  {
    id: "stanciya-mir",
    name: "«Станция Мир»",
    desc: "Фильтр, сироп из горных трав собственного приготовления.",
    price: p(280),
    cupNote: { ask: "в горы?", say: "станция мир" },
  },
  {
    id: "dalshe-slashe",
    name: "«Дальше слаще»",
    desc: "Авторский, с грейпфрутом.",
    price: p(350),
    cupNote: { ask: "сладкого?", say: "дальше слаще" },
  },
  {
    id: "espresso-tonik",
    name: "Эспрессо-тоник",
    desc: "Эспрессо, тоник, лёд, цитрус.",
    price: p(290),
    cupNote: { ask: "жарко?", say: "эспрессо-тоник" },
  },
];

export const desserts: Dessert[] = [
  {
    id: "medovik",
    name: "Медовик",
    desc: "Медовые коржи, заварной крем, солёная карамель, грецкий орех.",
    price: p(280),
    photo: photos.medovik,
    verify: { verified: false, note: "Состав сверить" },
  },
  {
    id: "brauni",
    name: "Брауни",
    desc: "Тёмный шоколад и пекан.",
    price: p(360),
    photo: photos.brauni,
    verify: { verified: true },
  },
  {
    id: "san-sebastyan",
    name: "Сан-Себастьян",
    desc: "Баскский чизкейк с тёмной корочкой.",
    price: p(440),
    photo: photos.sanSebastyan,
    verify: { verified: true },
  },
];

// Off the homepage now; the /menu page still lists it (full-menu.ts).
export const cherryPie = { name: "Вишнёвый пирог с шариком мороженого", price: p(350), photo: photos.vishnevyjPirog };

/** Seasonal slot. Summer 2026 «Прекрасное далёко!» has ended; keep inactive until the autumn menu is confirmed. */
export const season = {
  active: false,
  title: "Прекрасное далёко!",
  feature: { name: "Золотой клеверок", price: p(350), photo: photos.zolotojKleverok },
};

// The English build lays its words over these (src/content/en).
if (EN) overlay({ breakfasts, extras, signatureDrinks, desserts, cherryPie, season }, menuEn);
