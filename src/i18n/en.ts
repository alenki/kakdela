import type { City } from "@/content/types";
import { NBSP } from "@/lib/typograf";
import type { Dictionary } from "./ru";

// The English build's words (NEXT_PUBLIC_LOCALE=en, see src/i18n/locale.ts), in ru.ts's shape. A key missing
// here falls back to the Russian one (src/i18n/index.ts), and src/i18n/en.test.ts lists what is missing:
// every string added to ru.ts needs its twin here.
// House style: the café is “Kak dela?” in running text, and says once (team.lead) that it means “how are
// you?”. The answers are still dishes. The 24-hour clock as on the doors, prices as «670 ₽», “quotes”, no
// em dashes. Anything measured on the Russian copy (the tabs, the coffee answer, the door) keeps its length.

/** ru.ts's shape with plain strings and numbers, every key optional. */
type Loose<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends (...args: infer A) => unknown
      ? (...args: A) => string
      : T extends readonly (infer U)[]
        ? readonly Loose<U>[]
        : { readonly [K in keyof T]?: Loose<T[K]> };

const group = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const s = (n: number, one: string, many: string) => (n === 1 ? one : many);
const cafesCount = (n: number) => `${n} ${s(n, "café", "cafés")}`;
const metres = (n: number) => `${n}${NBSP}m`;
const cityName = { nalchik: "Nalchik", vladikavkaz: "Vladikavkaz" } as const satisfies Record<City, string>;
const everyDay = "Open daily from 07:30";

