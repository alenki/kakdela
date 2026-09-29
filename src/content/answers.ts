import { photos } from "./photos";
import type { Answer, AnswerId } from "./types";
import { EN } from "@/i18n/locale";
import { overlay } from "./en/overlay";
import { answersEn } from "./en";

// The tear-off tabs, in order. Each answer to «Как дела?» is also something on the menu.
export const answers: Answer[] = [
  {
    id: "luchshe-vseh",
    label: "Лучше всех",
    mood: "good",
    item: { kind: "breakfast", name: "Завтрак «Лучше всех»", price: { nalchik: 670, vladikavkaz: 710 }, photo: photos.luchsheVseh, anchor: "luchshe-vseh" },
    reply: "У нас тоже! Глазунья, домашние колбаски, свежие овощи и грибной соус. Это завтрак «Лучше всех».",
    verify: { verified: true },
  },
  {
    id: "kak-v-skazke",
    label: "Как в сказке",
    mood: "good",
    item: { kind: "breakfast", name: "Завтрак «Как в сказке»", price: { nalchik: 730, vladikavkaz: 770 }, photo: photos.kakVSkazke, anchor: "kak-v-skazke" },
    reply: "Тогда вам завтрак «Как в сказке»: скрэмбл с креветками.",
    verify: { verified: false, note: "Рецепт уточнить" },
  },
  {
    id: "vsyo-shik",
    label: "Всё шик",
    mood: "good",
    item: { kind: "breakfast", name: "Завтрак «Шик»", price: { nalchik: 730, vladikavkaz: 750 }, photo: photos.shik, anchor: "shik" },
    reply: "Шикарно. Бурый и дикий рис, цыплёнок в сливочном соусе. Это завтрак «Шик».",
    verify: { verified: false },
  },
  {
    id: "10-iz-10",
    label: "10 из 10",
    mood: "good",
    item: { kind: "breakfast", name: "Завтрак «10 из 10»", price: { nalchik: 840, vladikavkaz: null }, photo: photos.desyatIzDesyati, anchor: "10-iz-10" },
    reply: "Согласны. Бриошь, сёмга, авокадо и голландез собственного приготовления.",
    verify: { verified: false },
  },
  {
    id: "est-hochu",
    label: "Есть хочу",
    mood: "hungry",
    item: { kind: "breakfast", name: "Завтрак «Капитальный»", price: { nalchik: 670, vladikavkaz: 710 }, photo: photos.kapitalnyj, anchor: "kapitalnyj" },
    reply: "Сейчас накормим: яйца, гренки, хумус, моцарелла и черри. Это завтрак «Капитальный».",
    verify: { verified: true },
  },
  {
    id: "normalno",
    label: "Нормально",
    mood: "meh",
    item: { kind: "dish", name: "Шакшука", price: { nalchik: 550, vladikavkaz: null }, photo: photos.shakshuka, anchor: "shakshuka" },
    reply: "Нормально? Это уже хорошо. А с шакшукой будет ещё лучше.",
    verify: { verified: false },
  },
  {
    id: "sonno",
    label: "Сонно",
    mood: "tired",
    item: { kind: "drink", name: "Эспрессо-тоник", price: { nalchik: 290, vladikavkaz: 290 }, photo: photos.espressoTonik, anchor: "espresso-tonik" },
    reply: "Понимаем. Эспрессо-тоник взбодрит с первого глотка.",
    verify: { verified: true },
  },
  {
    id: "tak-sebe",
    label: "Так себе",
    mood: "meh",
    item: { kind: "drink", name: "«Дальше слаще»", price: { nalchik: 350, vladikavkaz: 350 }, photo: photos.dalsheSlashe, anchor: "dalshe-slashe" },
    reply: "Бывает. Держите «Дальше слаще»: название не случайное.",
    verify: { verified: true },
  },
];

export const answerById = Object.fromEntries(answers.map((a) => [a.id, a])) as Record<AnswerId, Answer>;
export const DEFAULT_ANSWER: AnswerId = "luchshe-vseh";

/** Moscow-time guess shown before the guest answers (applied by an inline script before paint). */
export const TIME_GUESS: { from: number; to: number; id: AnswerId }[] = [
  { from: 0, to: 7.5, id: "sonno" },
  { from: 7.5, to: 11, id: "sonno" },
  { from: 11, to: 16, id: "luchshe-vseh" },
  { from: 16, to: 24, id: "vsyo-shik" },
];

// The English build lays its words over these (src/content/en).
if (EN) overlay(answers, answersEn);
