// Downloads the café's own photos (the old site kakdelacoffee.ru, its Instagram and its Yandex Maps
// uploads), validates that each response is really an image, resizes to ≤2000px on the long
// edge and writes src/assets/photos/<slug>.jpg + manifest.json. next/image does the only
// web encode (AVIF/WebP) from these sources.
// Usage: node scripts/fetch-photos.mjs [--force]
import sharp from "sharp";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const OUT = "src/assets/photos";
const OLD = "https://www.kakdelacoffee.ru/images/";
const force = process.argv.includes("--force");

/** @type {{slug:string,url:string,source?:string,placeholder?:boolean,credit?:string,crop?:{aspect:string,position:string},alt:string}[]} */
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
  // Published by the café itself: Instagram @kakdela.coffee and its own uploads to the Yandex Maps
  // cards. Instagram CDN links are signed and expire, so re-fetch those from `source`.
  { slug: "cafe-shogencukova-19", url: "https://scontent-ord5-2.cdninstagram.com/v/t51.82787-15/708655129_18080918939546950_3796303180084814034_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=100&ig_cache_key=MzkwNzY3MDE5NjMwNTMyNDU2OA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMzA3Mi5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=cB2X8SnX138Q7kNvwEPJiJH&_nc_oc=Adr8tVXeknxhxgNls5AcNLsjjC_iPkgal9tA4AJzgXk2JQIXDuisBjTzt7D8Zhjk40c&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-ord5-2.cdninstagram.com&_nc_gid=9gzpnAiqDok1Y799FY8pWA&_nc_ss=7a22e&oh=00_AQIqOBav1lSltuPK8LWptO465Wzq0G_V486Xfyv6xUlFaQ&oe=6ABF6584", source: "https://www.instagram.com/p/DY61WcOCptc/?img_index=16", crop: { aspect: "3/2", position: "north" }, alt: "Кофейня «Как дела?» на проспекте Шогенцукова, 19" },
  { slug: "team-1", url: "https://scontent-ord5-2.cdninstagram.com/v/t51.82787-15/670417487_18087281900253304_5204291435224539217_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=104&ig_cache_key=MzUwMTIwMDgxMzM0NDQyODM4MA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=D_vybKhF55oQ7kNvwGwDMqQ&_nc_oc=AdpiuCdqmSgggJJgZTJmhiZtGnFI45PnPFqThDji2tLQ-o9Ab_P0R1_SZR4c1rUaZdM&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-ord5-2.cdninstagram.com&_nc_gid=f4_wRHeJWmsl11KCv--qmw&_nc_ss=7a22e&oh=00_AQJzuWDcSpvizLJWJWkCu9vUsvtgpz8h1MMLke443bVFBw&oe=6ABF45A9", source: "https://www.instagram.com/p/DCYhR-jtTet/?img_index=6", alt: "Бариста наливает фильтр-кофе из термоса в фирменную кружку" },
  { slug: "team-2", url: "https://scontent-ord5-2.cdninstagram.com/v/t51.82787-15/515923226_18046344878546950_4246136712161572279_n.jpg?stp=dst-jpg_e15_tt6&_nc_cat=103&ig_cache_key=MzY3MDAyNTMxMDI1ODcyNTE5MTE4MDQ2MzQ0ODY5NTQ2OTUw.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNMSVBTLnhwaWRzLjM0OTIuc2RyLnZpZGVvX2RlZmF1bHRfY292ZXJfZnJhbWUuQzMifQ%3D%3D&_nc_ohc=iiHiRdFER8gQ7kNvwHH0-IB&_nc_oc=AdogP14qiAyz8uMshQN3-T_MMglp6atVEm_H1SxGfu4bQjhShJzLTSlBEE2gvUyFBcM&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-ord5-2.cdninstagram.com&_nc_gid=TJZ5NkaRe5KVxj1fU4Csxw&_nc_ss=7a22e&oh=00_AQKl7X8VWU1d8aNUiftuqF6gPskfsAD3eDaygsoxZgfGyw&oe=6ABF649F", source: "https://www.instagram.com/reel/DLujJM2qgFH/", alt: "Холодный кофе наливают из бутылки в фирменный стакан «Как дела?» со льдом" },
  { slug: "team-3", url: "https://scontent-ord5-1.cdninstagram.com/v/t51.71878-15/502184684_1831677024044879_8807206460604938933_n.jpg?stp=dst-jpg_e15_tt6&_nc_cat=111&ig_cache_key=MzI2MjcwNjAxNTA0MzcyMTcwOQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNMSVBTLnhwaWRzLjk0NC5zZHIudmlkZW9fZGVmYXVsdF9jb3Zlcl9mcmFtZS5DMyJ9&_nc_ohc=HseG479Z3-IQ7kNvwFH_D3Y&_nc_oc=AdrAW69KDoji0HThLTorP1G5aLBA3uGWCg1ABsZODPH7SkQ-D_N3W6dfmI-XRU0UyLY&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-ord5-1.cdninstagram.com&_nc_gid=D2ZnhWSdObieDMX8iWDXBg&_nc_ss=7a22e&oh=00_AQPc0X7R5lbUUKtD6zMFI1NsDP9AIh2tXv6k4xDCywjvZg&oe=6ABF50CE", source: "https://www.instagram.com/reel/C1HddWJNhnt/", crop: { aspect: "4/5", position: "south" }, alt: "Бариста в фартуке держит холдер со свежемолотым кофе у кофемолки" },
  { slug: "team-4", url: "https://avatars.mds.yandex.net/get-altay/18150755/2a0000019b4a4bb9d7a424d2830c1c8aef4b/orig", source: "https://yandex.ru/maps/org/kak_dela_/205101204327/gallery/?photos%5Bbusiness%5D=205101204327&photos%5Bid%5D=urn%3Ayandex%3Asprav%3Aphoto%3A2a0000019b4a4bb9d7a424d2830c1c8aef4b", alt: "Гость в зелёном свитере держит фирменный стакан «Как дела?»" },
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
  let resize = { width: 2000, height: 2000, fit: "inside", withoutEnlargement: true };
  if (p.crop) {
    // The site crops to its frame around the centre; a photo whose subject sits elsewhere is
    // pre-cropped here to the frame's aspect, anchored at `crop.position` (a sharp gravity).
    const m = await sharp(buf).metadata();
    const [w, h] = (m.orientation ?? 1) >= 5 ? [m.height, m.width] : [m.width, m.height];
    const [aw, ah] = p.crop.aspect.split("/").map(Number);
    const bw = Math.min(w, (h * aw) / ah);
    const bh = (bw * ah) / aw;
    const k = Math.min(1, 2000 / Math.max(bw, bh));
    resize = { width: Math.round(bw * k), height: Math.round(bh * k), fit: "cover", position: p.crop.position };
  }
  const info = await sharp(buf)
    .rotate()
    .flatten({ background: "#141210" })
    .resize(resize)
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(file);
  manifest.push({ ...p, file, width: info.width, height: info.height });
  console.log(`OK ${p.slug} ${info.width}x${info.height} ${Math.round(info.size / 1024)}KB${p.placeholder ? " (placeholder)" : ""}`);
}
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
