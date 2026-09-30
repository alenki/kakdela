// English words for the content modules, laid over them as they load in the English build (overlay.ts; each
// module ends with `if (EN) overlay(…)`). Keyed by the modules' own ids and keys. Only words: prices,
// phones, hours and coordinates stay in the Russian modules. src/i18n/en.test.ts checks every id.
// The answers are still dishes: a tab, its dish and the café's reply are translated together, and a tab
// word is at most 12 characters (sized to «Как в сказке»).

export { privacyEn } from "./privacy";
export { fullMenuEn } from "./full-menu";

export const answersEn = {
  "luchshe-vseh": {
    label: "Never better",
    item: { name: "Breakfast “Never Better”" },
    reply: "Same here! Fried eggs, homemade sausages, fresh vegetables and mushroom sauce. That’s the “Never Better” breakfast.",
  },
  "kak-v-skazke": {
    label: "Like a dream",
    item: { name: "Breakfast “Like a Dream”" },
    reply: "Then the “Like a Dream” breakfast is for you: scrambled eggs with shrimp.",
  },
  "vsyo-shik": {
    label: "All peachy",
    item: { name: "Breakfast “Peachy”" },
    reply: "Peachy. Brown and wild rice, chicken in cream sauce. That’s the “Peachy” breakfast.",
  },
  "10-iz-10": {
    label: "10 out of 10",
    item: { name: "Breakfast “10 out of 10”" },
    reply: "Agreed. Brioche, salmon, avocado and our own hollandaise.",
  },
  "est-hochu": {
    label: "Starving",
    item: { name: "Breakfast “Hearty”" },
    reply: "We’ll feed you right away: eggs, croutons, hummus, mozzarella and cherry tomatoes. That’s the “Hearty” breakfast.",
  },
  normalno: {
    label: "Fine",
    item: { name: "Shakshuka" },
    reply: "Fine? That’s already good. With shakshuka it gets even better.",
  },
  sonno: {
    label: "Sleepy",
    item: { name: "Espresso tonic" },
    reply: "We get it. An espresso tonic wakes you up from the first sip.",
  },
  "tak-sebe": {
    label: "So-so",
    item: { name: "“Sweeter Still”" },
    reply: "It happens. Have a “Sweeter Still”: the name is no accident.",
  },
};

export const menuEn = {
  breakfasts: {
    "luchshe-vseh": { name: "Never Better", desc: "Fried eggs, smoked homemade sausages, fresh vegetables, mushroom sauce." },
    "kak-v-skazke": { name: "Like a Dream", desc: "Scrambled eggs with shrimp, warm toast and fresh herbs." },
    otlichnyj: { name: "Excellent", desc: "Omelette with mozzarella, avocado toast, fresh salad and sauce." },
    shik: { name: "Peachy", desc: "Brown and wild rice, chicken in cream sauce, our signature sauce." },
    "10-iz-10": { name: "10 out of 10", desc: "Brioche with salmon, cream cheese and avocado under our own hollandaise." },
    kapitalnyj: { name: "Hearty", desc: "Eggs, croutons, hummus, mozzarella, frisée and cherry tomatoes." },
  },
  extras: {
    shakshuka: { name: "Shakshuka" },
    syrniki: { name: "Syrniki" },
    pancakes: { name: "Mini pancakes" },
  },
  // The barista's lower-case notes on the cup: a question, then the drink.
  signatureDrinks: {
    kapuchino: { name: "Cappuccino", cupNote: { ask: "a classic?", say: "cappuccino" } },
    klever: { name: "“Clover”", desc: "Alternative brew.", cupNote: { ask: "something new?", say: "clover" } },
    v60: { name: "V60 pour-over", desc: "Hand-brewed, one cup at a time.", cupNote: { ask: "no rush?", say: "V60" } },
    "stanciya-mir": {
      name: "“Mir Station”",
      desc: "Filter coffee with our own mountain-herb syrup.",
      cupNote: { ask: "to the hills?", say: "mir station" },
    },
    "dalshe-slashe": { name: "“Sweeter Still”", desc: "Our own, with grapefruit.", cupNote: { ask: "sweet tooth?", say: "sweeter still" } },
    "espresso-tonik": { name: "Espresso tonic", desc: "Espresso, tonic, ice, citrus.", cupNote: { ask: "hot out?", say: "espresso tonic" } },
  },
  desserts: {
    medovik: { name: "Medovik", desc: "Honey cake: honey layers, custard, salted caramel, walnut." },
    brauni: { name: "Brownie", desc: "Dark chocolate and pecan." },
    "san-sebastyan": { name: "San Sebastián", desc: "Basque cheesecake with a dark crust." },
  },
  cherryPie: { name: "Cherry pie with a scoop of ice cream" },
  season: { title: "Beautiful Far Away!", feature: { name: "Golden Clover" } },
};

