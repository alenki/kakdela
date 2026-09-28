/**
 * The full «Как дела?» menu for the /menu page: kitchen, bar and desserts.
 *
 * Source: the client's old site kakdelacoffee.ru, crawled 27.09.2026 for all eight cafés. The dishes the
 * homepage already shows (menu.ts) are referenced, never copied: their name, price, description, photo and
 * verify note always come from menu.ts, and the price is the very same object, so both pages agree.
 *
 * Rules:
 * - Prices are rubles or null («уточняйте в кофейне»). «0.00 р.» and an empty «р.» on the old site are null.
 *   Kitchen: Нальчик is ул. Байсултанова, 1 (the flagship) unless the Нальчик cafés disagree, then null with a
 *   verify note; Владикавказ is ул. Куйбышева, 3 (its one full-kitchen café), and a dish missing there is null
 *   or limited with `cities`. Bar and dessert prices are the same in every café on the old site, so they use
 *   `same()` or cup sizes. The null prices in menu.ts win over the old site.
 * - The ended summer season «Прекрасное далёко!» is left out (`season.active` is false in menu.ts).
 * - КБЖУ is the old site's per-serving figure, always `verified: false` unless menu.ts carries it. Where it is
 *   clearly wrong (copied, no cup size, calories off by more than 20 %, per piece) it is not shown: the numbers
 *   stay in `draftNote` for the client check.
 * - `oldName`, `seenAt`, `draftNote` and `verify` are provenance for the client check: never render them.
 *   `oldName` keeps the old site's spelling, with its straight quotes set as «».
 * - Copy is plain: names go through keepWhole(typograf()), copy through typograf(), prices through rub().
 * - Photos: kitchen card and dessert vitrine thumbnails (scripts/fetch-photos.mjs). The bar is type only,
 *   apart from the signature drinks the homepage already shows.
 */
import { answers } from "./answers";
import { cafes } from "./cafes";
import { breakfasts, cherryPie, desserts, extras, signatureDrinks } from "./menu";
import { photos } from "./photos";
import type { Answer, Cafe, City, MenuCategory, MenuChapter, MenuChapterId, MenuItem, MenuSection, MenuSectionId, Photo, Price } from "./types";

// Builders: curated dishes are referenced from menu.ts. An overlay may only ADD what menu.ts lacks (volume,
// КБЖУ, a description for items without one, `signature`, provenance), never change name, price or copy.

const p = (nalchik: number | null, vladikavkaz: number | null): Price => ({ nalchik, vladikavkaz });
/** Bar and desserts: one price in every café of both cities. */
const same = (v: number | null): Price => ({ nalchik: v, vladikavkaz: v });

type Overlay = Omit<Partial<MenuItem>, "id" | "name" | "price" | "desc" | "curated">;
type OverlayWithDesc = Overlay & { desc?: string };

function find<T extends { id: string }>(list: T[], id: string, what: string): T {
  const x = list.find((i) => i.id === id);
  if (!x) throw new Error(`menu.ts: no ${what} «${id}»`);
  return x;
}

function fromBreakfast(id: string, o: Overlay = {}): MenuItem {
  const b = find(breakfasts, id, "breakfast");
  const nutrition = b.kbju ? { kbju: b.kbju, verified: b.verify.verified } : o.nutrition;
  return {
    ...o,
    id: b.id, name: b.name, desc: b.desc, price: b.price, photo: b.photo, verify: b.verify,
    ...(nutrition ? { nutrition } : {}),
    curated: true,
  };
}

function fromDrink(id: string, o: Overlay = {}): MenuItem {
  const d = find(signatureDrinks, id, "signature drink");
  return {
    ...o,
    id: d.id, name: d.name, price: d.price,
    ...(d.desc ? { desc: d.desc } : {}),
    ...(d.lang ? { lang: d.lang } : {}),
    curated: true,
  };
}

function fromDessert(id: string, o: Overlay = {}): MenuItem {
  const d = find(desserts, id, "dessert");
  return { ...o, id: d.id, name: d.name, desc: d.desc, price: d.price, photo: d.photo, verify: d.verify, curated: true };
}

/** `extras.*` and `cherryPie` have no id or description in menu.ts: the id is the anchor, `desc` comes from the old site. */
function fromExtra(id: string, x: { name: string; price: Price; photo?: Photo }, o: OverlayWithDesc = {}): MenuItem {
  return { ...(x.photo ? { photo: x.photo } : {}), ...o, id, name: x.name, price: x.price, curated: true };
}

const ALL_KITCHENS = ["bajsultanova-1", "lermontova-59", "kujbysheva-3"];
const NALCHIK_KITCHENS = ["bajsultanova-1", "lermontova-59"];

// The menu, in café-day order: kitchen (breakfast first), bar, desserts.

