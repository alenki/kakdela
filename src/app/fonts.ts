import { Montserrat, Neucha, Sofia_Sans_Extra_Condensed } from "next/font/google";

// Two families, plus the barista's hand in one place (below). Display: heavy condensed caps for titles,
// dish names and big numbers.
// Requires <html lang="ru"> so Д/Л render in their Russian (not Bulgarian) forms.
export const display = Sofia_Sans_Extra_Condensed({
  subsets: ["cyrillic", "latin"],
  variable: "--nf-display",
  display: "swap",
});

// The café's own face (their signage and posts are set in it). Upright: body, UI, labels, and every
// price, hour and phone (with tabular figures). Italic: the café's voice, used sparingly: the
// team statement, review quotes, the hero's reply. latin-ext carries ₽.
export const sans = Montserrat({
  subsets: ["cyrillic", "latin", "latin-ext"],
  style: ["normal", "italic"],
  variable: "--nf-sans",
  display: "swap",
});

// The barista's hand, for one thing only: the notes in the coffee poster (the cup's sleeve, the phones'
// band, one line per drink). Not preloaded: the poster sits well below the fold.
export const hand = Neucha({
  weight: "400",
  subsets: ["cyrillic", "latin"],
  variable: "--nf-hand",
  display: "swap",
  preload: false,
});

export const fontVariables = [display, sans, hand].map((f) => f.variable).join(" ");
