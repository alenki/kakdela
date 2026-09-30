// Static imports so next/image knows intrinsic sizes and generates blur placeholders.
// Client photos come from kakdelacoffee.ru, the café's Instagram and its own Yandex Maps uploads;
// `placeholder: true` marks CC0 stand-ins (see src/assets/photos/manifest.json for credits). A café photo's
// `sign` is where its «Как дела?» sign is (types.ts): the about page's street lines every sign up on one
// line. Kujbysheva 3 (the mural) shows no sign.
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

// /menu: kitchen card and dessert vitrine thumbnails (client, 1200px)
import ovsyanayaKasha from "@/assets/photos/ovsyanaya-kasha.jpg";
import risovayaKasha from "@/assets/photos/risovaya-kasha.jpg";
import talbina from "@/assets/photos/talbina.jpg";
import pankejki from "@/assets/photos/pankejki.jpg";
import pokeSKuricej from "@/assets/photos/poke-s-kuricej.jpg";
import pokeSSyomgoj from "@/assets/photos/poke-s-syomgoj.jpg";
import boulSKrevetkami from "@/assets/photos/boul-s-krevetkami.jpg";
import boulSKuricej from "@/assets/photos/boul-s-kuricej.jpg";
import sendvichSKuricej from "@/assets/photos/sendvich-s-kuricej.jpg";
import sendvichSSyomgoj from "@/assets/photos/sendvich-s-syomgoj.jpg";
import sendvichSIndejkoj from "@/assets/photos/sendvich-s-indejkoj.jpg";
import sendvichSPryanojGovyadinoj from "@/assets/photos/sendvich-s-pryanoj-govyadinoj.jpg";
import rollSKuricej from "@/assets/photos/roll-s-kuricej.jpg";
import rollSSyomgoj from "@/assets/photos/roll-s-syomgoj.jpg";
import pastaSKuricej from "@/assets/photos/pasta-s-kuricej.jpg";
import pastaSKrevetkami from "@/assets/photos/pasta-s-krevetkami.jpg";
import trajfl from "@/assets/photos/trajfl.jpg";
import tortBeze from "@/assets/photos/tort-beze.jpg";
import pannaKotta from "@/assets/photos/panna-kotta.jpg";
import tiramisu from "@/assets/photos/tiramisu.jpg";
import tartSMaskarponeIMalinoj from "@/assets/photos/tart-s-maskarpone-i-malinoj.jpg";
import dubajskijBatonchik from "@/assets/photos/dubajskij-batonchik.jpg";
import snikersPp from "@/assets/photos/snikers-pp.jpg";
import bauntiPp from "@/assets/photos/baunti-pp.jpg";
import deniz from "@/assets/photos/deniz.jpg";
import syrokSoSgushchenkoj from "@/assets/photos/syrok-so-sgushchenkoj.jpg";
import syrokShokoladnyj from "@/assets/photos/syrok-shokoladnyj.jpg";
import finikiVShokolade from "@/assets/photos/finiki-v-shokolade.jpg";
import moti from "@/assets/photos/moti.jpg";
import { EN } from "@/i18n/locale";
import { overlay } from "./en/overlay";
import { photosEn } from "./en";

