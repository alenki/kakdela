import type { Mood } from "@/content/types";
import type { RouteKey } from "@/content/routes";
import { groupDigits, plural } from "@/lib/format";
import { NBSP } from "@/lib/typograf";

// Every UI string on the homepage. Content data (menu, cafés, reviews) lives in src/content.
// «вы» throughout; «ты» appears only inside the quoted Telegram line.
// Strings are plain text: components typeset them with `typograf()` (src/lib/typograf.ts) where they
// render. The few explicit NBSPs below hold a built phrase together (a number and its unit, a move).

const cafesCount = (n: number) => `${n} ${plural(n, "кофейня", "кофейни", "кофеен")}`;
const metres = (n: number) => `${n}${NBSP}м`;

export const ru = {
  meta: {
    title: "Как дела? — кофейни в Нальчике и Владикавказе: specialty-кофе, завтраки, десерты",
    description:
      "Девять кофеен «Как дела?» в Нальчике и Владикавказе. Specialty-кофе, завтраки весь день и десерты. Каждый день с 7:30.",
    h1: "Как дела? — кофейни в Нальчике и Владикавказе: specialty-кофе и завтраки весь день",
    // Structured data (JSON-LD).
    brand: "Как дела?",
    cafeName: (address: string) => `Как дела? — ${address}`,
    cuisine: ["Кофе", "Завтраки", "Десерты"],
  },
  a11y: {
    skip: "Перейти к содержанию",
    home: "«Как дела?» — на главную",
    mainNav: "Основная навигация",
    city: "Город",
    padGroup: "Как у вас дела? Выберите ответ",
    newTab: "(откроется в новой вкладке)",
    rub: "рублей",
  },
  city: { nalchik: "Нальчик", vladikavkaz: "Владикавказ", count: { nalchik: 7, vladikavkaz: 2 } },
  status: {
    everyDay: "Каждый день с 07:30",
    now: { nalchik: "Сейчас в Нальчике", vladikavkaz: "Сейчас во Владикавказе" },
    open: "открыто",
    until: "до",
    closed: "закрыто",
    opensAt: "откроемся в 07:30",
    tillOpen: "До открытия",
    todayUntil: "Сегодня открыто до",
  },
  dayparts: [
    { from: 0, to: 7.5, text: "Мы спим. Откроемся в 07:30" },
    { from: 7.5, to: 11, text: "Доброе утро. Завтраки уже на столах" },
    { from: 11, to: 16, text: "Самое время для второго кофе" },
    { from: 16, to: 20, text: "Дальше — слаще" },
    { from: 20, to: 22.5, text: "Вечер. Шахматы, медовик, разговоры" },
    { from: 22.5, to: 24, text: "Ещё успеете на последний капучино" },
  ],
  nav: {
    menu: "Меню",
    sections: "Разделы",
    close: "Закрыть",
    links: [
      { key: "menu", label: "Меню", aside: "— Что будете?" },
      { key: "locations", label: "Кофейни", aside: "— Где вы?" },
      { key: "events", label: "События", aside: "— Что нового?" },
      { key: "about", label: "О нас", aside: "— Расскажете о себе?" },
      { key: "delivery", label: "Доставка", aside: "— А домой привезёте?" },
      { key: "catering", label: "Кейтеринг", aside: "— А на праздник?" },
      { key: "careers", label: "Работа у нас", aside: "— Возьмёте к себе?" },
      { key: "bonus", label: "Бонусная карта", aside: "— А постоянным гостям?" },
      { key: "certificates", label: "Сертификаты", aside: "— А в подарок?" },
    ] satisfies { key: RouteKey; label: string; aside: string }[],
    lang: { label: "Язык", ru: "RU", en: "EN", soon: "скоро" },
    halal: "Халяль и намазхана во всех кофейнях",
  },
  actionBar: { label: "Быстрые действия", menu: "Меню", nearest: "Кофейни", delivery: "Доставка" },
  hero: {
    cities: (n: number) => `Нальчик · Владикавказ — ${cafesCount(n)}`,
    prompt: "Как у вас? Оторвите честно",
    firstNote: "(да, такое правда есть в меню)",
    guessNote: "(угадываем по времени — оторвите свой)",
    allTorn: "Ответы разобрали. Новые — завтра с 7:30.",
    reprint: "Повесить новые",
    yesterday: (label: string) => `— Вчера было «${label}». А сегодня?`,
    toMenu: "В меню",
    actions: { menu: "Смотреть меню", nearest: "Где ближайшая", delivery: "Доставка" },
    scrollCue: "Заходите",
    priceNote: { nalchik: "цены — Нальчик", vladikavkaz: "цены — Владикавказ" },
    askLater: "уточняйте в кофейне",
    torn: "оторвано",
  },
  team: {
    q: "А у вас как дела?",
    lead: "Каждая приятная встреча, каждый душевный разговор начинается с фразы «как дела?» — и мы хотели, чтобы наша сеть кофеен стала местом именно таких встреч.",
    leadSource: "из нашей истории",
    // The brand's own question inside `lead`, lifted into the answer voice (must match it verbatim).
    phrase: "как дела?",
    // Three of the four are the team and one is a regular, so the label names both.
    listLabel: "Отвечают команда и гости",
    placeholderNote: "Фото и ответы — временные: скоро здесь будет наша команда.",
  },
  breakfasts: {
    q: "Что на завтрак?",
    kicker: "На вопрос «как дела?» у нас шесть ответов — и каждый можно заказать.",
    allDay: "завтраки весь день",
    // Reads into the city switch: «цены — [Нальчик | Владикавказ]».
    pricesFor: "цены —",
    after: { normal: "Нормально? Шакшука —", sweet: "Хочется сладкого? Сырники —", and: "и мини-панкейки —" },
    links: { menu: "Всё меню, с КБЖУ", delivery: "Заказать домой" },
    lightNote: "В некоторых кофейнях — лёгкое меню: уточняйте на странице кофейни.",
    kbjuLabels: { k: "ккал", b: "белки, г", zh: "жиры, г", u: "углеводы, г" },
    /** The card's two unbreakable groups (numbers come formatted): energy, then macros. */
    kbjuGroups: (kcal: number, b: string, zh: string, u: string) => [`КБЖУ · ${kcal} ккал`, `Б ${b} · Ж ${zh} · У ${u}`],
    kbjuInMenu: "КБЖУ — в полном меню",
    more: "Подробнее",
  },
  coffee: {
    q: "А кофе?",
    a: "А с кофе мы не шутим.",
    lead: "Эспрессо, фильтр, альтернатива и авторские напитки. Зёрна — от обжарщиков, которым мы доверяем.",
    cardTitle: "Фирменное",
    defaultNote: "как дела?",
    links: { menu: "Вся барная карта", delivery: "Доставка через Яндекс Еду" },
  },
  locations: {
    q: "Где вы?",
    a: "Ближе, чем кажется.",
    nearest: "Какая ближе ко мне?",
    nearestTag: (km: string) => `ближе всех · ${km} км`,
    nearestTagMetres: (n: number) => `ближе всех · ${metres(n)}`,
    // Distances in the «Какая ближе ко мне?» messages (the unit never leaves its number).
    metres,
    km: (n: string) => `${n}${NBSP}км`,
    away: (dist: string) => `${dist} от вас`,
    found: (address: string, dist: string) => `Ближе всех — ${address} (${dist}). Остальные — от ближней к дальней.`,
    far: (dist: string) => `До ближайшей — ${dist}. Но ближе, чем кажется.`,
    denied: "Не получилось определить, где вы. Выберите город.",
    locating: "Ищем…",
    cafesCount,
    rating: (score: number, count: number) =>
      `${score.toFixed(1).replace(".", ",")} · ${groupDigits(count)} ${plural(count, "оценка", "оценки", "оценок")}`,
    more: "Подробнее",
    tags: "Особенности кофейни",
    route: "Маршрут",
    call: "Позвонить",
    onMaps: "На Яндекс Картах",
    all: "Все кофейни",
    common: "Во всех кофейнях — халяль и намазхана, Wi‑Fi и розетки, можно с ноутбуком, меню на английском.",
    hours: "часы",
    peaks: { nalchik: "Эльбрус · 5 642 м", vladikavkaz: "Казбек · 5 054 м" },
    reply: {
      none: "Девять кофеен, два города — и все открываются в 7:30.",
      good: "Заходите поделиться хорошим — в любую из девяти.",
      hungry: "Все завтраки — в любой кофейне с полной кухней.",
      tired: "Эспрессо-тоник уже ждёт — с 7:30.",
      meh: "Заходите — поднимем настроение.",
    } satisfies Record<Mood | "none", string>,
  },
  reviews: {
    q: "Как вам у нас?",
    figures: {
      flagship: "Байсултанова, 1 — 5,0 по 626 оценкам",
      range: "все девять кофеен — от 4,8 до 5,0",
      total: "2 709 оценок на Яндекс Картах",
    },
    source: "Гость · Яндекс Карты",
    thanks: "Спасибо, что отвечаете. Всегда ваши, «Как дела?»",
    all: "Читать все отзывы",
  },
  evening: {
    label: "Вечер: десерты и шахматы",
    dessertsQ: "А на десерт?",
    dessertsA: "Дальше — слаще.",
    dessertsReply: "Три сладких ответа — к любому кофе.",
    railLabel: "Десерты",
    chessQ: "Партию?",
    chessA: "Блиц. До десяти минут.",
    notationLabel: "Партия в нотации",
    boardLabel:
      "Шахматная доска после ходов 1. Кf3 Кf6 2. Кe5 Кe4: белый конь на e5, чёрный конь на e4. Стрелки показывают путь коней: g1–f3, g8–f6, f3–e5, f6–e4.",
    // Set in the uppercase .label; the move keeps its case (files are lowercase: Кe4, not КЕ4) and
    // never splits.
    boardCaption: { before: "Позиция после", move: `2…${NBSP}Кe4`, after: "ход белых" },
    notation: [
      { move: "1. Кf3", line: "— Как дела?" },
      { move: "1… Кf6", line: "— Отлично. А у вас?" },
      { move: "2. Кe5", line: "— Лучше всех." },
      { move: "2… Кe4", line: "— Тогда сыграем?" },
    ],
    vote: "Голосовать за дату турнира",
    allDesserts: "Все десерты",
    kids: "1 сентября угощали детей мороженым во всех кофейнях. Спасибо, что пришли всей семьёй.",
  },
  footer: {
    kicker: "00:00 · Спокойной ночи",
    q: "Как дела?",
    goodnight: {
      good: "— Так держать. Заходите — расскажете.",
      hungry: "— Завтра с 7:30 накормим капитально.",
      tired: "— Тогда до завтра. Выспитесь — откроемся в 7:30.",
      meh: "— Завтра будет лучше. Дальше — слаще.",
      none: "— Не ответили? Ничего, спросим завтра в 7:30.",
    } satisfies Record<Mood | "none", string>,
    noAnswer: "…",
    signoffs: ["Всегда ваши, «Как дела?»", "Как всегда, с любовью, «Как дела?»", "До завтра. Ваши «Как дела?»"],
    doors: [
      { key: "delivery", q: "— А домой привезёте?", label: "Доставка" },
      { key: "catering", q: "— А на праздник?", label: "Кейтеринг" },
      { key: "bonus", q: "— А постоянным гостям?", label: "Бонусная карта" },
      { key: "certificates", q: "— А в подарок?", label: "Сертификаты" },
      { key: "careers", q: "— Возьмёте к себе?", label: "Работа у нас" },
    ] satisfies { key: RouteKey; q: string; label: string }[],
    doorsLabel: "Сервисы",
    social: "На связи",
    phone: "Телефон",
    navLabel: "Разделы сайта",
    telegram: { label: "Telegram", title: "how you doin’?", desc: "«мне хорошо, а тебе?»" },
    instagram: { label: "Instagram", handle: "@kakdela.coffee" },
    lessMotion: "Меньше движения",
    moreMotion: "Больше движения",
    copyright: "© 2026 «Как дела?» · Нальчик · Владикавказ",
    photoCredit: "Часть фото — временные (CC0)",
    utility: "Халяль и намазхана во всех кофейнях · Wi‑Fi · меню на английском · каждый день с 07:30",
  },
  notFound: {
    q: "— А где страница?",
    a: "— Ещё варим. Загляните чуть позже.",
    home: "На главную",
    telegram: "Новости — в Telegram",
    maps: "Кофейни на Яндекс Картах",
  },
} as const;

export type Dictionary = typeof ru;