// Addresses as English map apps show them; tags in the same order as the Russian ones (about.ts finds
// cafés by them in either language).
export const cafesEn = {
  "bajsultanova-1": { address: "Baysultanova St, 1", alias: "flagship", tags: ["all breakfasts", "summer terrace"] },
  "lermontova-4": { address: "Lermontova St, 4", alias: "“Saralp”", tags: ["kids’ room", "summer and winter terraces", "all breakfasts"] },
  "shogencukova-19": { address: "Shogentsukova Ave, 19", alias: "new", tags: ["blitz chess", "summer terrace", "light menu"] },
  "lermontova-59": { address: "Lermontova St, 59", tags: ["all breakfasts", "summer terrace"] },
  "lenina-32": { address: "Lenina Ave, 32", tags: ["light menu", "downtown"] },
  "shogencukova-14": { address: "Shogentsukova Ave, 14", alias: "Dolinsk", tags: ["light menu", "ice cream"] },
  "atazhukina-10v": { address: "Atazhukina St, 10V", tags: ["light menu", "terrace"] },
  "kujbysheva-3": { address: "Kuybysheva St, 3", tags: ["all breakfasts", "ice cream"] },
  "plieva-32": { address: "Generala Plieva St, 32", tags: ["light menu"] },
};

// The reviews are real guests' words from Yandex Maps, translated as they are (t.reviews says so).
export const peopleEn = {
  reviews: {
    elbrus: {
      text: "We were passing through Nalchik on the way to Elbrus… The breakfast place made an impression… On the way back we came again on purpose.",
    },
    warmth: { text: "What matters is that look as you walk in, that warmth when they greet you." },
    family: {
      text: "A great place for the whole family, a bright interior, cozy… We ordered “Never Better” and “Like a Dream”… The baristas make a decent espresso.",
    },
  },
  team: {
    "barista-1": { name: "Barista", role: "Baysultanova, 1", line: "There’s a new Ethiopian on filter today. Come in, I’ll pour you a taste." },
    "barista-2": { name: "Barista", role: "Shogentsukova, 19", line: "The first cappuccino at 07:30, the first blitz game in the evening." },
    trainer: { name: "Barista trainer", role: "all cafés", line: "We train every barista so a cup tastes the same in any of the nine cafés." },
    guest: { name: "Regular guest", role: "since 2023", line: "They remember what coffee I drink and ask how I am. And mean it." },
  },
  chessEvent: {
    body: "Several rounds, games of up to ten minutes. The winner gets a 5,000 ₽ gift card.",
    when: "We announce the dates on Telegram",
  },
};

