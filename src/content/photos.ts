// Static imports so next/image knows intrinsic sizes and generates blur placeholders.
// Client photos come from kakdelacoffee.ru; `placeholder: true` marks CC0 stand-ins
// (see src/assets/photos/manifest.json for credits).
import type { Photo } from "./types";

import luchsheVseh from "@/assets/photos/luchshe-vseh.jpg";
import otlichnyj from "@/assets/photos/otlichnyj.jpg";
import kapitalnyj from "@/assets/photos/kapitalnyj.jpg";
import syrniki from "@/assets/photos/syrniki.jpg";
import espressoTonik from "@/assets/photos/espresso-tonik.jpg";
import dalsheSlashe from "@/assets/photos/dalshe-slashe.jpg";
import klever from "@/assets/photos/klever.jpg";
import stanciyaMir from "@/assets/photos/stanciya-mir.jpg";
import kapuchino from "@/assets/photos/kapuchino.jpg";
import zolotojKleverok from "@/assets/photos/zolotoj-kleverok.jpg";
import medovik from "@/assets/photos/medovik.jpg";
import brauni from "@/assets/photos/brauni.jpg";
import sanSebastyan from "@/assets/photos/san-sebastyan.jpg";
import vishnevyjPirog from "@/assets/photos/vishnevyj-pirog.jpg";
import cafeBajsultanova1 from "@/assets/photos/cafe-bajsultanova-1.jpg";
import cafeLermontova59 from "@/assets/photos/cafe-lermontova-59.jpg";
import cafeLenina32 from "@/assets/photos/cafe-lenina-32.jpg";
import cafeShogencukova14 from "@/assets/photos/cafe-shogencukova-14.jpg";
import cafeAtazhukina10v from "@/assets/photos/cafe-atazhukina-10v.jpg";
import cafeLermontova4 from "@/assets/photos/cafe-lermontova-4.jpg";
import cafeKujbysheva3 from "@/assets/photos/cafe-kujbysheva-3.jpg";
import cafePlieva32 from "@/assets/photos/cafe-plieva-32.jpg";
import desyatIzDesyati from "@/assets/photos/10-iz-10.jpg";
import kakVSkazke from "@/assets/photos/kak-v-skazke.jpg";
import shik from "@/assets/photos/shik.jpg";
import shakshuka from "@/assets/photos/shakshuka.jpg";
import team1 from "@/assets/photos/team-1.jpg";
import team2 from "@/assets/photos/team-2.jpg";
import team3 from "@/assets/photos/team-3.jpg";
import team4 from "@/assets/photos/team-4.jpg";
import cafeShogencukova19 from "@/assets/photos/cafe-shogencukova-19.jpg";

export const photos = {
  luchsheVseh: { src: luchsheVseh, alt: "Завтрак «Лучше всех»: глазунья, домашние колбаски, свежие овощи и грибной соус" },
  otlichnyj: { src: otlichnyj, alt: "Завтрак «Отличный»: омлет с моцареллой, тост с авокадо, салат и соус" },
  kapitalnyj: { src: kapitalnyj, alt: "Завтрак «Капитальный»: яйца, гренки, хумус, салат и черри" },
  syrniki: { src: syrniki, alt: "Сырники с соусами" },
  espressoTonik: { src: espressoTonik, alt: "Эспрессо-тоник со льдом и цитрусами" },
  dalsheSlashe: { src: dalsheSlashe, alt: "Авторский напиток «Дальше слаще» с грейпфрутом" },
  klever: { src: klever, alt: "Кофе «Клевер» в стеклянном кувшине" },
  stanciyaMir: { src: stanciyaMir, alt: "Авторский фильтр «Станция Мир» со сливочной шапкой" },
  kapuchino: { src: kapuchino, alt: "Капучино с латте-артом" },
  zolotojKleverok: { src: zolotojKleverok, alt: "Напиток «Золотой клеверок» с леденцом-клевером на кружевной салфетке" },
  medovik: { src: medovik, alt: "Медовик на тёмной тарелке" },
  brauni: { src: brauni, alt: "Брауни с пеканом" },
  sanSebastyan: { src: sanSebastyan, alt: "Чизкейк Сан-Себастьян с шоколадным соусом" },
  vishnevyjPirog: { src: vishnevyjPirog, alt: "Вишнёвый пирог с шариком мороженого" },
  cafeBajsultanova1: { src: cafeBajsultanova1, alt: "Фасад кофейни с верандой на улице Байсултанова, 1" },
  cafeLermontova59: { src: cafeLermontova59, alt: "Интерьер кофейни на улице Лермонтова, 59: вывеска «Как дела?» над баром" },
  cafeLenina32: { src: cafeLenina32, alt: "Кофейня на проспекте Ленина, 32" },
  cafeShogencukova14: { src: cafeShogencukova14, alt: "Кофейня на проспекте Шогенцукова, 14" },
  cafeAtazhukina10v: { src: cafeAtazhukina10v, alt: "Кофейня с верандой на улице Атажукина, 10В" },
  cafeLermontova4: { src: cafeLermontova4, alt: "Фасад кофейни «Саральп» на улице Лермонтова, 4" },
  cafeKujbysheva3: { src: cafeKujbysheva3, alt: "Роспись на стене кофейни на улице Куйбышева, 3 во Владикавказе" },
  cafePlieva32: { src: cafePlieva32, alt: "Кофейня на улице Генерала Плиева, 32 во Владикавказе" },
  desyatIzDesyati: { src: desyatIzDesyati, alt: "Завтрак «10 из 10»: бриошь с сёмгой и авокадо под голландезом, руккола и черри" },
  kakVSkazke: { src: kakVSkazke, alt: "Завтрак «Как в сказке»: скрэмбл с креветками и зелёным горошком, киноа, брокколи и черри" },
  shik: { src: shik, alt: "Завтрак «Шик»: бурый и дикий рис, цыплёнок в сливочном соусе, свежие овощи и ржаной хлеб" },
  shakshuka: { src: shakshuka, alt: "Шакшука: яйца в томатах с перцем, креметте и тосты" },
  team1: { src: team1, alt: "Бариста рисует латте-арт (временное фото)", placeholder: true },
  team2: { src: team2, alt: "Бариста наливает капучино в бумажный стаканчик (временное фото)", placeholder: true },
  team3: { src: team3, alt: "Руки бариста у эспрессо-машины (временное фото)", placeholder: true },
  team4: { src: team4, alt: "Гость держит чашку с латте-артом (временное фото)", placeholder: true },
  cafeShogencukova19: { src: cafeShogencukova19, alt: "Кофейня на проспекте Шогенцукова, 19 (временное фото)", placeholder: true },
} satisfies Record<string, Photo>;