export const photos = {
  luchsheVseh: { src: luchsheVseh, alt: "Завтрак «Лучше всех»: глазунья, домашние колбаски, свежие овощи и грибной соус" },
  otlichnyj: { src: otlichnyj, alt: "Завтрак «Отличный»: омлет с моцареллой, тост с авокадо, салат и соус" },
  kapitalnyj: { src: kapitalnyj, alt: "Завтрак «Капитальный»: яйца, гренки, хумус, салат и черри" },
  syrniki: { src: syrniki, alt: "Сырники на сметанной подушке под вишнёвым соусом" },
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
  cafeLenina32: { src: cafeLenina32, alt: "Кофейня на проспекте Ленина, 32", sign: { x: 0.45, y: 0.525, w: 0.594 } },
  cafeShogencukova14: { src: cafeShogencukova14, alt: "Кофейня на проспекте Шогенцукова, 14", sign: { x: 0.688, y: 0.325, w: 0.36 } },
  cafeAtazhukina10v: { src: cafeAtazhukina10v, alt: "Кофейня с верандой на улице Атажукина, 10В", sign: { x: 0.416, y: 0.288, w: 0.325 } },
  cafeLermontova4: { src: cafeLermontova4, alt: "Фасад кофейни «Саральп» на улице Лермонтова, 4", sign: { x: 0.54, y: 0.463, w: 0.306 } },
  cafeKujbysheva3: { src: cafeKujbysheva3, alt: "Роспись на стене кофейни на улице Куйбышева, 3 во Владикавказе" },
  cafePlieva32: { src: cafePlieva32, alt: "Кофейня на улице Генерала Плиева, 32 во Владикавказе", sign: { x: 0.63, y: 0.196, w: 0.4 } },
  desyatIzDesyati: { src: desyatIzDesyati, alt: "Завтрак «10 из 10»: бриошь с сёмгой и авокадо под голландезом, руккола и черри" },
  kakVSkazke: { src: kakVSkazke, alt: "Завтрак «Как в сказке»: скрэмбл с креветками и зелёным горошком, киноа, брокколи и черри" },
  shik: { src: shik, alt: "Завтрак «Шик»: бурый и дикий рис, цыплёнок в сливочном соусе, свежие овощи и ржаной хлеб" },
  shakshuka: { src: shakshuka, alt: "Шакшука: яйца в томатах с перцем, креметте и тосты" },
  team1: { src: team1, alt: "Бариста наливает фильтр-кофе из термоса в фирменную кружку" },
  team2: { src: team2, alt: "Холодный кофе наливают из бутылки в фирменный стакан «Как дела?» со льдом" },
  team3: { src: team3, alt: "Бариста в фартуке держит холдер со свежемолотым кофе у кофемолки" },
  team4: { src: team4, alt: "Гость в зелёном свитере держит фирменный стакан «Как дела?»" },
  cafeShogencukova19: { src: cafeShogencukova19, alt: "Вывеска «Как дела?» над стеклянной витриной кофейни на проспекте Шогенцукова, 19", sign: { x: 0.405, y: 0.308, w: 0.76 }, thumb: { x: 0.75, y: 0.5 } },
  // /menu kitchen card thumbnails (client)
  ovsyanayaKasha: { src: ovsyanayaKasha, alt: "Овсяная каша с бананом, клубникой и голубикой" },
  risovayaKasha: { src: risovayaKasha, alt: "Рисовая каша с клубникой и голубикой" },
  talbina: { src: talbina, alt: "Тальбина с финиками и грецкими орехами" },
  pankejki: { src: pankejki, alt: "Панкейки с кремом, голубикой и ягодным соусом" },
  pokeSKuricej: { src: pokeSKuricej, alt: "Поке с курицей: рис, филе цыплёнка, яйцо, черри и эдамаме" },
  pokeSSyomgoj: { src: pokeSSyomgoj, alt: "Поке с сёмгой: рис, сёмга, перец, красная капуста, кукуруза, эдамаме и соус с кунжутом" },
  boulSKrevetkami: { src: boulSKrevetkami, alt: "Боул с киноа, креветками, авокадо, песто, черри, редисом и лаймом" },
  boulSKuricej: { src: boulSKuricej, alt: "Боул с курицей: нут, филе цыплёнка, авокадо, черри, лайм и зелень" },
  sendvichSKuricej: { src: sendvichSKuricej, alt: "Сэндвич с курицей, картофель по-деревенски и соус" },
  sendvichSSyomgoj: { src: sendvichSSyomgoj, alt: "Сэндвич с сёмгой, картофель по-деревенски и соус" },
  sendvichSIndejkoj: { src: sendvichSIndejkoj, alt: "Сэндвич с индейкой, картофель фри и соус" },
  sendvichSPryanojGovyadinoj: { src: sendvichSPryanojGovyadinoj, alt: "Сэндвич с пряной говядиной, картофель по-деревенски и соус" },
  rollSKuricej: { src: rollSKuricej, alt: "Ролл с курицей в лаваше, разрезанный пополам" },
  rollSSyomgoj: { src: rollSSyomgoj, alt: "Ролл с сёмгой в лаваше, разрезанный пополам" },
  pastaSKuricej: { src: pastaSKuricej, alt: "Паста с курицей, шампиньонами и пармезаном, черри и зелёное масло" },
  pastaSKrevetkami: { src: pastaSKrevetkami, alt: "Паста с креветками в соусе песто, пармезан и черри" },
  // /menu dessert vitrine thumbnails (client)
  trajfl: { src: trajfl, alt: "Трайфл в баночке: шоколадная крошка, крем, фисташка и голубика" },
  tortBeze: { src: tortBeze, alt: "Торт безе со сливочным кремом и клубникой" },
  pannaKotta: { src: pannaKotta, alt: "Панна-котта с малиновым джемом в баночке" },
  tiramisu: { src: tiramisu, alt: "Тирамису в баночке с какао" },
  tartSMaskarponeIMalinoj: { src: tartSMaskarponeIMalinoj, alt: "Кусок тарта с маскарпоне и малиной, сверху миндальные лепестки" },
  dubajskijBatonchik: { src: dubajskijBatonchik, alt: "Дубайский батончик в молочном шоколаде с фисташками" },
  snikersPp: { src: snikersPp, alt: "ПП-батончик «Сникерс» в молочном шоколаде с арахисом" },
  bauntiPp: { src: bauntiPp, alt: "ПП-батончик «Баунти» в молочном шоколаде" },
  deniz: { src: deniz, alt: "Конфеты «Дениз» в молочном шоколаде с морской солью" },
  syrokSoSgushchenkoj: { src: syrokSoSgushchenkoj, alt: "Сырки с варёной сгущёнкой в молочном шоколаде" },
  syrokShokoladnyj: { src: syrokShokoladnyj, alt: "Шоколадные сырки в глазури с хрустящей крошкой" },
  finikiVShokolade: { src: finikiVShokolade, alt: "Финики в молочном шоколаде с фисташковой крошкой" },
  moti: { src: moti, alt: "Разноцветные моти на тарелке" },
} satisfies Record<string, Photo>;

// The English build lays its words over these (src/content/en).
if (EN) overlay(photos, photosEn);