export const fullMenu: MenuChapter[] = [
  {
    id: "kuhnya", title: "Кухня", servedAt: "full-kitchen",
    categories: [
      {
        id: "zavtraki", title: "Завтраки", signature: true, items: [
          fromBreakfast("luchshe-vseh", { signature: true, seenAt: ALL_KITCHENS }),
          fromBreakfast("kak-v-skazke", { signature: true, seenAt: ALL_KITCHENS, draftNote: "КБЖУ старого сайта (516,6 ккал) относится к прежнему рецепту с цыплёнком и тёртым яйцом: не переносим." }),
          fromBreakfast("otlichnyj", { signature: true, seenAt: ALL_KITCHENS, draftNote: "На старом сайте два набора КБЖУ: 601 ккал (Байсултанова, 1: омлет с моцареллой, гранола и йогурт) и 586,4 ккал (Лермонтова, 59 и Куйбышева, 3: омлет, кремчиз, тост с гуакамоле). Рецепт в menu.ts смешивает оба: не переносим до сверки." }),
          fromBreakfast("shik", { signature: true, nutrition: { kbju: { k: 885.7, b: 41, zh: 53.6, u: 59.7 }, verified: false }, seenAt: ALL_KITCHENS }),
          fromBreakfast("10-iz-10", { signature: true, nutrition: { kbju: { k: 609, b: 34.9, zh: 36.8, u: 34 }, verified: false }, seenAt: ALL_KITCHENS, draftNote: "Во Владикавказе (Куйбышева, 3) старый сайт даёт 840 ₽, в menu.ts цена намеренно null: оставлено null." }),
          fromBreakfast("kapitalnyj", { signature: true, nutrition: { kbju: { k: 701, b: 42.5, zh: 39, u: 45 }, verified: false, cities: ["nalchik"], note: "КБЖУ только у нальчикского рецепта. На Куйбышева, 3 другой состав (купаты из филе цыплёнка, французская булка, пармезан, грецкие орехи) и КБЖУ не указано." }, seenAt: ALL_KITCHENS }),
          fromExtra("shakshuka", extras.shakshuka, { desc: "Яйца, томаты, болгарский перец, лук, чеснок, креметте, зелень и французская булка.", nutrition: { kbju: { k: 588, b: 29.2, zh: 33.2, u: 43.2 }, verified: false }, seenAt: ALL_KITCHENS, draftNote: "Во Владикавказе (Куйбышева, 3) старый сайт даёт 550 ₽, в menu.ts цена намеренно null: оставлено null." }),
          { id: "draniki-s-syomgoj", photo: photos.dranikiSSyomgoj, name: "Драники с сёмгой и яйцом пашот", price: p(null, null), nutrition: { kbju: { k: 603, b: 26, zh: 36.4, u: 43 }, verified: false }, seenAt: ALL_KITCHENS, verify: { verified: false, note: "Цена на старом сайте «0.00 р.» во всех трёх кофейнях: нужна цена. Состав не указан. КБЖУ только в Нальчике." } },
        ],
      },
      {
        id: "kashi", title: "Каши", items: [
          { id: "ovsyanaya-kasha", name: "Овсяная каша", desc: "На молоке, с ягодами и кунжутом. Можно на воде или на альтернативном молоке.", descByCity: { vladikavkaz: "На молоке со сливками и сливочным маслом, с сезонными ягодами." }, price: p(380, 380), nutrition: { kbju: { k: 455, b: 12.3, zh: 17.8, u: 60 }, verified: false }, photo: photos.ovsyanayaKasha, oldName: "Каша овсяная (Нальчик) / Овсяная каша (Куйбышева, 3)", seenAt: ALL_KITCHENS, verify: { verified: false, note: "Одна позиция из двух записей старого сайта; составы в городах различаются. КБЖУ 455 ккал совпадает с рисовой кашей на Байсултанова, 1 и Куйбышева, 3 (на Лермонтова, 59 у рисовой свои цифры)." } },
          { id: "risovaya-kasha", name: "Рисовая каша", desc: "На молоке, с ягодами. Можно на воде или на альтернативном молоке.", descByCity: { vladikavkaz: "На молоке со сливками и сливочным маслом, с сезонными ягодами." }, price: p(380, 380), nutrition: { kbju: { k: 432.6, b: 10.1, zh: 14.8, u: 64.7 }, verified: false }, photo: photos.risovayaKasha, oldName: "Каша рисовая (Нальчик) / Рисовая каша (Куйбышева, 3)", seenAt: ALL_KITCHENS, verify: { verified: false, note: "КБЖУ взято с Лермонтова, 59 (432,6 ккал, сходится по сумме Б/Ж/У); на Байсултанова, 1 и Куйбышева, 3 стоит 455 ккал, копия овсяной каши." } },
          { id: "talbina", name: "Тальбина", desc: "Ячменная мука, молоко, мёд, грецкие орехи, финики и корица.", price: p(380, 380), photo: photos.talbina, seenAt: ALL_KITCHENS },
        ],
      },
      {
        id: "sladkie-zavtraki", title: "Сладкие завтраки", items: [
          fromExtra("syrniki", extras.syrniki, { desc: "Из творога, на сметанной подушке, под вишнёвым или малиновым соусом на выбор.", photo: photos.syrniki, oldName: "Сырники с авторским соусом (Байсултанова, 1) / Сырники авторские (Куйбышева, 3, 410 ₽)", seenAt: ["bajsultanova-1", "kujbysheva-3"], draftNote: "КБЖУ старого сайта снято до сверки: два набора в одной строке, 554,5 / 28,6 / 23,1 / 58,1 (вишнёвый соус) и 614,4 / 29,4 / 24,5 / 69 (соус не подписан). Во Владикавказе (Куйбышева, 3) на старом сайте «Сырники авторские» за 410 ₽ (тот же состав), в menu.ts цена намеренно null: оставлено null." }),
          fromExtra("mini-pankejki", extras.pancakes, { desc: "С шоколадной пастой и вареньем, с гранолой и йогуртом.", nutrition: { kbju: { k: 629.9, b: 28.4, zh: 35.3, u: 49.6 }, verified: false }, cities: ["nalchik"], oldName: "Мини-панкейки с шоколадом и гранолой", seenAt: ["bajsultanova-1"], draftNote: "На старом сайте только на Байсултанова, 1; во Владикавказе вместо них «Панкейки» (490 ₽). В menu.ts цена во Владикавказе null, здесь позиция помечена только для Нальчика." }),
          { id: "granola", name: "Гранола", desc: "С йогуртом, семенами и ягодами, под вишнёвым или малиновым соусом на выбор.", price: p(380, null), nutrition: { kbju: { k: 473.6, b: 23.9, zh: 18, u: 54.1 }, verified: false }, cities: ["nalchik"], seenAt: ["bajsultanova-1"] },
          { id: "pankejki", name: "Панкейки", desc: "Крем пломбир, ягодная пропитка и вишнёвый крем.", price: p(null, 490), photo: photos.pankejki, cities: ["vladikavkaz"], seenAt: ["kujbysheva-3"], verify: { verified: false, note: "Только на Куйбышева, 3 (490 ₽). Другой рецепт, чем нальчикские мини-панкейки." } },
        ],
      },
      {
        id: "poke", title: "Поке", items: [
          { id: "poke-s-kuricej", name: "Поке с курицей", desc: "Бурый и дикий рис, филе цыплёнка, яйцо, черри, руккола, эдамаме и авторский соус.", price: p(380, 380), photo: photos.pokeSKuricej, seenAt: ALL_KITCHENS, draftNote: "КБЖУ старого сайта снято до сверки: 423,6 / 38,4 / 12 / 40,5, до десятых как у поке с сёмгой (вероятно, скопировано)." },
          { id: "poke-s-syomgoj", name: "Поке с сёмгой", desc: "Рис, сёмга, болгарский перец, красная капуста, вяленые томаты, кукуруза, эдамаме, кунжут и авторский соус.", price: p(null, 430), photo: photos.pokeSSyomgoj, seenAt: ALL_KITCHENS, draftNote: "КБЖУ старого сайта снято до сверки: 423,6 / 38,4 / 12 / 40,5, как у поке с курицей.", verify: { verified: false, note: "Нальчик: 390 ₽ на Байсултанова, 1 и 430 ₽ на Лермонтова, 59" } },
        ],
      },
      {
        id: "bouly", title: "Боулы", items: [
          { id: "boul-s-krevetkami", name: "Боул с креветками", desc: "Киноа, креветки и свежие овощи, соус песто собственного приготовления.", price: p(790, 790), nutrition: { kbju: { k: 490.3, b: 22.8, zh: 35, u: 21.1 }, verified: false }, photo: photos.boulSKrevetkami, seenAt: ALL_KITCHENS },
          { id: "boul-s-kuricej", name: "Боул с курицей", desc: "Нут, филе цыплёнка, авокадо, черри, огурцы, редис, зелень, лайм, семена и соус кармен.", price: p(550, 580), nutrition: { kbju: { k: 478.1, b: 25.7, zh: 28.8, u: 29.1 }, verified: false }, photo: photos.boulSKuricej, seenAt: ALL_KITCHENS },
        ],
      },
      {
        id: "sendvichi", title: "Сэндвичи", items: [
          { id: "sendvich-s-kuricej", name: "Сэндвич с курицей", desc: "Хрустящая французская булка, пряное куриное филе и свежие овощи. С картофелем по-деревенски.", descByCity: { vladikavkaz: "Французская булка, творожный сыр, филе цыплёнка, песто, томаты, огурцы и зелень. С картофелем фри или по-деревенски на выбор." }, price: p(450, 580), nutrition: { kbju: { k: 404.2, b: 21.9, zh: 20.6, u: 32.8 }, verified: false }, photo: photos.sendvichSKuricej, seenAt: ["bajsultanova-1", "kujbysheva-3"], verify: { verified: false, note: "В Нальчике на старом сайте только на Байсултанова, 1 (на Лермонтова, 59 нет)." } },
          { id: "sendvich-s-syomgoj", name: "Сэндвич с сёмгой", desc: "Хрустящая французская булка, сёмга, творожный сыр и свежие овощи. С картофелем и соусом на выбор.", descByCity: { vladikavkaz: "Французская булка, творожный сыр, сёмга, песто, томаты, огурцы и зелень. С картофелем фри или по-деревенски на выбор." }, price: p(760, 790), photo: photos.sendvichSSyomgoj, seenAt: ALL_KITCHENS, draftNote: "КБЖУ старого сайта снято до сверки: 308,8 / 14,7 / 15,6 / 27,3. Вместе с картофелем выглядит мало: уточнить, входит ли гарнир." },
          { id: "sendvich-s-indejkoj", name: "Сэндвич с индейкой", desc: "Хлеб, копчёная индейка, чеддер, салат, помидор, огурцы и авторский соус. С картофелем фри и соусом.", price: p(440, 580), nutrition: { kbju: { k: 407.8, b: 16, zh: 21.5, u: 37.6 }, verified: false }, photo: photos.sendvichSIndejkoj, seenAt: ALL_KITCHENS },
          { id: "sendvich-s-pryanoj-govyadinoj", name: "Сэндвич с пряной говядиной", desc: "Хлеб, пряная говядина, помидоры, вяленые томаты, салат и авторский соус. С картофелем фри или по-деревенски и соусом на выбор.", price: p(null, 610), nutrition: { kbju: { k: 418.7, b: 20, zh: 19.6, u: 40.6 }, verified: false }, photo: photos.sendvichSPryanojGovyadinoj, seenAt: ALL_KITCHENS, verify: { verified: false, note: "Нальчик: 380 ₽ на Байсултанова, 1 и 550 ₽ на Лермонтова, 59" } },
        ],
      },
      {
        id: "rolly", title: "Роллы", cities: ["nalchik"], items: [
          { id: "roll-s-kuricej", name: "Ролл с курицей", desc: "Лаваш, филе цыплёнка, помидоры, айсберг, чеддер и авторский соус.", price: p(370, null), nutrition: { kbju: { k: 390.3, b: 26.7, zh: 15.9, u: 35 }, verified: false }, photo: photos.rollSKuricej, seenAt: NALCHIK_KITCHENS },
          { id: "roll-s-syomgoj", name: "Ролл с сёмгой", desc: "Лаваш, сёмга, креметте и айсберг.", price: p(430, null), nutrition: { kbju: { k: 218.6, b: 10.5, zh: 9.1, u: 23.7 }, verified: false }, photo: photos.rollSSyomgoj, seenAt: NALCHIK_KITCHENS },
        ],
      },
      {
        id: "pasta", title: "Паста", cities: ["nalchik"], items: [
          { id: "pasta-s-kuricej", name: "Паста с курицей", desc: "Филе цыплёнка, шампиньоны, черри, сливочный соус, пармезан и зелёное масло.", price: p(520, null), nutrition: { kbju: { k: 735, b: 47, zh: 39, u: 49 }, verified: false }, photo: photos.pastaSKuricej, seenAt: NALCHIK_KITCHENS },
          { id: "pasta-s-krevetkami", name: "Паста с креветками", desc: "Креветки, черри, сливочный соус, песто и пармезан.", price: p(750, null), nutrition: { kbju: { k: 749, b: 38, zh: 41, u: 57 }, verified: false }, photo: photos.pastaSKrevetkami, seenAt: NALCHIK_KITCHENS },
        ],
      },
    ],
  },
  {
    id: "bar", title: "Бар", servedAt: "every-cafe",
    categories: [
      {
        id: "firmennoe", title: "Фирменное", signature: true, items: [
          fromDrink("kapuchino", { signature: true, volume: { sizes: [200, 300] }, photo: photos.kapuchino, draftNote: "КБЖУ старого сайта снято до сверки: 105,5 / 5 / 6,25 / 7,3. Для какого объёма (200 или 300 мл), не указано." }),
          fromDrink("klever", { signature: true, volume: { ml: 250 }, nutrition: { kbju: { k: 39.2, b: 2.5, zh: 2.5, u: 2.5 }, verified: false }, photo: photos.klever }),
          fromDrink("v60", { photo: photos.v60, signature: true, volume: { ml: 220 }, nutrition: { kbju: { k: 34.5, b: 2.2, zh: 2.02, u: 2.2 }, verified: false } }),
          fromDrink("stanciya-mir", { signature: true, volume: { ml: 300 }, photo: photos.stanciyaMir }),
          fromDrink("dalshe-slashe", { signature: true, volume: { ml: 250 }, nutrition: { kbju: { k: 130.5, b: 1.64, zh: 2.57, u: 26.5 }, verified: false }, photo: photos.dalsheSlashe }),
          fromDrink("espresso-tonik", { signature: true, volume: { ml: 300 }, nutrition: { kbju: { k: 85.3, b: 1.6, zh: 1.7, u: 15.44 }, verified: false }, photo: photos.espressoTonik }),
        ],
      },
      {
        id: "espresso-i-filtr", title: "Эспрессо и фильтр", items: [
          { id: "espresso", photo: photos.espresso, name: "Эспрессо", price: same(220), volume: { ml: 60 }, draftNote: "КБЖУ старого сайта снято до сверки: 24,1 / 1,6 / 1,7 / 0,5, как у американо." },
          { id: "amerikano", photo: photos.amerikano, name: "Американо", price: same(220), volume: { ml: 200 }, draftNote: "КБЖУ старого сайта снято до сверки: 24,1 / 1,6 / 1,7 / 0,5, как у эспрессо." },
          { id: "flet-uajt", photo: photos.fletUajt, name: "Флэт уайт", price: same(250), volume: { ml: 200 }, nutrition: { kbju: { k: 117.1, b: 5.8, zh: 7.1, u: 7.55 }, verified: false } },
          { id: "latte", photo: photos.latte, name: "Латте", price: same(270), volume: { ml: 300 }, nutrition: { kbju: { k: 148.5, b: 6.96, zh: 8.77, u: 10.59 }, verified: false } },
          { id: "raf-klassicheskij", photo: photos.rafKlassicheskij, name: "Раф классический", price: same(320), volume: { ml: 300 }, draftNote: "КБЖУ старого сайта снято до сверки: 363,3 / 8,2 / 23,7 / 7,55. Углеводы как у флэт уайта; калорийность не сходится с Б/Ж/У (+31 %)." },
          { id: "filtr-kofe", photo: photos.filtrKofe, name: "Фильтр-кофе", price: { sizes: [220, 250] }, volume: { sizes: [200, 300] }, oldName: "Фильтр кофе", draftNote: "КБЖУ старого сайта снято до сверки: 39,2 / 2 / 2 / 2. Для какого объёма (200 или 300 мл), не указано." },
        ],
      },
      {
        id: "avtorskie", title: "Авторские напитки", items: [
          { id: "raf-citrus", photo: photos.rafCitrus, name: "Раф цитрус", price: same(330), volume: { ml: 300 }, nutrition: { kbju: { k: 344.2, b: 8.24, zh: 16.69, u: 40.27 }, verified: false } },
          { id: "raf-malina-apelsin", photo: photos.rafMalinaApelsin, name: "Раф малина-апельсин", price: same(330), volume: { ml: 300 }, nutrition: { kbju: { k: 294.1, b: 7.41, zh: 15.82, u: 30.73 }, verified: false }, oldName: "Раф Малина-Апельсин" },
          { id: "tvin-piks", photo: photos.tvinPiks, name: "«Твин-Пикс»", price: same(350), volume: { ml: 300 }, oldName: "Твин-Пикс", verify: { verified: false, note: "Состава и КБЖУ на старом сайте нет." } },
          { id: "filtr-sliva-gibiskus", photo: photos.filtrSlivaGibiskus, name: "Фильтр слива-гибискус", price: same(350), volume: { ml: 300 }, oldName: "Фильтр Слива-Гибискус" },
        ],
      },
      {
        id: "holodnyj-kofe", title: "Холодный кофе", items: [
          { id: "espresso-tonik-granat", photo: photos.espressoTonikGranat, name: "Эспрессо-тоник гранат", price: same(320), volume: { ml: 300 }, oldName: "Эспрессо гранат тоник" },
          { id: "bambl-klassicheskij", photo: photos.bamblKlassicheskij, name: "Бамбл классический", price: same(290), volume: { ml: 300 }, nutrition: { kbju: { k: 88.9, b: 3.22, zh: 2.06, u: 15.8 }, verified: false } },
          { id: "bambl-na-freshe", photo: photos.bamblNaFreshe, name: "Бамбл на фреше", price: same(410), volume: { ml: 300 }, nutrition: { kbju: { k: 104.1, b: 3.6, zh: 1.7, u: 16.5 }, verified: false } },
          { id: "ajs-latte", photo: photos.ajsLatte, name: "Айс латте", price: same(270), volume: { ml: 300 }, nutrition: { kbju: { k: 171.6, b: 5.84, zh: 7.33, u: 20.71 }, verified: false } },
        ],
      },
      {
        id: "matcha", title: "Матча", items: [
          { id: "matcha-latte", photo: photos.matchaLatte, name: "Матча латте", price: same(280), volume: { ml: 300 }, nutrition: { kbju: { k: 189.1, b: 8.7, zh: 10.8, u: 13.8 }, verified: false } },
          { id: "matcha-lichi-ananas", photo: photos.matchaLichiAnanas, name: "Матча личи-ананас", desc: "Матча, пюре личи и ананасовый сок.", price: same(300), volume: { ml: 300 }, oldName: "Матча Личи-Ананас" },
          { id: "matcha-klubnika", photo: photos.matchaKlubnika, name: "Матча клубника", price: same(320), volume: { ml: 300 } },
          { id: "matcha-malina-belyj-shokolad", photo: photos.matchaMalinaBelyjShokolad, name: "Матча малина и белый шоколад", price: same(350), volume: { ml: 300 }, oldName: "Матча малина-белый шоколад" },
        ],
      },
      {
        id: "kakao-i-shokolad", title: "Какао и шоколад", items: [
          { id: "kakao", photo: photos.kakao, name: "Какао", price: { sizes: [200, 240] }, volume: { sizes: [200, 300] }, draftNote: "КБЖУ старого сайта снято до сверки: 162,8 / 5,02 / 7,72 / 17,71. Для какого объёма (200 или 300 мл), не указано." },
          { id: "bean-to-bar", photo: photos.beanToBar, name: "Bean-to-bar", lang: "en", price: same(350), volume: { ml: 200 }, verify: { verified: false, note: "Что это (горячий шоколад bean-to-bar, судя по фото), на старом сайте не сказано: описание нужно от клиента." } },
        ],
      },
      {
        id: "chai", title: "Авторские чаи", items: [
          { id: "mango-citrus", photo: photos.mangoCitrus, name: "Манго-цитрус", price: same(280), volume: { ml: 300 }, nutrition: { kbju: { k: 142, b: 1, zh: 0.27, u: 34.3 }, verified: false }, oldName: "Манго цитрус" },
          { id: "karkade-granat", photo: photos.karkadeGranat, name: "Каркаде-гранат", price: same(280), volume: { ml: 300 }, nutrition: { kbju: { k: 127, b: 0.03, zh: 0.05, u: 31.81 }, verified: false }, oldName: "Каркаде гранат" },
          { id: "oblepiha-klyukva", photo: photos.oblepihaKlyukva, name: "Облепиха-клюква", price: same(280), volume: { ml: 300 }, oldName: "Облепиха клюква", draftNote: "КБЖУ старого сайта снято до сверки: 69,4 / 0,67 / 3,4 / 14,85. Калорийность не сходится с Б/Ж/У (−25 %)." },
          { id: "imbir-limon-myod", photo: photos.imbirLimonMyod, name: "Имбирь, лимон и мёд", price: same(280), volume: { ml: 300 }, oldName: "Имбирь лимон мед", draftNote: "КБЖУ старого сайта снято до сверки: 93,8 / 0,66 / 4,41 / 22,47. Калорийность не сходится с Б/Ж/У (−29 %)." },
          { id: "yagodnyj-lapsang", photo: photos.yagodnyjLapsang, name: "Ягодный лапсанг", price: same(350), volume: { ml: 300 }, oldName: "Чай Ягодный Лапсанг" },
        ],
      },
      {
        id: "limonady", title: "Лимонады", items: [
          { id: "malina-marakujya", photo: photos.malinaMarakujya, name: "Малина-маракуйя", price: same(310), volume: { ml: 300 }, oldName: "Малина маракуйя", draftNote: "КБЖУ старого сайта снято до сверки: 91,1 / 1,27 / 0,11 / 15,32. Калорийность не сходится с Б/Ж/У (+35 %)." },
          { id: "granat-klyukva", photo: photos.granatKlyukva, name: "Гранат-клюква", price: same(310), volume: { ml: 300 }, nutrition: { kbju: { k: 140.7, b: 0.6, zh: 0.1, u: 31.9 }, verified: false }, oldName: "Гранат клюква" },
          { id: "modnyj-limonnyj", photo: photos.modnyjLimonnyj, name: "«Модный лимонный»", price: same(310), volume: { ml: 300 }, nutrition: { kbju: { k: 29, b: 1, zh: 0, u: 6 }, verified: false }, oldName: "Модный лимонный" },
          { id: "persik-kalamansi", photo: photos.persikKalamansi, name: "Персик-каламанси", desc: "Персик и пюре каламанси, гибрида мандарина и кумквата.", price: same(310), volume: { ml: 300 }, oldName: "Лимонад Персик-Каламанси" },
        ],
      },
      {
        id: "freshi", title: "Фреши", items: [
          { id: "fresh-apelsin", photo: photos.freshApelsin, name: "Апельсин", price: same(390), volume: { ml: 300 } },
          { id: "fresh-grejpfrut", photo: photos.freshGrejpfrut, name: "Грейпфрут", price: same(420), volume: { ml: 300 } },
          { id: "fresh-granat", photo: photos.freshGranat, name: "Гранат", price: same(null), volume: { ml: 300 }, verify: { verified: false, note: "Цена на старом сайте пустая («р.») во всех кофейнях." } },
          { id: "fresh-yabloko", photo: photos.freshYabloko, name: "Яблоко", price: same(320), volume: { ml: 300 } },
          { id: "fresh-morkov", photo: photos.freshMorkov, name: "Морковь", price: same(280), volume: { ml: 300 } },
        ],
      },
      {
        id: "koktejli", title: "Коктейли", items: [
          { id: "bananovyj", photo: photos.bananovyj, name: "Банановый", price: same(290), volume: { ml: 300 }, nutrition: { kbju: { k: 441, b: 10.83, zh: 19.67, u: 56.55 }, verified: false } },
          { id: "klubnichnyj", photo: photos.klubnichnyj, name: "Клубничный", price: same(290), volume: { ml: 300 }, nutrition: { kbju: { k: 343.7, b: 9.55, zh: 17.12, u: 38 }, verified: false } },
          { id: "shokoladno-bananovyj", photo: photos.shokoladnoBananovyj, name: "Шоколадно-банановый", price: same(310), volume: { ml: 300 }, nutrition: { kbju: { k: 452.4, b: 11.27, zh: 22.09, u: 52.33 }, verified: false } },
          { id: "kofejno-bananovyj", photo: photos.kofejnoBananovyj, name: "Кофейно-банановый", price: same(310), volume: { ml: 300 } },
        ],
      },
      {
        id: "shoty", title: "Шоты", items: [
          { id: "shot-vitaminnyj", photo: photos.shotVitaminnyj, name: "Витаминный", price: same(350), nutrition: { kbju: { k: 106.2, b: 1.49, zh: 0.28, u: 26.71 }, verified: false }, verify: { verified: false, note: "Объём не указан («мл.» без числа)." } },
          { id: "espresso-shot", photo: photos.espressoShot, name: "Эспрессо-шот", price: same(350), nutrition: { kbju: { k: 87.7, b: 1.84, zh: 1.82, u: 15.36 }, verified: false }, oldName: "Эспрессо шот", verify: { verified: false, note: "Объём не указан. Состав неизвестен (87,7 ккал, 15 г углеводов: не чистый эспрессо). Фото показывает четыре разных шота." } },
        ],
      },
    ],
  },
  {
    id: "deserty", title: "Десерты", servedAt: "every-cafe",
    categories: [
      {
        id: "firmennye", title: "Фирменные", signature: true, items: [
          fromDessert("medovik", { signature: true, nutrition: { kbju: { k: 476.5, b: 7.8, zh: 30.3, u: 43.2 }, verified: false } }),
          fromDessert("brauni", { signature: true, nutrition: { kbju: { k: 500, b: 8.3, zh: 29, u: 51.6 }, verified: false } }),
          fromDessert("san-sebastyan", { signature: true, nutrition: { kbju: { k: 362.3, b: 7.5, zh: 26.8, u: 22.8 }, verified: false } }),
        ],
      },
      {
        id: "torty-i-pirozhnye", title: "Торты и пирожные", items: [
          fromExtra("vishnevyj-pirog", cherryPie),
          { id: "trajfl", name: "Трайфл", desc: "Шоколадная крошка, бельгийский молочный шоколад, сливочный крем, бананы, фисташка и ягоды.", price: same(370), nutrition: { kbju: { k: 513.5, b: 10, zh: 30.7, u: 49.3 }, verified: false }, photo: photos.trajfl },
          { id: "tort-beze", name: "Торт безе", desc: "Безе, сливочный крем, фисташка и ягоды.", price: same(270), nutrition: { kbju: { k: 505.8, b: 9.7, zh: 32.3, u: 44 }, verified: false }, photo: photos.tortBeze },
          { id: "panna-kotta", name: "Панна-котта", desc: "Сливочное суфле и малиновый джем.", price: same(370), nutrition: { kbju: { k: 454.4, b: 18.7, zh: 27.4, u: 33.3 }, verified: false }, photo: photos.pannaKotta },
          { id: "tiramisu", name: "Тирамису", desc: "Печенье савоярди, кофейная пропитка, креметте, маскарпоне и какао.", price: same(350), nutrition: { kbju: { k: 502.9, b: 9.3, zh: 35.5, u: 36.6 }, verified: false }, photo: photos.tiramisu },
          { id: "tart-s-maskarpone-i-malinoj", name: "Тарт с маскарпоне и малиной", price: same(330), photo: photos.tartSMaskarponeIMalinoj },
          { id: "shu-s-funduchnym-kremom", name: "Шу с фундучным кремом", price: same(270), verify: { verified: false, note: "Фото на старом сайте нет." } },
          { id: "malinovyj-muss", name: "Малиновый мусс", desc: "Без сахара и глютена.", price: same(420), verify: { verified: false, note: "Фото на старом сайте нет." } },
          { id: "kinder-kantri", name: "«Киндер Кантри»", price: same(360), oldName: "Киндер Кантри", verify: { verified: false, note: "Ни состава, ни фото: неясно, торт это или батончик (раздел выбран наугад). Название повторяет товарный знак Ferrero." } },
        ],
      },
      {
        id: "batonchiki-i-sladosti", title: "Батончики и сладости", items: [
          { id: "dubajskij-batonchik", name: "Дубайский батончик", desc: "Бельгийский молочный шоколад, катаифи, фисташковая паста и фисташки.", price: same(390), photo: photos.dubajskijBatonchik, draftNote: "КБЖУ старого сайта снято до сверки: 256,6 / 5,1 / 26,9 / 19. Калорийность не сходится с Б/Ж/У (−24 %)." },
          { id: "snikers-pp", name: "ПП-батончик «Сникерс»", desc: "Бельгийский молочный шоколад без сахара, карамель на топинамбуре и арахис.", price: same(290), nutrition: { kbju: { k: 305.1, b: 8.5, zh: 17, u: 29.5 }, verified: false }, photo: photos.snikersPp, oldName: "Сникерс ПП батончик", verify: { verified: false, note: "Название повторяет товарный знак Mars." } },
          { id: "baunti-pp", name: "ПП-батончик «Баунти»", desc: "Бельгийский молочный шоколад без сахара и кокосовая мякоть.", price: same(290), nutrition: { kbju: { k: 219, b: 3.2, zh: 15.7, u: 16.3 }, verified: false }, photo: photos.bauntiPp, oldName: "Баунти ПП батончик", verify: { verified: false, note: "Название повторяет товарный знак Mars." } },
          { id: "deniz", name: "«Дениз» с морской солью", desc: "Бельгийский молочный шоколад, сироп топинамбура и морская соль.", price: same(120), photo: photos.deniz, oldName: "«Дениз» с морской солью", draftNote: "КБЖУ старого сайта снято до сверки: 46,1 / 0,4 / 2,8 / 4,7, видимо, на одну конфету: уточнить порцию." },
          { id: "syrok-so-sgushchenkoj", name: "Сырок с варёной сгущёнкой", desc: "Творог, креметте и варёная сгущёнка в бельгийском молочном и белом шоколаде.", price: same(270), nutrition: { kbju: { k: 354.5, b: 7.6, zh: 24.7, u: 25.4 }, verified: false }, photo: photos.syrokSoSgushchenkoj },
          { id: "syrok-shokoladnyj", name: "Сырок шоколадный", price: same(370), nutrition: { kbju: { k: 331, b: 7.1, zh: 24.6, u: 20.4 }, verified: false }, photo: photos.syrokShokoladnyj, verify: { verified: false, note: "370 ₽ против 270 ₽ у сырка со сгущёнкой: сверить цену." } },
          { id: "finiki-v-shokolade", name: "Финики в шоколаде", desc: "Королевские финики в бельгийском молочном или тёмном шоколаде, с цельной фисташкой внутри.", price: same(100), photo: photos.finikiVShokolade, verify: { verified: false, note: "100 ₽, видимо, за штуку: уточнить." } },
          { id: "moti", name: "Моти Mochiland", desc: "Без глютена.", price: same(340), photo: photos.moti, draftNote: "КБЖУ старого сайта снято до сверки: только «179к» без Б/Ж/У, вероятно за штуку." },
          { id: "shokoladnaya-pp-granola", name: "Шоколадная ПП-гранола", price: same(230), nutrition: { kbju: { k: 262.2, b: 14.6, zh: 6.4, u: 36.7 }, verified: false }, oldName: "ПП Шоколадная гранола", verify: { verified: false, note: "Фото на старом сайте нет." } },
        ],
      },
    ],
  },
];

