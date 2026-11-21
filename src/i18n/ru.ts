import type { RouteKey } from "@/content/routes";
import type { City } from "@/content/types";
import { groupDigits, plural } from "@/lib/format";
import { NBSP } from "@/lib/typograf";

// Every UI string on the homepage. Content data (menu, cafés, reviews) lives in src/content.
// «вы» throughout.
// Strings are plain text: components typeset them with `typograf()` (src/lib/typograf.ts) where they
// render. The few explicit NBSPs below hold a built phrase together (a number and its unit, a КБЖУ
// figure and its name).

const cafesCount = (n: number) => `${n} ${plural(n, "кофейня", "кофейни", "кофеен")}`;
const metres = (n: number) => `${n}${NBSP}м`;
/** «План Нальчика», «Кофейни Владикавказа»: the cities in the genitive, for /locations and /menu. */
const cityGen = { nalchik: "Нальчика", vladikavkaz: "Владикавказа" } as const satisfies Record<City, string>;
/** «в Нальчике», «во Владикавказе»: where a café is, for /locations. */
const cityIn = { nalchik: "в Нальчике", vladikavkaz: "во Владикавказе" } as const satisfies Record<City, string>;
/** When every café opens: the status line and the /locations lead say it the same way. */
const everyDay = "Каждый день с 07:30";

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
    everyDay,
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
      { key: "home", label: "Главная" },
      { key: "menu", label: "Меню" },
      { key: "about", label: "О нас" },
      { key: "locations", label: "Кофейни" },
      { key: "feedback", label: "Обратная связь" },
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
  // The /menu page: the waiter's «Что будете?», the notice turned over, the table, three chapters.
  menu: {
    meta: {
      title: "Меню кофеен «Как дела?»: завтраки весь день, кофе и десерты",
      description:
        "Всё меню «Как дела?» в Нальчике и Владикавказе: завтраки весь день, кофе, чай, лимонады и десерты. Цены для вашего города, объёмы и КБЖУ.",
    },
    q: "Меню",
    a: "Что будете?",
    lead: "Всё, что мы готовим и варим, с ценами вашего города, объёмами и КБЖУ.",
    // The notice's back: its tabs and its sheet are the page's contents (the nav's name).
    contents: "Содержание меню",
    everywhere: "во всех кофейнях",
    // «в 3 из 7 кофеен»: after «из N» always the genitive plural; «3 из 7» never breaks.
    kitchenShare: (n: number, total: number) => `в ${n}${NBSP}из ${total} кофеен`,
    // In the price slot of a dish served in one city only, while the other city is on show.
    only: { nalchik: "только в Нальчике", vladikavkaz: "только во Владикавказе" } satisfies Record<City, string>,
    chapters: {
      kuhnya: {
        q: "Кухня",
        a: "С чего начнём?",
        // The rest: «в остальных» for several cafés, «в другой» for one, nothing when every café has the kitchen.
        lead: (n: number, total: number, city: City) =>
          `Завтраки подаём весь день. Полная кухня есть в ${n}${NBSP}из ${total} кофеен ${cityGen[city]}` +
          (total - n > 1 ? ", в остальных меню лёгкое." : total - n === 1 ? ", в другой меню лёгкое." : "."),
      },
      bar: {
        q: "Бар",
        a: "Что будете пить?",
        lead: "Эспрессо, фильтр и авторские напитки, матча, чаи, лимонады и фреши. Во всех кофейнях по одной цене.",
      },
      deserty: {
        q: "Десерты",
        a: "К кофе что-нибудь?",
        lead: (n: number) =>
          `${n} ${plural(n, "десерт", "десерта", "десертов")} к любому кофе, есть без сахара и без глютена. Во всех кофейнях по одной цене.`,
      },
    },
    ml: (n: string) => `${n}${NBSP}мл`,
    kcal: (k: string) => `${k}${NBSP}ккал`,
    // Screen-reader form of a two-size price: «200 мл за 240 ₽, 300 мл за 270 ₽» (prices come from rub()).
    sizesSpoken: (ml1: number, p1: string, ml2: number, p2: string) => `${ml1}${NBSP}мл за ${p1}, ${ml2}${NBSP}мл за ${p2}`,
    note: "Состав, КБЖУ и цены иногда меняются: уточняйте в кофейне.",
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
    privacy: "Политика конфиденциальности",
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
    // The two pads under the field on a touch screen (hidden from screen readers: the keys are the controls there).
    jump: "Прыжок",
    duck: "Пригнуться",
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
    // The guest's line, set in the logo's lettering on two lines («А у вас» over «как дела»): every letter of it
    // must be one src/lib/lettering.ts draws.
    ask: "А у вас как дела?",
    // The café's answer, on the sign that hangs from the ask's «?» (broken at its last space: two lines).
    a: "Спасибо, что спросили.",
    // The sign turned over is the café's door sign: open from 07:30, shut from midnight (Moscow time).
    sign: {
      open: "Открыто",
      openNote: "каждый день с 07:30",
      closed: "Закрыто",
      closedNote: "откроемся в 07:30",
    },
    now: {
      ask: "А прямо сейчас?",
      // The answer is the part of the day it is in Moscow (t.dayparts). Without JS the page can't know the hour.
      fallback: "Каждый день с 07:30",
      // The ruler: a day from midnight to midnight, the red hand at the minute it is now.
      ruler: "Сутки в кофейнях",
      now: "сейчас",
    },
    street: {
      ask: "А где вы?",
      a: "Девять дверей, один вопрос.",
      // A café whose photo is still a stand-in: the sign on paper instead of someone else's street.
      soon: "Фото скоро",
      all: "Все кофейни",
      nearest: "Где ближайшая",
    },
    own: {
      ask: "Что у вас своё?",
      a: "Голландез, сироп из горных трав и названия.",
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
  // The /locations page: «Кофейни» / «Где встретимся?», the third line of the conversation (the homepage asks
  // «Как дела?», the menu «Что будете?»). Reused from elsewhere: the heading's label (t.locations.q), the city
  // captions (t.city, t.locations.cafesCount), «Какая ближе ко мне?» with its messages and distances
  // (t.locations.*), «Маршрут», «Позвонить», the line every café shares (t.locations.common), «Всё меню»
  // (t.notFound.menu) and the share sheet's title (t.meta.cafeName).
  locationsPage: {
    meta: {
      title: "Адреса кофеен «Как дела?» в Нальчике и Владикавказе",
      description:
        "Семь кофеен «Как дела?» в Нальчике и две во Владикавказе: адреса на плане города, часы работы, телефоны и маршрут до каждой. Каждый день с 07:30.",
    },
    a: "Где встретимся?",
    // The café answers its own question, in the team's words («в любой из девяти кофеен»).
    // Each count stays with its city.
    lead: `В любой из девяти: семь${NBSP}в Нальчике, две${NBSP}во Владикавказе. ${everyDay}.`,
    // The row's link to the café's reviews: «5,0 · 626 оценок на Яндекс Картах».
    rating: (score: number, count: number) =>
      `${score.toFixed(1).replace(".", ",")} · ${groupDigits(count)}${NBSP}${plural(count, "оценка", "оценки", "оценок")} на Яндекс${NBSP}Картах`,
    plan: {
      // The print's alt text. The list beside it is the readable version of the plan.
      label: (city: City, n: number) => `План ${cityGen[city]}: ${cafesCount(n)} «Как дела?»`,
      // The scale bar: «500 м», «1 км», «1,5 км».
      scale: (m: number) => (m < 1000 ? metres(m) : `${String(m / 1000).replace(".", ",")}${NBSP}км`),
      // The guest's mark, only where it falls on the sheet.
      you: "Вы здесь",
      // The ODbL credit as openstreetmap.org words it in Russian, linked to its copyright page.
      credit: "© участники OpenStreetMap",
    },
    invite: {
      // A text button among each row's ways. The question lives in the message, not on the button.
      label: "Позвать сюда",
      // The guest's own message, the address as friends say it («Лермонтова, 4»). Not typografed: the site doesn't set it.
      text: (street: string) => `Встретимся в «Как дела?» на ${street}?`,
      // No share sheet: the question and the link were copied together.
      copied: "Скопировано",
      // Neither the share sheet nor the clipboard worked: the link waits in a field beside the words, selected.
      shareFailed: "Не получилось отправить. Вот ссылка:",
      copyFailed: "Не получилось скопировать. Вот ссылка:",
      linkLabel: "Ссылка для друга",
    },
    // The row of the café an invitation opened (/locations?vstrecha#id), in the tag slot. Never red.
    invited: "вас позвали сюда",
    invitedAway: (dist: string) => `вас позвали сюда · ${dist}`,
    invitedFound: (address: string, dist: string) => `Вас позвали на ${address}. Отсюда ${dist}.`,
    invitedFoundClosed: (address: string, dist: string, open: string) =>
      `Вас позвали на ${address}. Отсюда ${dist}. Сейчас там закрыто до ${open}.`,
    // «Какая ближе ко мне?» at night: the nearest café that is still open, and the one that is nearer but closed.
    nearestOpenTag: (dist: string) => `ближе всех из открытых · ${dist}`,
    foundOpen: (open: string, dist: string, close: string, closed: string) =>
      `Ближе всех из открытых: ${open} (${dist}), до ${close}. Кофейня на ${closed} ближе, но уже закрыта.`,
    foundAllClosed: (address: string, dist: string, open: string) =>
      `Ближе всех: ${address} (${dist}). Сейчас мы закрыты, откроемся в ${open}.`,
    // Out of town: which city, and how far (the homepage's «Но это ближе, чем кажется.» plays on its own title).
    far: (city: City, dist: string) => `Ближайшая кофейня ${cityIn[city]}, до неё ${dist}.`,
    // The city's chain on the map, under its list (without JS both cities show, so each names its own).
    onMaps: (city: City) => `Кофейни ${cityGen[city]} на Яндекс${NBSP}Картах`,
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
  // «Обратная связь» (/feedback): a note written on the café's pad, and the café's answer. The four
  // tones with their questions and replies, and the questions answered below, are in
  // src/content/feedback.ts.
  feedback: {
    meta: {
      title: "Обратная связь · «Как дела?»",
      description:
        "Напишите кофейням «Как дела?» в Нальчике и Владикавказе: благодарность, идея, жалоба или вопрос. Мы читаем каждую записку.",
    },
    title: "Скажите честно.",
    // The pad: the form's accessible name, then its printed rows.
    pad: "Записка для кофейни",
    tone: "О чём записка?",
    where: "Где это было?",
    sign: "Подпись",
    contact: "Как ответить",
    contactHint: "Телефон или почта, если нужен ответ",
    // The consent is its own tick on the note (152-FZ art. 9, a separate document since 01.09.2025): the
    // box, then the consent's text and the policy, each on its own page.
    consent: "Даю согласие на обработку персональных данных",
    consentText: "Текст согласия",
    policy: "Политика конфиденциальности",
    send: "Отправить записку",
    sending: "Отправляем…",
    again: "Написать ещё",
    left: (n: number) => `Осталось ${n} ${plural(n, "знак", "знака", "знаков")}`,
    errors: {
      empty: "Напишите хотя бы пару слов.",
      long: `Слишком длинно: не больше 2${NBSP}000 знаков.`,
      unclear: "Не похоже на телефон или почту.",
      telegram: "Ответить в Telegram не сможем: оставьте телефон или почту.",
      missing: "Без согласия отправить записку не получится.",
      failed: "Не получилось отправить. Попробуйте ещё раз или позвоните в кофейню.",
    },
    // The café's side: the line to call if it can't wait.
    urgent: "Если срочно",
    // After the café's reply: how it will answer, from the contact left on the note.
    answerBy: { phone: "Ответим по телефону.", email: "Ответим на почту." },
    noContact: "Контакта нет, так что ответить не сможем. Но прочитаем обязательно.",
    // The note that landed on the café's side, as a screen reader names it, and its number, printed in
    // its corner so it can be quoted in a request about the data (/privacy).
    sent: (no: string) => `Ваша записка № ${no}`,
    number: (no: string) => `№${NBSP}${no}`,
    // «Есть вопрос»: the café points at the questions already answered.
    asked: "Уже спрашивали",
    faq: { q: "Вопросы", a: "Уже спрашивали.", lead: `Что гости спрашивают чаще${NBSP}всего и что мы отвечаем.` },
  },
  // The policy on personal data (/privacy) and the consent (/privacy/consent). Their text is
  // src/content/privacy.ts; these are the pages' own words.
  privacy: {
    meta: {
      title: "Политика конфиденциальности · «Как дела?»",
      description: "Какие персональные данные обрабатывают кофейни «Как дела?» на сайте, зачем, как долго и как их защищают.",
    },
    label: "Политика обработки персональных данных",
    title: "Что мы о вас знаем.",
    lead: "Только то, что вы сами напишете нам в записке. Настройки сайта остаются в вашем браузере.",
    brief: "Коротко",
    contents: "Содержание",
    edition: (date: string) => `Редакция от ${date}`,
    consent: "Текст согласия",
    // A blank still to be filled in, as a screen reader hears it: «ИНН, будет указан».
    blank: "будет указано",
    table: { key: "Ключ", what: "Что это", kept: "Сколько хранится" },
  },
  consent: {
    meta: {
      title: "Согласие на обработку персональных данных · «Как дела?»",
      description: "Согласие на обработку персональных данных, которое гость даёт, отправляя записку кофейням «Как дела?».",
    },
    label: "Согласие на обработку персональных данных",
    title: "Ваше согласие.",
    lead: "Его дают отдельно, отмечая согласие в записке перед отправкой. Без него записка не уйдёт.",
    policy: "Политика конфиденциальности",
  },
  // The New Year season («С наступающим!», src/lib/season.ts): the café's line at the end of the hero's reply,
  // by the Moscow date, and the bell in the header that turns the season's sounds on.
  season: {
    greet: { eve: "С наступающим!", ny: "С Новым годом!", xmas: "С Рождеством!", old: "Со старым Новым годом!" },
    sound: "Звук",
  },
} as const;

export type Dictionary = typeof ru;
