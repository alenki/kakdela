// Static imports so next/image knows intrinsic sizes and generates blur placeholders.
// Client photos come from kakdelacoffee.ru; `placeholder: true` marks CC0 stand-ins
// (see src/assets/photos/manifest.json for credits). A café photo's `sign` is where its «Как дела?» sign
// is (types.ts): the about page's street lines every sign up on one line. Kujbysheva 3 (the mural) shows
// no sign, and Shogencukova 19 is still a stand-in.
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
  cafeBajsultanova1: { src: cafeBajsultanova1, alt: "Фасад кофейни с верандой на улице Байсултанова, 1", sign: { x: 0.588, y: 0.202, w: 0.563 } },
  cafeLermontova59: { src: cafeLermontova59, alt: "Интерьер кофейни на улице Лермонтова, 59: вывеска «Как дела?» над баром", sign: { x: 0.298, y: 0.343, w: 0.44 } },
  // The same photo, cut down to the kitchen door at the back of the room (the about page's opening).
  kitchenDoor: { src: cafeLermontova59, alt: "Дверь кухни в кофейне на улице Лермонтова, 59 с надписью «Как дела на кухне?»" },
  cafeLenina32: { src: cafeLenina32, alt: "Кофейня на проспекте Ленина, 32", sign: { x: 0.45, y: 0.525, w: 0.594 } },
  cafeShogencukova14: { src: cafeShogencukova14, alt: "Кофейня на проспекте Шогенцукова, 14", sign: { x: 0.688, y: 0.325, w: 0.36 } },
  cafeAtazhukina10v: { src: cafeAtazhukina10v, alt: "Кофейня с верандой на улице Атажукина, 10В", sign: { x: 0.416, y: 0.288, w: 0.325 } },
  cafeLermontova4: { src: cafeLermontova4, alt: "Фасад кофейни «Саральп» на улице Лермонтова, 4", sign: { x: 0.54, y: 0.463, w: 0.306 } },
  cafeKujbysheva3: { src: cafeKujbysheva3, alt: "Роспись на стене кофейни на улице Куйбышева, 3 во Владикавказе" },
  cafePlieva32: { src: cafePlieva32, alt: "Кофейня на улице Генерала Плиева, 32 во Владикавказе", sign: { x: 0.63, y: 0.196, w: 0.4 } },
  desyatIzDesyati: { src: desyatIzDesyati, alt: "Завтрак «10 из 10»", placeholder: true },
  kakVSkazke: { src: kakVSkazke, alt: "Завтрак «Как в сказке»", placeholder: true },
  shik: { src: shik, alt: "Завтрак «Шик»", placeholder: true },
  shakshuka: { src: shakshuka, alt: "Шакшука", placeholder: true },
  team1: { src: team1, alt: "Бариста рисует латте-арт", placeholder: true },
  team2: { src: team2, alt: "Бариста наливает капучино в бумажный стаканчик", placeholder: true },
  team3: { src: team3, alt: "Руки бариста у эспрессо-машины", placeholder: true },
  team4: { src: team4, alt: "Гость держит чашку с латте-артом", placeholder: true },
  cafeShogencukova19: { src: cafeShogencukova19, alt: "Кофейня на проспекте Шогенцукова, 19", placeholder: true },
} satisfies Record<string, Photo>;
