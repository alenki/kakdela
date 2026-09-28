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
    links: { menu: "Посмотреть меню" },
    /** One line under the photo (numbers come formatted). Each figure keeps its name: it wraps only after a «·». */
    kbju: (kcal: number, b: string, zh: string, u: string) =>
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
  // «О нас» (/about, src/components/about): the guest asks back, «А у вас как дела?», and the café answers,
  // one chapter at a time. Every heading is an exchange: the guest's question in the thin display voice
  // (`ask`), the café's answer in heavy display (`a`).
  about: {
    meta: {
      title: "О нас · «Как дела?»",
      description:
        "Девять кофеен «Как дела?» в Нальчике и Владикавказе: откуда название, что мы делаем сами и кому мы рады. Каждый день с 07:30.",
    },
    label: "О нас",
    // The guest's line. After a tear today it opens with that answer: «Сонно. А у вас как дела?».
    ask: "А у вас как дела?",
    a: "Спасибо, что спросили.",
    // After the founding line (t.team.lead), in the text face.
    lead: "Поэтому вопрос у нас везде: на вывесках, в названиях завтраков и даже на двери кухни.",
    door: "Дверь кухни · ул. Лермонтова, 59",
    now: {
      ask: "А прямо сейчас?",
      // The answer is the part of the day it is in Moscow (t.dayparts). Without JS the page can't know the hour.
      fallback: "Каждый день с 07:30",
      lead: "Все девять кофеен открываются в 07:30. Время московское, как в Нальчике и Владикавказе.",
      // The ruler: a day from midnight to midnight, the red hand at the minute it is now.
      ruler: "Сутки в кофейнях",
      now: "сейчас",
    },
    street: {
      ask: "А где вы?",
      a: "Девять дверей, один вопрос.",
      lead: "Семь кофеен в Нальчике и две во Владикавказе. Адреса разные, вопрос один.",
      // A café whose photo is still a stand-in: the sign on paper instead of someone else's street.
      soon: "Фото скоро",
      all: "Все кофейни",
      nearest: "Где ближайшая",
    },
    own: {
      ask: "Что у вас своё?",
      a: "Голландез, сироп из горных трав и названия.",
      lead: "Зёрна берём у обжарщиков, которым доверяем. А это делаем сами.",
      hollandaise: {
        name: "Голландез",
        desc: "Собственного приготовления. Под ним бриошь, сёмга и авокадо: это завтрак «10 из 10».",
      },
      syrup: {
        name: "Сироп из горных трав",
        desc: "Тоже свой. С ним фильтр становится «Станцией Мир».",
        link: "Напиток «Станция Мир»",
      },
      names: {
        name: "Названия",
        desc: "Завтраки называются так, как отвечают на «как дела?»: «Лучше всех», «Как в сказке», «Шик» и «10 из 10».",
        link: "Все завтраки",
      },
    },
    welcome: {
      ask: "Кому у вас рады?",
      a: "Всем, кто зайдёт.",
      // Under the guest's words: whose they are.
      said: (address: string) => `Гость кофейни на ${address}, Яндекс Карты`,
      listLabel: "Что есть в кофейнях",
      everywhere: "во всех кофейнях",
      laptop: "можно с ноутбуком",
      /** «в 5 кофейнях». */
      inCafes: (n: number) => `в ${n} ${plural(n, "кофейне", "кофейнях", "кофейнях")}`,
      house: {
        halal: "Халяль",
        prayer: "Намазхана",
        wifi: "Wi‑Fi и розетки",
        english: "Меню на английском",
        kids: "Детская комната",
        verandas: "Веранды",
        blitz: "Шахматный блиц",
      },
      careers: "Хотите встречать гостей вместе с нами?",
      careersLink: "Работа у нас",
    },
    // The café asks back, and the guest answers on one of the notice's slips (t.a11y.padGroup names the group).
    back: {
      a: "А у вас?",
      prompt: "Выберите честно",
      idle: "На любой ответ у нас найдётся что предложить.",
      dish: "Смотреть в меню",
    },
  },
  notFound: {
    label: "Ошибка 404",
    title: "Ещё варим. Загляните чуть позже.",
    lead: "Такой страницы пока нет. Меню, адреса и часы работы есть на главной.",
    home: "На главную",
    telegram: "Новости в Telegram",
    maps: "Кофейни на Яндекс Картах",
    // The runner under the head: a side offer, set as a label.
    game: "Игра со стаканчиком",
  },
} as const;

export type Dictionary = typeof ru;