export const feedbackEn = {
  // «Всё шик» and «Так себе» are the notice's own tabs, so they read as the tabs do.
  tones: {
    shik: {
      label: "All peachy",
      ask: "What did you like?",
      line: "Nice to hear. Tell us what you liked and we’ll pass it on to whoever did it.",
      reply: (at: string | null) => `Thank you! We’ll pass it on to the team${at ? ` on ${at}` : ""}: they’ll be pleased.`,
    },
    ideya: {
      label: "An idea",
      ask: "What’s the idea?",
      line: "Go on. We talk good ideas over as a whole team.",
      reply: (at: string | null) => `Thanks, noted. We’ll talk it over with the team${at ? ` on ${at}` : ""}.`,
    },
    "tak-sebe": {
      label: "So-so",
      ask: "What went wrong?",
      line: "Sorry to hear it. Tell us what happened and leave a contact: we’ll sort it out and reply.",
      reply: (at: string | null) =>
        at ? `Sorry it turned out that way. We’ll pass it on to the café on ${at} and sort it out.` : "Sorry it turned out that way. We’ll sort it out.",
    },
    vopros: {
      label: "A question",
      ask: "What’s the question?",
      line: "Ask away. Maybe the answer is already below.",
      reply: () => "Thanks for the question.",
    },
  },
  noTone: { ask: "What would you like to tell us?", line: "We’re listening. Short or long, either is fine.", reply: "Thanks for writing." },
  // `short` is at most three words; a link's label, found in `a`, is set on those words.
  faq: {
    chasy: {
      q: "What time do you open?",
      short: "At 07:30.",
      a: "Every day. We close at 23:00 or at midnight, depending on the café.",
      link: { label: "Each café’s hours" },
    },
    zavtraki: {
      q: "Is breakfast only in the morning?",
      short: "All day.",
      a: "Not every café has all the breakfasts: some have a lighter menu.",
      link: { label: "menu" },
    },
    noutbuk: { q: "Can I work on a laptop?", short: "Sure.", a: "Every café has Wi‑Fi and sockets." },
    halyal: { q: "Is it halal?", short: "Yes.", a: "Halal and a prayer room in every café." },
    english: { q: "Is there an English menu?", short: "Yes.", a: "In every café." },
    dostavka: { q: "Do you deliver?", short: "Yes.", a: "Through Yandex Eats.", link: { label: "Delivery" } },
    blic: {
      q: "When is the blitz chess?",
      short: "We’ll announce it.",
      a: "We announce the dates on Telegram. Several rounds, games of up to ten minutes.",
      link: { label: "Telegram" },
    },
    keitering: { q: "Will you come to our event?", short: "We will.", a: "We do catering.", link: { label: "catering" } },
    rabota: { q: "I’d like to work with you.", short: "Come on in.", a: "We’d be glad to meet you.", link: { label: "Careers" } },
    svoy: {
      q: "Didn’t find your question?",
      short: "Ask away.",
      a: "Write a note: we’ll reply if you leave a phone number or an email.",
      link: { label: "Write a note" },
    },
  },
};