// Derived helpers for the page.

export const chapterById = Object.fromEntries(fullMenu.map((ch) => [ch.id, ch])) as Record<MenuChapterId, MenuChapter>;

export const menuCategories: MenuCategory[] = fullMenu.flatMap((ch) => ch.categories);
export const menuItems: MenuItem[] = menuCategories.flatMap((c) => c.items);
export const menuItemById: Record<string, MenuItem> = Object.fromEntries(menuItems.map((i) => [i.id, i]));

const BOTH: City[] = ["nalchik", "vladikavkaz"];

/** Cities where an item is served: its own `cities`, else its category's, else both. */
export const citiesOf = (item: MenuItem, category: MenuCategory): City[] => item.cities ?? category.cities ?? BOTH;

/** How many items of a chapter are served in a city. */
export const chapterCount = (chapter: MenuChapter, city: City): number =>
  chapter.categories.reduce((n, c) => n + c.items.filter((i) => citiesOf(i, c).includes(city)).length, 0);

/** Where the «Кухня» chapter is served: the cafés with `kitchen: "full"` in cafes.ts, per city, in cafes.ts order. */
export const kitchenCafes: Record<City, Cafe[]> = {
  nalchik: cafes.filter((c) => c.city === "nalchik" && c.kitchen === "full"),
  vladikavkaz: cafes.filter((c) => c.city === "vladikavkaz" && c.kitchen === "full"),
};

