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
    // The question in words, where the /menu page sets it (the hero's own headline is the logo).
    q: "Как дела?",
    allTorn: "Все ответы разобрали.",
    reprint: "Повесить новые",
    yesterday: (label: string) => `Вчера было «${label}». А сегодня?`,
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
    // After a person's caption while the guest's answer in the hero is the same: «вся сеть · как у вас».
    same: "как у вас",
  },
  breakfasts: {
    q: "Завтраки",
    a: "Что на завтрак?",
    // Labels the city switch; without JS it reads «Цены: Нальчик».
    prices: "Цены",
    // The /menu page's kitchen and desserts read these two.
    extras: "Ещё на завтрак",
    links: { menu: "Посмотреть меню", delivery: "Заказать домой" },
    /** One line under the photo (numbers come formatted). Each figure keeps its name: it wraps only after a «·». */
    kbju: (kcal: number | string, b: string, zh: string, u: string) =>
      `${kcal}${NBSP}ккал · белки${NBSP}${b}${NBSP}г · жиры${NBSP}${zh}${NBSP}г · углеводы${NBSP}${u}${NBSP}г`,
  },
  coffee: {
    q: "Кофе",
    // The question over the poster's answer (the exchange reads «А кофе?» / «А с кофе мы не шутим.»).
    ask: "А кофе?",
    a: "А с кофе мы не шутим.",
    // What the barista writes on the cup before any drink is chosen, in their own lower case.
    defaultNote: "как дела?",
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
    route: "Маршрут",
    call: "Позвонить",
    all: "Все кофейни",
    common: "Во всех кофейнях: халяль и намазхана, Wi‑Fi и розетки, можно с ноутбуком, меню на английском.",
  },
  reviews: {
    q: "Отзывы",
    a: "Как вам у нас?",
    // The 5,0 on the slip beside the title is only paper to a screen reader: this line says whose score
    // it is (the most-rated café's, from src/content/cafes).
    rating: (street: string, score: string) => `${street}: ${score} на Яндекс Картах`,
    all: "Читать все отзывы",
    // The pile of notes: the arrows, and the live line that says where the guest is and what the quote says.
    prev: "Предыдущий отзыв",
    next: "Следующий отзыв",
    shown: (i: number, n: number, text: string) => `Отзыв ${i} из ${n}: ${text}`,
  },
  evening: {
    // The section's accessible name: the title alone doesn't say what the section is.
    label: "Вечер: десерты",
    q: "Вечером",
    a: "Дальше слаще.",
    allDesserts: "Все десерты",
  },
  // «Задача недели» (src/components/sections/Chess.tsx): a mate in two from src/content/puzzles.ts, new
  // every Monday, then the blitz. The café answers every move in the transcript.
  chess: {
    q: "Шахматы",
    a: "Задача недели.",
    lead: "Белые начинают и дают мат в два хода. Новая задача каждый понедельник.",
    // Heard after the mate (the live region): the café asks, and the grade lands as a torn tab.
    ask: "Как дела?",
    // Over the blitz facts (chessEvent in src/content/people.ts).
    invite: "Решили? Приходите на блиц.",
    vote: "Голосовать за дату турнира",
    // Russian notation: «Кf3», «Фxf7#», «0-0».
    letters: { k: "Кр", q: "Ф", r: "Л", b: "С", n: "К", x: "x" },
    // The café's lines in the transcript.
    noMate: "Мата нет.",
    stalemate: "Пат.",
    mate: "Мат.",
    // One text button, in turn.
    hint: "Подсказка",
    solution: "Показать решение",
    again: "Решить заново",
    // Screen readers: the board is a grid of squares, «e4, белый ферзь, можно взять».
    board: "Шахматная доска",
    boardHelp: "Стрелки выбирают клетку, Enter или пробел берёт фигуру и ставит её.",
    pieces: {
      w: { k: "белый король", q: "белый ферзь", r: "белая ладья", b: "белый слон", n: "белый конь", p: "белая пешка" },
      b: { k: "чёрный король", q: "чёрный ферзь", r: "чёрная ладья", b: "чёрный слон", n: "чёрный конь", p: "чёрная пешка" },
    },
    selected: "выбрана",
    target: "можно пойти",
    capture: "можно взять",
    hinted: "подсказка",
    // The pending row «1. ?» as heard.
    pending: (n: number) => `Ход ${n}: ваш ход`,
    // Spoken moves: «ферзь с d1 на h5», «слон с a2 берёт на e6, шах».
    say: {
      names: { k: "король", q: "ферзь", r: "ладья", b: "слон", n: "конь", p: "пешка" },
      from: "с",
      to: "на",
      takes: "берёт на",
      castle: { k: "короткая рокировка", q: "длинная рокировка" },
      promotes: { q: "превращается в ферзя", r: "превращается в ладью", b: "превращается в слона", n: "превращается в коня" },
      check: "шах",
      mate: "мат",
      you: "Вы",
      cafe: "Кофейня",
      yourMove: "Ваш ход.",
      back: "Фигуры вернулись. Ваш ход.",
      hint: (piece: string) => `Подсказка: ходит ${piece}.`,
      solution: "Решение",
      white: "Белые",
      black: "Чёрные",
      last: "Последний ход чёрных",
    },
  },
  footer: {
    services: "Сервисы",
    phone: "Телефон",
    copyright: "© 2026 «Как дела?» · Нальчик · Владикавказ",
    utility: "Халяль и намазхана во всех кофейнях · Wi‑Fi · меню на английском · каждый день с 07:30",
  },
  // The runner (src/components/game): the homepage section after the evening, and the 404.
  game: {
    q: "Игра",
    a: "Игра со стаканчиком.",
    // The playing field's accessible name (role="application").
    stage: "Игровое поле",
    score: "Счёт",
    best: "Рекорд",
    start: "Играть",
    pause: "Пауза",
    resume: "Продолжить",
    restart: "Заново",
    again: "Ещё раз",
    paused: "На паузе",
    over: "Стаканчик опрокинулся",
    newBest: "Новый рекорд",
    hintTouch: "Нажмите на поле, чтобы прыгнуть, или держите палец внизу поля, чтобы пригнуться.",
    // Read once, when a run ends; never during play.
    result: (score: number, best: number, isNew: boolean) =>
      isNew
        ? `Новый рекорд: ${groupDigits(score)}.`
        : `Стаканчик опрокинулся. Счёт ${groupDigits(score)}, рекорд ${groupDigits(best)}.`,
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
    // «в 3 из 7 кофеен»: after «из N» always the genitive plural; «3 из 7» never breaks.
    kitchenShare: (n: number, total: number) => `в ${n}${NBSP}из ${total} кофеен`,
    cityGen: { nalchik: "Нальчика", vladikavkaz: "Владикавказа" },
    chapters: {
      kuhnya: {
        q: "Кухня",
        a: "С чего начнём?",
        // The rest: «в остальных» for several cafés, «в другой» for one, nothing when every café has the kitchen.
        lead: (n: number, total: number, cityGen: string) =>
          `Завтраки подаём весь день. Полная кухня есть в ${n}${NBSP}из ${total} кофеен ${cityGen}` +
          (total - n > 1 ? ", в остальных меню лёгкое." : total - n === 1 ? ", в другой меню лёгкое." : "."),
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
    lead: "Такой страницы пока нет. Всё меню есть на своей странице, адреса и часы работы на главной.",
    menu: "Всё меню",
    home: "На главную",
    telegram: "Новости в Telegram",
    maps: "Кофейни на Яндекс Картах",
    // The runner under the head: a side offer, set as a label.
    game: "Игра со стаканчиком",
  },
} as const;

export type Dictionary = typeof ru;
