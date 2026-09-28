import { photos } from "./photos";
import { yandexReviews } from "./routes";
import type { Review, TeamMember } from "./types";

// Verbatim Yandex Maps quotes (trimmed with «…»). `permission` must be confirmed by the client.
export const reviews: Review[] = [
  {
    id: "elbrus",
    text: "Были в Нальчике проездом перед поездкой к Эльбрусу… Место для завтрака произвело впечатление… На обратном пути целенаправленно заехали ещё раз.",
    cafeId: "bajsultanova-1",
    sourceUrl: yandexReviews("231916384633"),
    permission: false,
  },
  {
    id: "warmth",
    text: "Важно этот взгляд при входе, эта теплота при встрече.",
    cafeId: "bajsultanova-1",
    sourceUrl: yandexReviews("231916384633"),
    permission: false,
  },
  {
    id: "family",
    text: "Отличное место для всей семьи, яркий интерьер, уютно… Заказали «Лучше всех» и «Как в сказке»… Бариста варят достойный эспрессо.",
    cafeId: "bajsultanova-1",
    sourceUrl: yandexReviews("231916384633"),
    permission: false,
  },
];

// PLACEHOLDER team answers and photos: to be replaced with the real team's own words. An answer that is
// one of the notice's tabs is its `answerId` (the word comes from answers.ts); anything else is `answer`.
export const team: TeamMember[] = [
  {
    id: "barista-1",
    name: "Бариста",
    role: "Байсултанова, 1",
    answerId: "luchshe-vseh",
    line: "Сегодня на фильтре новая Эфиопия. Заходите, налью попробовать.",
    photo: photos.team1,
    placeholder: true,
  },
  {
    id: "barista-2",
    name: "Бариста",
    role: "Шогенцукова, 19",
    answerId: "kak-v-skazke",
    line: "Первый капучино в 7:30, первая партия в блиц вечером.",
    photo: photos.team2,
    placeholder: true,
  },
  {
    id: "trainer",
    name: "Бариста-тренер",
    role: "вся сеть",
    answerId: "vsyo-shik",
    line: "Учим каждого бариста так, чтобы чашка была одинаково вкусной в любой из девяти кофеен.",
    photo: photos.team3,
    placeholder: true,
  },
  {
    id: "guest",
    name: "Постоянный гость",
    role: "с 2023 года",
    answerId: "10-iz-10",
    line: "Здесь помнят, какой кофе я пью, и спрашивают, как дела. По-настоящему.",
    photo: photos.team4,
    placeholder: true,
  },
];

export const chessEvent = {
  body: "Несколько туров, партия до десяти минут. Победитель получает сертификат на 5 000 ₽.",
  when: "Даты объявляем в Telegram",
};
