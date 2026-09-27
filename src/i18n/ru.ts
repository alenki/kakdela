import type { Mood } from "@/content/types";
import type { RouteKey } from "@/content/routes";
import { groupDigits, plural } from "@/lib/format";
import { NBSP } from "@/lib/typograf";

// Every UI string on the homepage. Content data (menu, cafés, reviews) lives in src/content.
// «вы» throughout.
// Strings are plain text: components typeset them with `typograf()` (src/lib/typograf.ts) where they
// render. The few explicit NBSPs below hold a built phrase together (a number and its unit, a КБЖУ
// figure and its name).

const cafesCount = (n: number) => `${n} ${plural(n, "кофейня", "кофейни", "кофеен")}`;
const metres = (n: number) => `${n}${NBSP}м`;

export const ru = {
  meta: {
    title: "Как дела? Кофейни в Нальчике и Владикавказе: specialty-кофе, завтраки, десерты",
    description:
      "Девять кофеен «Как дела?» в Нальчике и Владикавказе. Specialty-кофе, завтраки весь день и десерты. Каждый день с 7:30.",
    h1: "Как дела? Кофейни в Нальчике и Владикавказе: specialty-кофе и завтраки весь день",
    // Structured data (JSON-LD).
    brand: "Как дела?",
    cafeName: (address: string) => `Как дела? (${address})`,
    cuisine: ["Кофе", "Завтраки", "Десерты"],
  },
  a11y: {
    skip: "Перейти к содержанию",
    home: "«Как дела?», на главную",
    mainNav: "Основная навигация",
    city: "Город",
    padGroup: "Как у вас дела? Выберите ответ",
    newTab: "(откроется в новой вкладке)",
  },
  city: { nalchik: "Нальчик", vladikavkaz: "Владикавказ", count: { nalchik: 7, vladikavkaz: 2 } },
  status: {
    everyDay: "Каждый день с 07:30",
    open: "открыто",
    until: "до",
    closed: "закрыто",
    opensAt: "откроемся в 07:30",
  },
  dayparts: [
    { from: 0, to: 7.5, text: "Мы спим. Откроемся в 07:30" },
    { from: 7.5, to: 11, text: "Доброе утро. Завтраки уже на столах" },
    { from: 11, to: 16, text: "Самое время для второго кофе" },
    { from: 16, to: 20, text: "Дальше слаще" },
    { from: 20, to: 22.5, text: "Вечер. Шахматы, медовик, разговоры" },
    { from: 22.5, to: 24, text: "Ещё успеете на последний капучино" },
  ],
  nav: {
    menu: "Меню",
    sections: "Разделы",
    close: "Закрыть",
    links: [
      { key: "menu", label: "Меню" },
      { key: "locations", label: "Кофейни" },
      { key: "events", label: "События" },
      { key: "about", label: "О нас" },
      { key: "delivery", label: "Доставка" },
      { key: "catering", label: "Кейтеринг" },
      { key: "careers", label: "Работа у нас" },
      { key: "bonus", label: "Бонусная карта" },
      { key: "certificates", label: "Сертификаты" },
    ] satisfies { key: RouteKey; label: string }[],
    halal: "Халяль и намазхана во всех кофейнях",
  },
  actionBar: { label: "Быстрые действия", menu: "Меню", nearest: "Кофейни", delivery: "Доставка" },
  hero: {
    prompt: "Как у вас? Оторвите честно",
    q: "Как дела?",
    allTorn: "Все ответы разобрали.",
    reprint: "Повесить новые",
    yesterday: (label: string) => `Вчера было «${label}». А сегодня?`,
    toMenu: "В меню",
    actions: { menu: "Смотреть меню", nearest: "Где ближайшая" },
    // A dish with no price in the guest's city yet (also read by the breakfasts, coffee and evening menus).
    askLater: "уточняйте в кофейне",
    torn: "оторвано",
  },
  team: {
    q: "Команда",
    lead: "Каждая приятная встреча, каждый душевный разговор начинается с фразы «как дела?». И мы хотели, чтобы наша сеть кофеен стала местом именно таких встреч.",
    // Three of the four are the team and one is a regular, so the label names both.
    listLabel: "Отвечают команда и гости",
    placeholderNote: "Фото и ответы временные: скоро здесь будет наша команда.",
  },
  breakfasts: {
    q: "Завтраки",
    a: "Что на завтрак?",
    lead: "На вопрос «как дела?» у нас шесть ответов, и каждый можно заказать весь день.",
    // Labels the city switch; without JS it reads «Цены: Нальчик».
    prices: "Цены",
    extras: "Ещё на завтрак",
    links: { menu: "Всё меню, с КБЖУ", delivery: "Заказать домой" },
    lightNote: "В некоторых кофейнях меню лёгкое: уточняйте на странице кофейни.",
    /** One line under the photo (numbers come formatted). Each figure keeps its name: it wraps only after a «·». */
    kbju: (kcal: number | string, b: string, zh: string, u: string) =>
      `${kcal}${NBSP}ккал · белки${NBSP}${b}${NBSP}г · жиры${NBSP}${zh}${NBSP}г · углеводы${NBSP}${u}${NBSP}г`,
  },
  coffee: {
    q: "Кофе",
    a: "А с кофе мы не шутим.",
    lead: "Эспрессо, фильтр, альтернатива и авторские напитки. Зёрна берём у обжарщиков, которым мы доверяем.",
    listTitle: "Фирменное",
    links: { menu: "Вся барная карта", delivery: "Доставка через Яндекс Еду" },
  },
  locations: {
    q: "Кофейни",
    a: "Ближе, чем кажется.",
    nearest: "Какая ближе ко мне?",
    nearestTag: (km: string) => `ближе всех · ${km} км`,
    nearestTagMetres: (n: number) => `ближе всех · ${metres(n)}`,
    // Distances in the «Какая ближе ко мне?» messages (the unit never leaves its number).
    metres,
    km: (n: string) => `${n}${NBSP}км`,
    away: (dist: string) => `${dist} от вас`,
    found: (address: string, dist: string) => `Ближе всех: ${address} (${dist}). Остальные идут от ближней к дальней.`,
    far: (dist: string) => `До ближайшей ${dist}. Но это ближе, чем кажется.`,
    denied: "Не получилось определить, где вы. Выберите город.",
    locating: "Ищем…",
    cafesCount,
    rating: (score: number, count: number) =>
      `${score.toFixed(1).replace(".", ",")} · ${groupDigits(count)} ${plural(count, "оценка", "оценки", "оценок")}`,
    more: "Подробнее",
    // The full timetable lives in the opened row; the row itself says only «открыто · до 23:00».
    hours: (open: string, close: string) => `Каждый день ${open}–${close}`,
    route: "Маршрут",
    call: "Позвонить",
    // Follows the rating: «5,0 · 626 оценок на Яндекс Картах ↗».
    onMaps: "на Яндекс Картах",
    all: "Все кофейни",
    common: "Во всех кофейнях: халяль и намазхана, Wi‑Fi и розетки, можно с ноутбуком, меню на английском.",
    reply: {
      none: "Девять кофеен, два города, и все открываются в 7:30.",
      good: "Заходите поделиться хорошим в любую из девяти.",
      hungry: "Все завтраки есть в любой кофейне с полной кухней.",
      tired: "Эспрессо-тоник ждёт уже с 7:30.",
      meh: "Заходите, поднимем настроение.",
    } satisfies Record<Mood | "none", string>,
  },
  reviews: {
    q: "Отзывы",
    a: "Как вам у нас?",
    // Beside the big 5,0 (the most-rated café's score), built from src/content/cafes.
    figures: {
      flagship: (street: string, count: number) =>
        `${street} · ${groupDigits(count)} ${plural(count, "оценка", "оценки", "оценок")}`,
      range: (min: string, max: string) => `От ${min} до ${max} в девяти кофейнях`,
      total: (count: number) => `${groupDigits(count)} ${plural(count, "оценка", "оценки", "оценок")} на Яндекс Картах`,
    },
    // A quote's credit: «Байсултанова, 1 · Яндекс Карты ↗», the source as the link.
    source: "Яндекс Карты",
    all: "Читать все отзывы",
  },
  evening: {
    // The section's accessible name: the heading names only the desserts.
    label: "Вечер: десерты и шахматы",
    q: "Вечером",
    a: "Дальше слаще.",
    lead: "Три десерта к любому кофе и шахматный блиц в Нальчике.",
    allDesserts: "Все десерты",
    vote: "Голосовать за дату турнира",
  },
  footer: {
    services: "Сервисы",
    phone: "Телефон",
    lessMotion: "Меньше движения",
    moreMotion: "Больше движения",
    copyright: "© 2026 «Как дела?» · Нальчик · Владикавказ",
    photoCredit: "Часть фото временные (CC0)",
    utility: "Халяль и намазхана во всех кофейнях · Wi‑Fi · меню на английском · каждый день с 07:30",
  },
  // The /menu page: the waiter's side of the conversation.
  menu: {
    meta: {
      title: "Меню кофеен «Как дела?»: завтраки весь день, кофе и десерты",
      description:
        "Всё меню «Как дела?» в Нальчике и Владикавказе: завтраки весь день, кофе, чай, лимонады и десерты. Цены для вашего города, объёмы и КБЖУ.",
    },
    q: "Меню",
    a: "Что будете?",
    lead: "Всё, что мы готовим и варим, с ценами вашего города, объёмами и КБЖУ.",
    // The answers index: its accessible name (the visible label is t.hero.q, or t.hero.yesterday).
    answersNav: "Блюда по ответам",
    // Under today's torn answer in the index. Never red.
    today: "ваш ответ сегодня",
    contents: "Содержание",
    runNav: "Разделы меню",
    count: {
      kuhnya: (n: number) => `${n} ${plural(n, "блюдо", "блюда", "блюд")}`,
      bar: (n: number) => `${n} ${plural(n, "напиток", "напитка", "напитков")}`,
      deserty: (n: number) => `${n} ${plural(n, "десерт", "десерта", "десертов")}`,
    },
    everywhere: "во всех кофейнях",
    // «в 3 из 7 кофеен»: after «из N» always the genitive plural.
    kitchenShare: (n: number, total: number) => `в ${n} из ${total} кофеен`,
    cityGen: { nalchik: "Нальчика", vladikavkaz: "Владикавказа" },
    chapters: {
      kuhnya: {
        q: "Кухня",
        a: "С чего начнём?",
        lead: (n: number, total: number, cityGen: string) =>
          `Завтраки подаём весь день. Полная кухня есть в ${n} из ${total} кофеен ${cityGen}, в остальных меню лёгкое.`,
      },
      bar: {
        q: "Бар",
        a: "Как обычно?",
        lead: "Эспрессо, фильтр и авторские напитки, матча, чаи, лимонады и фреши. Во всех кофейнях по одной цене.",
      },
      deserty: {
        q: "Десерты",
        a: "К кофе что-нибудь?",
        lead: (n: number) =>
          `${n} ${plural(n, "десерт", "десерта", "десертов")} к любому кофе, есть без сахара и без глютена. Во всех кофейнях по одной цене.`,
      },
    },
    fullKitchen: "Полная кухня",
    ml: (n: string) => `${n}${NBSP}мл`,
    kcal: (k: string) => `${k}${NBSP}ккал`,
    // Screen-reader form of a two-size price: «200 мл за 240 ₽, 300 мл за 270 ₽» (prices come from rub()).
    sizesSpoken: (ml1: number, p1: string, ml2: number, p2: string) => `${ml1}${NBSP}мл за ${p1}, ${ml2}${NBSP}мл за ${p2}`,
    note: "Состав, КБЖУ и цены иногда меняются: уточняйте в кофейне.",
  },
  notFound: {
    label: "Ошибка 404",
    title: "Ещё варим. Загляните чуть позже.",
    lead: "Такой страницы пока нет. Меню, адреса и часы работы есть на главной.",
    home: "На главную",
    telegram: "Новости в Telegram",
    maps: "Кофейни на Яндекс Картах",
  },
} as const;

export type Dictionary = typeof ru;