/** The page's sections (its tabs), in the order of a café day: whole categories grouped as a guest looks for them. */
const SECTIONS: { id: MenuSectionId; theme: MenuSection["theme"]; categories: string[] }[] = [
  { id: "zavtraki", theme: "cream", categories: ["zavtraki", "sladkie-zavtraki", "kashi"] },
  { id: "obed", theme: "cream", categories: ["poke", "bouly", "sendvichi", "rolly", "pasta"] },
  { id: "kofe", theme: "cream", categories: ["firmennoe", "espresso-i-filtr", "avtorskie", "holodnyj-kofe"] },
  { id: "ne-kofe", theme: "cream", categories: ["matcha", "chai", "kakao-i-shokolad"] },
  { id: "holodnoe", theme: "cream", categories: ["limonady", "freshi", "koktejli", "shoty"] },
  { id: "deserty", theme: "ink", categories: ["firmennye", "torty-i-pirozhnye", "batonchiki-i-sladosti"] },
];
const categoryById = Object.fromEntries(menuCategories.map((c) => [c.id, c]));
const chapterOf = (c: MenuCategory) => fullMenu.find((ch) => ch.categories.includes(c))!;

export const menuSections: MenuSection[] = SECTIONS.map((s) => {
  const categories = s.categories.map((id) => {
    const c = categoryById[id];
    if (!c) throw new Error(`full-menu: no category "${id}"`);
    return c;
  });
  return { ...s, categories, servedAt: chapterOf(categories[0]).servedAt };
});

/** Every item of a section with the category it belongs to, in reading order. */
export const sectionItems = (s: MenuSection) => s.categories.flatMap((category) => category.items.map((item) => ({ item, category })));

/** Items served in a city: in one section, or on the whole page. */
export const sectionCount = (s: MenuSection, city: City): number =>
  sectionItems(s).filter(({ item, category }) => citiesOf(item, category).includes(city)).length;
export const menuCount = (city: City): number => menuSections.reduce((n, s) => n + sectionCount(s, city), 0);

/** The homepage answers by the menu anchor they link to (answers.ts `item.anchor`). */
export const answerByAnchor: Record<string, Answer> = Object.fromEntries(answers.map((a) => [a.item.anchor, a]));

/** The anchors the homepage hero links to (answers.ts `item.anchor`): each is an item id above. */
export const HERO_ANCHORS = [
  "luchshe-vseh", "kak-v-skazke", "shik", "10-iz-10", "kapitalnyj", "shakshuka", "espresso-tonik", "dalshe-slashe",
] as const;
