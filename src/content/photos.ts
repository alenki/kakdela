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

// /menu: drinks and the rest of the kitchen for the card grid (client, up to 1200px)
import dranikiSSyomgoj from "@/assets/photos/draniki-s-syomgoj.jpg";
import espresso from "@/assets/photos/espresso.jpg";
import amerikano from "@/assets/photos/amerikano.jpg";
import fletUajt from "@/assets/photos/flet-uajt.jpg";
import latte from "@/assets/photos/latte.jpg";
import rafKlassicheskij from "@/assets/photos/raf-klassicheskij.jpg";
import filtrKofe from "@/assets/photos/filtr-kofe.jpg";
import v60 from "@/assets/photos/v60.jpg";
import rafCitrus from "@/assets/photos/raf-citrus.jpg";
import rafMalinaApelsin from "@/assets/photos/raf-malina-apelsin.jpg";
import tvinPiks from "@/assets/photos/tvin-piks.jpg";
import filtrSlivaGibiskus from "@/assets/photos/filtr-sliva-gibiskus.jpg";
import espressoTonikGranat from "@/assets/photos/espresso-tonik-granat.jpg";
import bamblKlassicheskij from "@/assets/photos/bambl-klassicheskij.jpg";
import bamblNaFreshe from "@/assets/photos/bambl-na-freshe.jpg";
import ajsLatte from "@/assets/photos/ajs-latte.jpg";
import matchaLatte from "@/assets/photos/matcha-latte.jpg";
import matchaLichiAnanas from "@/assets/photos/matcha-lichi-ananas.jpg";
import matchaKlubnika from "@/assets/photos/matcha-klubnika.jpg";
import matchaMalinaBelyjShokolad from "@/assets/photos/matcha-malina-belyj-shokolad.jpg";
import kakao from "@/assets/photos/kakao.jpg";
import beanToBar from "@/assets/photos/bean-to-bar.jpg";
import mangoCitrus from "@/assets/photos/mango-citrus.jpg";
import karkadeGranat from "@/assets/photos/karkade-granat.jpg";
import oblepihaKlyukva from "@/assets/photos/oblepiha-klyukva.jpg";
import imbirLimonMyod from "@/assets/photos/imbir-limon-myod.jpg";
import yagodnyjLapsang from "@/assets/photos/yagodnyj-lapsang.jpg";
import freshApelsin from "@/assets/photos/fresh-apelsin.jpg";
import freshGrejpfrut from "@/assets/photos/fresh-grejpfrut.jpg";
import freshGranat from "@/assets/photos/fresh-granat.jpg";
import freshYabloko from "@/assets/photos/fresh-yabloko.jpg";
import freshMorkov from "@/assets/photos/fresh-morkov.jpg";
import shotVitaminnyj from "@/assets/photos/shot-vitaminnyj.jpg";
import espressoShot from "@/assets/photos/espresso-shot.jpg";
import malinaMarakujya from "@/assets/photos/malina-marakujya.jpg";
import granatKlyukva from "@/assets/photos/granat-klyukva.jpg";
import modnyjLimonnyj from "@/assets/photos/modnyj-limonnyj.jpg";
import persikKalamansi from "@/assets/photos/persik-kalamansi.jpg";
import bananovyj from "@/assets/photos/bananovyj.jpg";
import klubnichnyj from "@/assets/photos/klubnichnyj.jpg";
import shokoladnoBananovyj from "@/assets/photos/shokoladno-bananovyj.jpg";
import kofejnoBananovyj from "@/assets/photos/kofejno-bananovyj.jpg";

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
  cafeBajsultanova1: { src: cafeBajsultanova1, alt: "Фасад кофейни с верандой на улице Байсултанова, 1" },
  cafeLermontova59: { src: cafeLermontova59, alt: "Интерьер кофейни на улице Лермонтова, 59: вывеска «Как дела?» над баром" },
  cafeLenina32: { src: cafeLenina32, alt: "Кофейня на проспекте Ленина, 32" },
  cafeShogencukova14: { src: cafeShogencukova14, alt: "Кофейня на проспекте Шогенцукова, 14" },
  cafeAtazhukina10v: { src: cafeAtazhukina10v, alt: "Кофейня с верандой на улице Атажукина, 10В" },
  cafeLermontova4: { src: cafeLermontova4, alt: "Фасад кофейни «Саральп» на улице Лермонтова, 4" },
  cafeKujbysheva3: { src: cafeKujbysheva3, alt: "Роспись на стене кофейни на улице Куйбышева, 3 во Владикавказе" },
  cafePlieva32: { src: cafePlieva32, alt: "Кофейня на улице Генерала Плиева, 32 во Владикавказе" },
  desyatIzDesyati: { src: desyatIzDesyati, alt: "Завтрак «10 из 10» (временное фото)", placeholder: true },
  kakVSkazke: { src: kakVSkazke, alt: "Завтрак «Как в сказке» (временное фото)", placeholder: true },
  shik: { src: shik, alt: "Завтрак «Шик» (временное фото)", placeholder: true },
  shakshuka: { src: shakshuka, alt: "Шакшука (временное фото)", placeholder: true },
  team1: { src: team1, alt: "Бариста рисует латте-арт (временное фото)", placeholder: true },
  team2: { src: team2, alt: "Бариста наливает капучино в бумажный стаканчик (временное фото)", placeholder: true },
  team3: { src: team3, alt: "Руки бариста у эспрессо-машины (временное фото)", placeholder: true },
  team4: { src: team4, alt: "Гость держит чашку с латте-артом (временное фото)", placeholder: true },
  cafeShogencukova19: { src: cafeShogencukova19, alt: "Кофейня на проспекте Шогенцукова, 19 (временное фото)", placeholder: true },
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
  // /menu: drinks and the rest of the kitchen (client)
  dranikiSSyomgoj: { src: dranikiSSyomgoj, alt: "Драники с сёмгой и яйцом пашот, авокадо с семечками, зелень и соус" },
  espresso: { src: espresso, alt: "Эспрессо в белой чашке и стакан воды на деревянном подносе" },
  amerikano: { src: amerikano, alt: "Американо в белой чашке на блюдце" },
  fletUajt: { src: fletUajt, alt: "Флэт уайт с латте-артом" },
  latte: { src: latte, alt: "Латте с латте-артом в белой чашке" },
  rafKlassicheskij: { src: rafKlassicheskij, alt: "Раф классический в белой чашке, рядом тростниковый сахар" },
  filtrKofe: { src: filtrKofe, alt: "Фильтр-кофе в белой кружке" },
  v60: { src: v60, alt: "Кофе из воронки V60 в стеклянном кувшине" },
  rafCitrus: { src: rafCitrus, alt: "Раф цитрус в белой чашке, на блюдце долька апельсина" },
  rafMalinaApelsin: { src: rafMalinaApelsin, alt: "Раф малина-апельсин, рядом апельсин и малина" },
  tvinPiks: { src: tvinPiks, alt: "Напиток «Твин-Пикс» со сливочной шапкой и вишней" },
  filtrSlivaGibiskus: { src: filtrSlivaGibiskus, alt: "Фильтр слива-гибискус в кружке «Как дела?», рядом слива и лепестки роз" },
  espressoTonikGranat: { src: espressoTonikGranat, alt: "Эспрессо-тоник гранат со льдом, рядом разломанный гранат" },
  bamblKlassicheskij: { src: bamblKlassicheskij, alt: "Бамбл классический: эспрессо над апельсиновым соком со льдом" },
  bamblNaFreshe: { src: bamblNaFreshe, alt: "Бамбл на фреше, рядом апельсины и лимон" },
  ajsLatte: { src: ajsLatte, alt: "Айс латте со льдом в высоком стакане" },
  matchaLatte: { src: matchaLatte, alt: "Матча латте с латте-артом" },
  matchaLichiAnanas: { src: matchaLichiAnanas, alt: "Матча личи-ананас со льдом, сверху сушёный лайм" },
  matchaKlubnika: { src: matchaKlubnika, alt: "Матча клубника со льдом: слои матчи, молока и клубники" },
  matchaMalinaBelyjShokolad: { src: matchaMalinaBelyjShokolad, alt: "Матча малина и белый шоколад в кружке с малиновой посыпкой" },
  kakao: { src: kakao, alt: "Какао с маршмеллоу" },
  beanToBar: { src: beanToBar, alt: "Горячий шоколад в кружке «Как дела?», рядом кусочки шоколада" },
  mangoCitrus: { src: mangoCitrus, alt: "Чай манго-цитрус в стеклянном чайнике, рядом апельсин и лайм" },
  karkadeGranat: { src: karkadeGranat, alt: "Чай каркаде-гранат в стеклянном чайнике, рядом гранат и сушёный каркаде" },
  oblepihaKlyukva: { src: oblepihaKlyukva, alt: "Чай облепиха-клюква в стеклянном чайнике, рядом ягоды и апельсин" },
  imbirLimonMyod: { src: imbirLimonMyod, alt: "Чай с имбирём, лимоном и мёдом в стеклянном чайнике" },
  yagodnyjLapsang: { src: yagodnyjLapsang, alt: "Ягодный лапсанг в стеклянном чайнике, рядом сушёные цитрусы и ягоды" },
  freshApelsin: { src: freshApelsin, alt: "Апельсиновый фреш, рядом половинки апельсина" },
  freshGrejpfrut: { src: freshGrejpfrut, alt: "Грейпфрутовый фреш, рядом дольки грейпфрута" },
  freshGranat: { src: freshGranat, alt: "Гранатовый фреш, рядом гранат" },
  freshYabloko: { src: freshYabloko, alt: "Яблочный фреш, рядом зелёное яблоко" },
  freshMorkov: { src: freshMorkov, alt: "Морковный фреш, рядом кружочки моркови" },
  shotVitaminnyj: { src: shotVitaminnyj, alt: "Витаминные шоты на деревянной подставке, рядом цитрусы, гранат и имбирь" },
  espressoShot: { src: espressoShot, alt: "Четыре шота на деревянной подставке" },
  malinaMarakujya: { src: malinaMarakujya, alt: "Лимонад малина-маракуйя со льдом" },
  granatKlyukva: { src: granatKlyukva, alt: "Лимонад гранат-клюква со льдом, рядом гранат и клюква" },
  modnyjLimonnyj: { src: modnyjLimonnyj, alt: "Лимонад «Модный лимонный», рядом лимон" },
  persikKalamansi: { src: persikKalamansi, alt: "Лимонад персик-каламанси в ребристом стакане" },
  bananovyj: { src: bananovyj, alt: "Банановый коктейль, рядом нарезанный банан" },
  klubnichnyj: { src: klubnichnyj, alt: "Клубничный коктейль, рядом клубника" },
  shokoladnoBananovyj: { src: shokoladnoBananovyj, alt: "Шоколадно-банановый коктейль в высоком стакане" },
  kofejnoBananovyj: { src: kofejnoBananovyj, alt: "Кофейно-банановый коктейль, рядом кофейные зёрна" },
} satisfies Record<string, Photo>;
