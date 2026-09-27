// Downloads the client's own photos from the old site (kakdelacoffee.ru) plus CC0 placeholders
// for the gaps, validates that each response is really an image, resizes to ≤2000px on the long
// edge and writes src/assets/photos/<slug>.jpg + manifest.json. next/image does the only
// web encode (AVIF/WebP) from these sources.
// Usage: node scripts/fetch-photos.mjs [--force]
import sharp from "sharp";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const OUT = "src/assets/photos";
const OLD = "https://www.kakdelacoffee.ru/images/";
const force = process.argv.includes("--force");

/** @type {{slug:string,url:string,placeholder:boolean,credit?:string,alt:string}[]} */
const PHOTOS = [
  // Breakfasts (client)
  { slug: "luchshe-vseh", url: OLD + "food/Food-Name-68b438a4b974a.JPG", alt: "Завтрак «Лучше всех»: глазунья, домашние колбаски, овощи и грибной соус" },
  { slug: "otlichnyj", url: OLD + "food/Food-Name-69afebdad0b47.png", alt: "Завтрак «Отличный»: омлет с моцареллой, овощи и гранола" },
  { slug: "kapitalnyj", url: OLD + "food/Food-Name-69b00b7b69f89.png", alt: "Завтрак «Капитальный»: колбаски, яйца, гренки, хумус и черри" },
  { slug: "syrniki", url: OLD + "food/Food-Name-650d5b3ce6919.jpg", alt: "Сырники со сметаной и ягодами" },
  { slug: "10-iz-10", url: OLD + "food/Food-Name-69b008efe154b.png", alt: "Завтрак «10 из 10»: бриошь с сёмгой и авокадо под голландезом, руккола и черри" },
  { slug: "kak-v-skazke", url: OLD + "food/Food-Name-6a1e7a56bfaf5.jpg", alt: "Завтрак «Как в сказке»: скрэмбл с креветками и зелёным горошком, киноа, брокколи и черри" },
  { slug: "shik", url: OLD + "food/Food-Name-69b00804a2291.png", alt: "Завтрак «Шик»: бурый и дикий рис, цыплёнок в сливочном соусе, овощи и ржаной хлеб" },
  { slug: "shakshuka", url: OLD + "food/Food-Name-69b00705b4717.png", alt: "Шакшука: яйца в томатах с перцем, креметте и тосты" },
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
  { slug: "team-1", placeholder: true, credit: "Burst, StockSnap, CC0", url: "https://cdn.stocksnap.io/img-thumbs/960w/DTKOOFPC06.jpg", alt: "Бариста рисует латте-арт (временное фото)" },
  { slug: "team-2", placeholder: true, credit: "rawpixel, CC0", url: "https://images.rawpixel.com/editor_1024/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbnMzNzU0LWltYWdlLWt3eXJ4dGxxLmpwZw.jpg", alt: "Бариста наливает кофе в стакан с собой (временное фото)" },
  { slug: "team-3", placeholder: true, credit: "Malidate Van, StockSnap, CC0", url: "https://cdn.stocksnap.io/img-thumbs/960w/ZCW5B7GXFY.jpg", alt: "Руки бариста у эспрессо-машины (временное фото)" },
  { slug: "team-4", placeholder: true, credit: "Burst, StockSnap, CC0", url: "https://cdn.stocksnap.io/img-thumbs/960w/ERHOTDPNMV.jpg", alt: "Гость держит чашку с латте-артом (временное фото)" },
  { slug: "cafe-shogencukova-19", placeholder: true, credit: "rawpixel, CC0", url: "https://images.rawpixel.com/editor_1024/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvdXB3azYxODIyMDY5LXdpa2ltZWRpYS1pbWFnZS1rb3dreDY3aC5qcGc.jpg", alt: "Кофейня на проспекте Шогенцукова, 19 (временное фото)" },
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
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(file);
  manifest.push({ ...p, file, width: info.width, height: info.height });
  console.log(`OK ${p.slug} ${info.width}x${info.height} ${Math.round(info.size / 1024)}KB${p.placeholder ? " (placeholder)" : ""}`);
}
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