export const en: Loose<Dictionary> = {
  meta: {
    title: "Kak dela? Cafés in Nalchik and Vladikavkaz: specialty coffee, breakfast, desserts",
    description:
      "Nine “Kak dela?” cafés in Nalchik and Vladikavkaz. Specialty coffee, breakfast all day and desserts. Open daily from 07:30.",
    h1: "Kak dela? Cafés in Nalchik and Vladikavkaz: specialty coffee and breakfast all day",
    brand: "Kak dela?",
    cafeName: (address) => `Kak dela? (${address})`,
    cuisine: ["Coffee", "Breakfast", "Desserts"],
  },
  a11y: {
    skip: "Skip to content",
    home: "“Kak dela?”, home page",
    mainNav: "Main navigation",
    city: "City",
    padGroup: "How are you? Pick an answer",
    newTab: "(opens in a new tab)",
  },
  city: { nalchik: "Nalchik", vladikavkaz: "Vladikavkaz" },
  status: {
    everyDay,
    open: "open",
    until: "until",
    closed: "closed",
    opensAt: "opens at 07:30",
  },
  dayparts: [
    { from: 0, to: 7.5, text: "We’re asleep. Opening at 07:30" },
    { from: 7.5, to: 11, text: "Good morning. Breakfast is on the tables" },
    { from: 11, to: 16, text: "Just the time for a second coffee" },
    { from: 16, to: 20, text: "It only gets sweeter" },
    { from: 20, to: 22.5, text: "Evening. Chess, honey cake, conversation" },
    { from: 22.5, to: 24, text: "Still time for a last cappuccino" },
  ],
  nav: {
    menu: "Menu",
    sections: "Sections",
    close: "Close",
    links: [
      { key: "home", label: "Home" },
      { key: "menu", label: "Menu" },
      { key: "about", label: "About us" },
      { key: "locations", label: "Cafés" },
      { key: "feedback", label: "Feedback" },
      { key: "delivery", label: "Delivery" },
      { key: "catering", label: "Catering" },
      { key: "careers", label: "Careers" },
      { key: "bonus", label: "Bonus card" },
      { key: "certificates", label: "Gift cards" },
    ],
    halal: "Halal and a prayer room in every café",
  },
  actionBar: { label: "Quick actions", menu: "Menu", nearest: "Cafés", delivery: "Delivery" },
  hero: {
    prompt: "How are you? Tear one off, honestly",
    q: "How are you?",
    allTorn: "All the answers are gone.",
    reprint: "Put up new ones",
    yesterday: (label) => `Yesterday it was “${label}”. And today?`,
    actions: { menu: "See the menu", nearest: "Nearest café" },
    askLater: "ask at the café",
    torn: "torn off",
  },
  team: {
    q: "Team",
    lead: "Every good meeting, every heart-to-heart starts with “kak dela?”, Russian for “how are you?”. We wanted our cafés to be the place for exactly those meetings.",
    listLabel: "The team and our guests answer",
    same: "same as you",
  },
  breakfasts: {
    q: "Breakfast",
    a: "What’s for breakfast?",
    prices: "Prices",
    extras: "More for breakfast",
    links: { menu: "See the menu", delivery: "Order in" },
    kbju: (kcal, b, zh, u) =>
      `${kcal}${NBSP}kcal · protein${NBSP}${b}${NBSP}g · fat${NBSP}${zh}${NBSP}g · carbs${NBSP}${u}${NBSP}g`,
  },
  coffee: {
    q: "Coffee",
    ask: "And coffee?",
    // Measured headline: no longer than «А с кофе мы не шутим.» (coffee.css sets it gutter to gutter).
    a: "Coffee is no joke.",
    // On the cup the barista writes the café's own question, as it sounds.
    defaultNote: "kak dela?",
    lead: "Espresso, filter, alternative brews and our own signature drinks. We buy our beans from roasters we trust.",
    listTitle: "Signature",
    links: { menu: "Full drinks menu", delivery: "Delivery via Yandex Eats" },
  },
  menu: {
    meta: {
      title: "Kak dela? menu: breakfast all day, coffee and desserts",
      description:
        "The full “Kak dela?” menu in Nalchik and Vladikavkaz: breakfast all day, coffee, tea, lemonades and desserts. Prices for your city, sizes, calories and macros.",
    },
    q: "Menu",
    a: "What will it be?",
    lead: "Everything we cook and brew, with your city’s prices, sizes, calories and macros.",
    contents: "Menu contents",
    everywhere: "in every café",
    kitchenShare: (n, total) => `in ${n}${NBSP}of ${total} cafés`,
    only: { nalchik: "Nalchik only", vladikavkaz: "Vladikavkaz only" },
    chapters: {
      kuhnya: {
        q: "Kitchen",
        a: "Where shall we start?",
        lead: (n, total, city) =>
          `Breakfast is served all day. The full kitchen is in ${n}${NBSP}of ${total} cafés in ${cityName[city]}` +
          (total - n > 1 ? ", the others have a light menu." : total - n === 1 ? ", the other has a light menu." : "."),
      },
      bar: {
        q: "Bar",
        a: "What are you drinking?",
        lead: "Espresso, filter and signature drinks, matcha, teas, lemonades and fresh juices. The same price in every café.",
      },
      deserty: {
        q: "Desserts",
        a: "Something with your coffee?",
        lead: (n) => `${n} ${s(n, "dessert", "desserts")} for any coffee, some sugar-free and gluten-free. The same price in every café.`,
      },
    },
    ml: (n) => `${n}${NBSP}ml`,
    kcal: (k) => `${k}${NBSP}kcal`,
    sizesSpoken: (ml1, p1, ml2, p2) => `${ml1}${NBSP}ml for ${p1}, ${ml2}${NBSP}ml for ${p2}`,
    note: "Ingredients, calories and prices change now and then: ask at the café.",
  },
  locations: {
    q: "Cafés",
    a: "Closer than you think.",
    nearest: "Which one is nearest?",
    nearestTag: (km) => `nearest · ${km} km`,
    nearestTagMetres: (n) => `nearest · ${metres(n)}`,
    metres,
    km: (n) => `${n}${NBSP}km`,
    away: (dist) => `${dist} from you`,
    found: (address, dist) => `Nearest: ${address} (${dist}). The rest go from nearest to farthest.`,
    far: (dist) => `The nearest one is ${dist} away. But that’s closer than you think.`,
    denied: "We couldn’t tell where you are. Pick a city.",
    locating: "Looking…",
    cafesCount,
    route: "Directions",
    call: "Call",
    all: "All cafés",
    common: "In every café: halal and a prayer room, Wi‑Fi and sockets, laptops welcome, an English menu.",
  },
  reviews: {
    q: "Reviews",
    a: "How do you like it here?",
    rating: (street, score) => `${street}: ${score} on Yandex Maps`,
    // The guests wrote in Russian: the pile shows them translated, the link leads to the originals.
    all: "All reviews, in Russian",
    prev: "Previous review",
    next: "Next review",
    shown: (i, n, text) => `Review ${i} of ${n}, translated from Russian: ${text}`,
  },
  evening: {
    label: "Evening: desserts",
    q: "In the evening",
    a: "It only gets sweeter.",
    allDesserts: "All desserts",
  },
  chess: {
    q: "Chess",
    a: "Puzzle of the week.",
    lead: "White to play and mate in two. A new puzzle every Monday.",
    ask: "How are you?",
    invite: "Solved it? Come to the blitz.",
    vote: "Vote for the tournament date",
    letters: { k: "K", q: "Q", r: "R", b: "B", n: "N", x: "x" },
    noMate: "No mate.",
    stalemate: "Stalemate.",
    mate: "Mate.",
    hint: "Hint",
    solution: "Show the solution",
    again: "Solve again",
    board: "Chessboard",
    boardHelp: "Arrow keys pick a square; Enter or Space picks up a piece and puts it down.",
    pieces: {
      w: { k: "white king", q: "white queen", r: "white rook", b: "white bishop", n: "white knight", p: "white pawn" },
      b: { k: "black king", q: "black queen", r: "black rook", b: "black bishop", n: "black knight", p: "black pawn" },
    },
    selected: "selected",
    target: "can move here",
    capture: "can capture",
    hinted: "hint",
    pending: (n) => `Move ${n}: your move`,
    say: {
      names: { k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn" },
      from: "from",
      to: "to",
      takes: "takes on",
      castle: { k: "castles kingside", q: "castles queenside" },
      promotes: { q: "promotes to a queen", r: "promotes to a rook", b: "promotes to a bishop", n: "promotes to a knight" },
      check: "check",
      mate: "mate",
      you: "You",
      cafe: "Café",
      yourMove: "Your move.",
      back: "The pieces are back. Your move.",
      hint: (piece) => `Hint: the ${piece} moves.`,
      solution: "Solution",
      white: "White",
      black: "Black",
      last: "Black’s last move",
    },
  },
  footer: {
    services: "Services",
    phone: "Phone",
    copyright: "© 2026 “Kak dela?” · Nalchik · Vladikavkaz",
    privacy: "Privacy policy",
    utility: "Halal and a prayer room in every café · Wi‑Fi · English menu · open daily from 07:30",
  },
  game: {
    q: "Game",
    a: "The cup game.",
    stage: "Playing field",
    score: "Score",
    best: "Best",
    start: "Play",
    pause: "Pause",
    resume: "Resume",
    restart: "Restart",
    again: "Again",
    paused: "Paused",
    over: "The cup tipped over",
    newBest: "New best",
    hintTouch: "Tap the field to jump, or hold your finger at the bottom of the field to duck.",
    result: (score, best, isNew) =>
      isNew ? `New best: ${group(score)}.` : `The cup tipped over. Score ${group(score)}, best ${group(best)}.`,
  },
  about: {
    meta: {
      title: "About us · “Kak dela?”",
      description:
        "Nine “Kak dela?” cafés in Nalchik and Vladikavkaz: where the name comes from, what we make ourselves and who we’re glad to see. Open daily from 07:30.",
    },
    // Measured in src/lib/door.ts: «Thanks for » is the wall, «asking.» the door.
    ask: "And how are you?",
    a: "Thanks for asking.",
    now: {
      ask: "And right now?",
      fallback: everyDay,
      ruler: "A day at our cafés",
      now: "now",
    },
    street: {
      ask: "And where are you?",
      a: "Nine doors, one question.",
      soon: "Photo soon",
      all: "All cafés",
      nearest: "Nearest café",
    },
    own: {
      ask: "What do you make yourselves?",
      a: "Hollandaise, mountain-herb syrup and the names.",
      hollandaise: {
        name: "Hollandaise",
        desc: "Made in-house. Under it: brioche, salmon and avocado. That’s the “10 out of 10” breakfast.",
      },
      syrup: {
        name: "Mountain-herb syrup",
        desc: "Ours too. It turns a filter coffee into “Mir Station”.",
        link: "The “Mir Station” drink",
      },
      names: {
        name: "The names",
        desc: "Our breakfasts are named the way people answer “how are you?”: “Never Better”, “Like a Dream”, “Peachy” and “10 out of 10”.",
        link: "All breakfasts",
      },
    },
    welcome: {
      ask: "Who’s welcome here?",
      a: "Everyone who comes in.",
      listLabel: "What the cafés have",
      everywhere: "in every café",
      laptop: "laptops welcome",
      inCafes: (n) => `in ${n} ${s(n, "café", "cafés")}`,
      house: {
        halal: "Halal",
        prayer: "Prayer room",
        wifi: "Wi‑Fi and sockets",
        english: "English menu",
        kids: "Kids’ room",
        verandas: "Terraces",
        blitz: "Blitz chess",
      },
      careers: "Want to welcome guests with us?",
      careersLink: "Careers",
    },
    back: {
      a: "And you?",
      prompt: "Pick honestly",
      idle: "Whatever your answer, we’ve got something for it.",
      dish: "See it on the menu",
    },
  },
  locationsPage: {
    meta: {
      title: "“Kak dela?” café addresses in Nalchik and Vladikavkaz",
      description:
        "Seven “Kak dela?” cafés in Nalchik and two in Vladikavkaz: addresses on a city plan, opening hours, phone numbers and directions to each. Open daily from 07:30.",
    },
    a: "Where shall we meet?",
    lead: `At any of the nine: seven${NBSP}in Nalchik, two${NBSP}in Vladikavkaz. ${everyDay}.`,
    rating: (score, count) => `${score.toFixed(1)} · ${group(count)}${NBSP}${s(count, "rating", "ratings")} on Yandex${NBSP}Maps`,
    plan: {
      label: (city, n) => `Plan of ${cityName[city]}: ${cafesCount(n)} “Kak dela?”`,
      scale: (m) => (m < 1000 ? metres(m) : `${m / 1000}${NBSP}km`),
      you: "You are here",
      credit: "© OpenStreetMap contributors",
    },
    invite: {
      label: "Invite here",
      text: (street) => `Meet at “Kak dela?” on ${street}?`,
      copied: "Copied",
      shareFailed: "Couldn’t share it. Here’s the link:",
      copyFailed: "Couldn’t copy it. Here’s the link:",
      linkLabel: "Link for a friend",
    },
    invited: "you were invited here",
    invitedAway: (dist) => `you were invited here · ${dist}`,
    invitedFound: (address, dist) => `You were invited to ${address}. It’s ${dist} from here.`,
    invitedFoundClosed: (address, dist, open) =>
      `You were invited to ${address}. It’s ${dist} from here. It’s closed now, until ${open}.`,
    nearestOpenTag: (dist) => `nearest open · ${dist}`,
    foundOpen: (open, dist, close, closed) =>
      `Nearest open: ${open} (${dist}), until ${close}. The café on ${closed} is closer but already closed.`,
    foundAllClosed: (address, dist, open) => `Nearest: ${address} (${dist}). We’re closed now and open at ${open}.`,
    far: (city, dist) => `The nearest café is in ${cityName[city]}, ${dist} away.`,
    onMaps: (city) => `${cityName[city]} cafés on Yandex${NBSP}Maps`,
  },
  notFound: {
    label: "Error 404",
    // Two sentences: the 404 sets one per line.
    title: "Still brewing. Check back soon.",
    lead: "This page doesn’t exist yet. The full menu has a page of its own; addresses and hours are on the home page.",
    menu: "Full menu",
    home: "Home page",
    telegram: "News on Telegram",
    maps: "Cafés on Yandex Maps",
    game: "The cup game",
  },
  feedback: {
    meta: {
      title: "Feedback · “Kak dela?”",
      description:
        "Write to the “Kak dela?” cafés in Nalchik and Vladikavkaz: thanks, an idea, a complaint or a question. We read every note.",
    },
    title: "Tell us honestly.",
    pad: "A note for the café",
    tone: "What’s the note about?",
    where: "Where was it?",
    sign: "Signed",
    contact: "How to reply",
    contactHint: "Phone or email, if you’d like a reply",
    consent: "I consent to the processing of my personal data",
    consentText: "Consent text",
    policy: "Privacy policy",
    send: "Send the note",
    sending: "Sending…",
    again: "Write another",
    left: (n) => `${n} ${s(n, "character", "characters")} left`,
    errors: {
      empty: "Write at least a couple of words.",
      long: "Too long: 2,000 characters at most.",
      unclear: "That doesn’t look like a phone number or an email.",
      telegram: "We can’t reply on Telegram: leave a phone number or an email.",
      missing: "The note can’t go without your consent.",
      failed: "Couldn’t send it. Try again or call the café.",
    },
    urgent: "If it’s urgent",
    answerBy: { phone: "We’ll reply by phone.", email: "We’ll reply by email." },
    noContact: "There’s no contact, so we can’t reply. But we’ll read it, for sure.",
    sent: (no) => `Your note No. ${no}`,
    number: (no) => `No.${NBSP}${no}`,
    asked: "Already asked",
    faq: { q: "Questions", a: "Already asked.", lead: "What guests ask most often, and what we answer." },
  },
  privacy: {
    meta: {
      title: "Privacy policy · “Kak dela?”",
      description: "What personal data the “Kak dela?” cafés process on this site, why, for how long and how it is protected.",
    },
    label: "Personal data processing policy",
    title: "What we know about you.",
    lead: "Only what you write to us in a note yourself. The site’s settings stay in your browser. This is a translation: the Russian version is the one that applies.",
    brief: "In short",
    contents: "Contents",
    edition: (date) => `Version of ${date}`,
    consent: "Consent text",
    blank: "to be specified",
    table: { key: "Key", what: "What it is", kept: "How long it’s kept" },
  },
  consent: {
    meta: {
      title: "Consent to personal data processing · “Kak dela?”",
      description: "The consent to personal data processing a guest gives by sending a note to the “Kak dela?” cafés.",
    },
    label: "Consent to personal data processing",
    title: "Your consent.",
    lead: "It is given separately, by ticking the box on the note before sending it. Without it the note won’t go. This is a translation: the Russian version is the one that applies.",
    policy: "Privacy policy",
  },
};