// Alt text, by the key in photos.ts. Dishes and streets read as they do on the English pages.
export const photosEn: Record<string, { alt: string }> = {
  luchsheVseh: { alt: "The “Never Better” breakfast: fried eggs, homemade sausages, fresh vegetables and mushroom sauce" },
  otlichnyj: { alt: "The “Excellent” breakfast: omelette with mozzarella, avocado toast, salad and sauce" },
  kapitalnyj: { alt: "The “Hearty” breakfast: eggs, croutons, hummus, salad and cherry tomatoes" },
  syrniki: { alt: "Syrniki on a bed of sour cream under cherry sauce" },
  espressoTonik: { alt: "Espresso tonic with ice and citrus" },
  dalsheSlashe: { alt: "Our own “Sweeter Still” drink with grapefruit" },
  klever: { alt: "“Clover” coffee in a glass carafe" },
  stanciyaMir: { alt: "Our “Mir Station” filter coffee with a creamy top" },
  kapuchino: { alt: "Cappuccino with latte art" },
  zolotojKleverok: { alt: "The “Golden Clover” drink with a clover lollipop on a lace doily" },
  medovik: { alt: "Medovik honey cake on a dark plate" },
  brauni: { alt: "Brownie with pecans" },
  sanSebastyan: { alt: "San Sebastián cheesecake with chocolate sauce" },
  vishnevyjPirog: { alt: "Cherry pie with a scoop of ice cream" },
  cafeBajsultanova1: { alt: "The café’s front and terrace on Baysultanova St, 1" },
  cafeLermontova59: { alt: "Inside the café on Lermontova St, 59: the “Kak dela?” sign over the bar" },
  cafeLenina32: { alt: "The café on Lenina Ave, 32" },
  cafeShogencukova14: { alt: "The café on Shogentsukova Ave, 14" },
  cafeAtazhukina10v: { alt: "The café with a terrace on Atazhukina St, 10V" },
  cafeLermontova4: { alt: "The front of the “Saralp” café on Lermontova St, 4" },
  cafeKujbysheva3: { alt: "A mural on the wall of the café on Kuybysheva St, 3, Vladikavkaz" },
  cafePlieva32: { alt: "The café on Generala Plieva St, 32, Vladikavkaz" },
  desyatIzDesyati: { alt: "The “10 out of 10” breakfast: brioche with salmon and avocado under hollandaise, arugula and cherry tomatoes" },
  kakVSkazke: { alt: "The “Like a Dream” breakfast: scrambled eggs with shrimp and green peas, quinoa, broccoli and cherry tomatoes" },
  shik: { alt: "The “Peachy” breakfast: brown and wild rice, chicken in cream sauce, fresh vegetables and rye bread" },
  shakshuka: { alt: "Shakshuka: eggs in tomatoes with peppers, cream cheese and toast" },
  team1: { alt: "A barista pours filter coffee from a flask into a branded mug" },
  team2: { alt: "Cold coffee poured from a bottle into a branded “Kak dela?” cup with ice" },
  team3: { alt: "A barista in an apron holds a portafilter of fresh ground coffee by the grinder" },
  team4: { alt: "A guest in a green sweater holds a branded “Kak dela?” cup" },
  cafeShogencukova19: { alt: "The “Kak dela?” sign over the café’s glass front on Shogentsukova Ave, 19" },
  ovsyanayaKasha: { alt: "Oatmeal with banana, strawberries and blueberries" },
  risovayaKasha: { alt: "Rice porridge with strawberries and blueberries" },
  talbina: { alt: "Talbina with dates and walnuts" },
  pankejki: { alt: "Pancakes with cream, blueberries and berry sauce" },
  pokeSKuricej: { alt: "Chicken poke: rice, chicken fillet, egg, cherry tomatoes and edamame" },
  pokeSSyomgoj: { alt: "Salmon poke: rice, salmon, pepper, red cabbage, corn, edamame and sesame sauce" },
  boulSKrevetkami: { alt: "Bowl with quinoa, shrimp, avocado, pesto, cherry tomatoes, radish and lime" },
  boulSKuricej: { alt: "Chicken bowl: chickpeas, chicken fillet, avocado, cherry tomatoes, lime and herbs" },
  sendvichSKuricej: { alt: "Chicken sandwich, country-style potatoes and sauce" },
  sendvichSSyomgoj: { alt: "Salmon sandwich, country-style potatoes and sauce" },
  sendvichSIndejkoj: { alt: "Turkey sandwich, fries and sauce" },
  sendvichSPryanojGovyadinoj: { alt: "Spiced beef sandwich, country-style potatoes and sauce" },
  rollSKuricej: { alt: "Chicken wrap in lavash, cut in half" },
  rollSSyomgoj: { alt: "Salmon wrap in lavash, cut in half" },
  pastaSKuricej: { alt: "Pasta with chicken, mushrooms and parmesan, cherry tomatoes and green oil" },
  pastaSKrevetkami: { alt: "Pasta with shrimp in pesto, parmesan and cherry tomatoes" },
  trajfl: { alt: "Trifle in a jar: chocolate crumble, cream, pistachio and blueberries" },
  tortBeze: { alt: "Meringue cake with cream and strawberries" },
  pannaKotta: { alt: "Panna cotta with raspberry jam in a jar" },
  tiramisu: { alt: "Tiramisu in a jar with cocoa" },
  tartSMaskarponeIMalinoj: { alt: "A slice of mascarpone and raspberry tart topped with flaked almonds" },
  dubajskijBatonchik: { alt: "Dubai bar in milk chocolate with pistachios" },
  snikersPp: { alt: "A healthier “Snickers” bar in milk chocolate with peanuts" },
  bauntiPp: { alt: "A healthier “Bounty” bar in milk chocolate" },
  deniz: { alt: "“Deniz” sweets in milk chocolate with sea salt" },
  syrokSoSgushchenkoj: { alt: "Curd bars with dulce de leche in milk chocolate" },
  syrokShokoladnyj: { alt: "Chocolate curd bars in glaze with a crunchy crumble" },
  finikiVShokolade: { alt: "Dates in milk chocolate with pistachio crumble" },
  moti: { alt: "Colorful mochi on a plate" },
};
