// Downloads the client's own photos from the old site (kakdelacoffee.ru) plus CC0 placeholders
// for the gaps, validates that each response is really an image, resizes to ≤2000px on the long
// edge (or the entry's own `max`, e.g. 1200px for the /menu thumbnails) and writes
// src/assets/photos/<slug>.jpg + manifest.json. next/image does the only web encode (AVIF/WebP)
// from these sources.
// Usage: node scripts/fetch-photos.mjs [--force]
import sharp from "sharp";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const OUT = "src/assets/photos";
const OLD = "https://www.kakdelacoffee.ru/images/";
const force = process.argv.includes("--force");
/** Default long edge, and the long edge of the /menu card and vitrine thumbnails. */
const MAX = 2000;
const THUMB = 1200;

/** @type {{slug:string,url:string,placeholder?:boolean,credit?:string,alt:string,max?:number}[]} */
const PHOTOS = [
  // Breakfasts (client)
  { slug: "luchshe-vseh", url: OLD + "food/Food-Name-68b438a4b974a.JPG", alt: "Завтрак «Лучше всех»: глазунья, домашние колбаски, овощи и грибной соус" },
  { slug: "otlichnyj", url: OLD + "food/Food-Name-69afebdad0b47.png", alt: "Завтрак «Отличный»: омлет с моцареллой, овощи и гранола" },
  { slug: "kapitalnyj", url: OLD + "food/Food-Name-69b00b7b69f89.png", alt: "Завтрак «Капитальный»: колбаски, яйца, гренки, хумус и черри" },
  { slug: "syrniki", url: OLD + "food/Food-Name-688b5380d8c9c.JPG", alt: "Сырники на сметанной подушке под вишнёвым соусом", max: THUMB },
  // Drinks (client)
  { slug: "espresso-tonik", url: OLD + "bar/Drink_6474b98f84065.jpg", alt: "Эспрессо тоник со льдом" },
  { slug: "dalshe-slashe", url: OLD + "bar/Drink_6474b756ba8c6.jpg", alt: "Авторский напиток «Дальше слаще»" },
  { slug: "klever", url: OLD + "bar/Drink_6474b645a2adc.jpg", alt: "Кофе «Клевер», альтернативное заваривание" },
  { slug: "stanciya-mir", url: OLD + "bar/Drink_6808e22e7956a.jpg", alt: "Авторский фильтр «Станция Мир» с сиропом из горных трав" },
  { slug: "kapuchino", url: OLD + "bar/Drink_647498fc26f9f.jpg", alt: "Капучино" },
  { slug: "zolotoj-kleverok", url: OLD + "bar/Drink_69ec6ff878e4d.jpg", alt: "Напиток «Золотой клеверок» с леденцом-клевером на кружевной салфетке" },
  // Desserts (client)
  { slug: "medovik", url: OLD + "food/Dessert_65c8d88919dac.JPG", alt: "Медовик" },
  { slug: "brauni", url: OLD + "food/Dessert_65c8d601650b9.JPG", alt: "Брауни" },
  { slug: "san-sebastyan", url: OLD + "food/Dessert_65c8d6e012657.JPG", alt: "Чизкейк Сан-Себастьян" },
  { slug: "vishnevyj-pirog", url: OLD + "food/Dessert_68f7400d71c40.jpg", alt: "Вишнёвый пирог с шариком мороженого" },
  // Cafés (client)
  { slug: "cafe-bajsultanova-1", url: OLD + "shops/Coffee_shop_64986e8514fcc.jpg", alt: "Кофейня «Как дела?» на улице Байсултанова, 1" },
  { slug: "cafe-lermontova-59", url: OLD + "shops/Coffee_shop_6732fcfb4b0ae.jpg", alt: "Кофейня «Как дела?» на улице Лермонтова, 59" },
  { slug: "cafe-lenina-32", url: OLD + "shops/Shops_6496976384547.jpg", alt: "Кофейня «Как дела?» на проспекте Ленина, 32" },
  { slug: "cafe-shogencukova-14", url: OLD + "shops/Coffee_shop_687a051b679e9.jpg", alt: "Кофейня «Как дела?» на проспекте Шогенцукова, 14" },
  { slug: "cafe-atazhukina-10v", url: OLD + "shops/Coffee_shop_687a061208162.jpg", alt: "Кофейня «Как дела?» на улице Атажукина, 10В" },
  { slug: "cafe-lermontova-4", url: OLD + "shops/Coffee_shop_694e728f9f1db.png", alt: "Кофейня «Как дела?» на улице Лермонтова, 4" },
  { slug: "cafe-kujbysheva-3", url: OLD + "shops/Coffee_shop_687a07414e683.jpg", alt: "Кофейня «Как дела?» на улице Куйбышева, 3 во Владикавказе" },
  { slug: "cafe-plieva-32", url: OLD + "shops/Coffee_shop_654f565f14c95.jpg", alt: "Кофейня «Как дела?» на улице Генерала Плиева, 32 во Владикавказе" },
  // CC0 placeholders (Openverse → rawpixel / StockSnap), to be replaced with client photography
  { slug: "10-iz-10", placeholder: true, credit: "rawpixel, CC0", url: "https://images.rawpixel.com/editor_1024/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvdXB3azYxNjY3NTI1LXdpa2ltZWRpYS1pbWFnZS1rb3diNWIzaC5qcGc.jpg", alt: "Завтрак «10 из 10» (временное фото)" },
  { slug: "kak-v-skazke", placeholder: true, credit: "rawpixel, CC0", url: "https://images.rawpixel.com/editor_1024/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvdXB3azYxNjY0MDk1LXdpa2ltZWRpYS1pbWFnZS1rb3dhenpxZi5qcGc.jpg", alt: "Завтрак «Как в сказке» (временное фото)" },
  { slug: "shik", placeholder: true, credit: "Jakub Kapusnak, rawpixel, CC0", url: "https://images.rawpixel.com/editor_1024/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvYTAxOS1qYWt1YmstMDc1My1iZWVmLWdyZWVuLWJlYW5zLXJpc290dG8uanBn.jpg", alt: "Завтрак «Шик» (временное фото)" },
  { slug: "shakshuka", placeholder: true, credit: "rawpixel, CC0", url: "https://images.rawpixel.com/editor_1024/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvdXB3azYxNjYyNDE3LXdpa2ltZWRpYS1pbWFnZS1rb3diM295ZS5qcGc.jpg", alt: "Шакшука (временное фото)" },
  { slug: "team-1", placeholder: true, credit: "Burst, StockSnap, CC0", url: "https://cdn.stocksnap.io/img-thumbs/960w/DTKOOFPC06.jpg", alt: "Бариста рисует латте-арт (временное фото)" },
  { slug: "team-2", placeholder: true, credit: "rawpixel, CC0", url: "https://images.rawpixel.com/editor_1024/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbnMzNzU0LWltYWdlLWt3eXJ4dGxxLmpwZw.jpg", alt: "Бариста наливает кофе в стакан с собой (временное фото)" },
  { slug: "team-3", placeholder: true, credit: "Malidate Van, StockSnap, CC0", url: "https://cdn.stocksnap.io/img-thumbs/960w/ZCW5B7GXFY.jpg", alt: "Руки бариста у эспрессо-машины (временное фото)" },
  { slug: "team-4", placeholder: true, credit: "Burst, StockSnap, CC0", url: "https://cdn.stocksnap.io/img-thumbs/960w/ERHOTDPNMV.jpg", alt: "Гость держит чашку с латте-артом (временное фото)" },
  { slug: "cafe-shogencukova-19", placeholder: true, credit: "rawpixel, CC0", url: "https://images.rawpixel.com/editor_1024/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvdXB3azYxODIyMDY5LXdpa2ltZWRpYS1pbWFnZS1rb3dreDY3aC5qcGc.jpg", alt: "Кофейня на проспекте Шогенцукова, 19 (временное фото)" },
  // /menu kitchen card thumbnails (client)
  { slug: "ovsyanaya-kasha", url: OLD + "food/Food-Name-6666dfa4209ee.JPG", alt: "Овсяная каша с бананом, клубникой и голубикой", max: THUMB },
  { slug: "risovaya-kasha", url: OLD + "food/Food-Name-6666dfc86290e.JPG", alt: "Рисовая каша с клубникой и голубикой", max: THUMB },
  { slug: "talbina", url: OLD + "food/Food-Name-67c6f414f1c73.JPG", alt: "Тальбина с финиками и грецкими орехами", max: THUMB },
  { slug: "pankejki", url: OLD + "food/Food-Name-688b4a8c3f203.JPG", alt: "Панкейки с кремом, голубикой и ягодным соусом", max: THUMB },
  { slug: "poke-s-kuricej", url: OLD + "food/Food-Name-67b3244d48082.jpg", alt: "Поке с курицей: рис, филе цыплёнка, яйцо, черри и эдамаме", max: THUMB },
  { slug: "poke-s-syomgoj", url: OLD + "food/Food-Name-69b09557ed567.png", alt: "Поке с сёмгой: рис, сёмга, перец, красная капуста, кукуруза, эдамаме и соус с кунжутом", max: THUMB },
  { slug: "boul-s-krevetkami", url: OLD + "food/Food-Name-68b439835abce.jfif", alt: "Боул с киноа, креветками, авокадо, песто, черри, редисом и лаймом", max: THUMB },
  { slug: "boul-s-kuricej", url: OLD + "food/Food-Name-69b0054a65268.png", alt: "Боул с курицей: нут, филе цыплёнка, авокадо, черри, лайм и зелень", max: THUMB },
  { slug: "sendvich-s-kuricej", url: OLD + "food/Food-Name-669e0e5a4b835.JPG", alt: "Сэндвич с курицей, картофель по-деревенски и соус", max: THUMB },
  { slug: "sendvich-s-syomgoj", url: OLD + "food/Food-Name-688b50b3516bc.JPG", alt: "Сэндвич с сёмгой, картофель по-деревенски и соус", max: THUMB },
  { slug: "sendvich-s-indejkoj", url: OLD + "food/Food-Name-69b09615718fb.png", alt: "Сэндвич с индейкой, картофель фри и соус", max: THUMB },
  { slug: "sendvich-s-pryanoj-govyadinoj", url: OLD + "food/Food-Name-69afeab6afc1d.png", alt: "Сэндвич с пряной говядиной, картофель по-деревенски и соус", max: THUMB },
  { slug: "roll-s-kuricej", url: OLD + "food/Food-Name-66deff7e68e0a.jpg", alt: "Ролл с курицей в лаваше, разрезанный пополам", max: THUMB },
  { slug: "roll-s-syomgoj", url: OLD + "food/Food-Name-66deffaa3fe53.jpg", alt: "Ролл с сёмгой в лаваше, разрезанный пополам", max: THUMB },
  { slug: "pasta-s-kuricej", url: OLD + "food/Food-Name-64752036c009f.JPG", alt: "Паста с курицей, шампиньонами и пармезаном, черри и зелёное масло", max: THUMB },
  { slug: "pasta-s-krevetkami", url: OLD + "food/Food-Name-69afe8a335d70.png", alt: "Паста с креветками в соусе песто, пармезан и черри", max: THUMB },
  // /menu dessert vitrine thumbnails (client)
  { slug: "trajfl", url: OLD + "food/Dessert_65c8d5aa1207b.JPG", alt: "Трайфл в баночке: шоколадная крошка, крем, фисташка и голубика", max: THUMB },
  { slug: "tort-beze", url: OLD + "food/Dessert_6561cb47619eb.jpg", alt: "Торт безе со сливочным кремом и клубникой", max: THUMB },
  { slug: "panna-kotta", url: OLD + "food/Dessert_65c8d70c638e7.JPG", alt: "Панна-котта с малиновым джемом в баночке", max: THUMB },
  { slug: "tiramisu", url: OLD + "food/Dessert_676bcac05af77.jpg", alt: "Тирамису в баночке с какао", max: THUMB },
  { slug: "tart-s-maskarpone-i-malinoj", url: OLD + "food/Dessert_69d375ca1963d.png", alt: "Кусок тарта с маскарпоне и малиной, сверху миндальные лепестки", max: THUMB },
  { slug: "dubajskij-batonchik", url: OLD + "food/Dessert_66f15f1e34178.jpg", alt: "Дубайский батончик в молочном шоколаде с фисташками", max: THUMB },
  { slug: "snikers-pp", url: OLD + "food/Dessert_65c8d96631d51.JPG", alt: "ПП-батончик «Сникерс» в молочном шоколаде с арахисом", max: THUMB },
  { slug: "baunti-pp", url: OLD + "food/Dessert_65c8d97c6c0d9.JPG", alt: "ПП-батончик «Баунти» в молочном шоколаде", max: THUMB },
  { slug: "deniz", url: OLD + "food/Dessert_676bcad0ee1a7.jpg", alt: "Конфеты «Дениз» в молочном шоколаде с морской солью", max: THUMB },
  { slug: "syrok-so-sgushchenkoj", url: OLD + "food/Dessert_676bcae06c52b.jpg", alt: "Сырки с варёной сгущёнкой в молочном шоколаде", max: THUMB },
  { slug: "syrok-shokoladnyj", url: OLD + "food/Dessert_676bcaee44552.jpg", alt: "Шоколадные сырки в глазури с хрустящей крошкой", max: THUMB },
  { slug: "finiki-v-shokolade", url: OLD + "food/Dessert_67c6f3530e2a6.jpg", alt: "Финики в молочном шоколаде с фисташковой крошкой", max: THUMB },
  { slug: "moti", url: OLD + "food/Dessert_669e0e71af668.jpg", alt: "Разноцветные моти на тарелке", max: THUMB },
];

mkdirSync(OUT, { recursive: true });
const manifest = [];
for (const p of PHOTOS) {
  const file = `${OUT}/${p.slug}.jpg`;
  if (!force && existsSync(file)) {
    const m = await sharp(file).metadata();
    manifest.push({ ...p, file, width: m.width, height: m.height });
    continue;
  }
  const res = await fetch(p.url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const type = res.headers.get("content-type") || "";
  if (!res.ok || !type.startsWith("image/")) {
    console.error(`SKIP ${p.slug}: ${res.status} ${type}`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const info = await sharp(buf)
    .rotate()
    .flatten({ background: "#141210" })
    .resize({ width: p.max ?? MAX, height: p.max ?? MAX, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(file);
  manifest.push({ ...p, file, width: info.width, height: info.height });
  console.log(`OK ${p.slug} ${info.width}x${info.height} ${Math.round(info.size / 1024)}KB${p.placeholder ? " (placeholder)" : ""}`);
}
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
