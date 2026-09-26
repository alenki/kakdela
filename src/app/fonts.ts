import { Cormorant_Garamond, Martian_Mono, Neucha, Onest, Sofia_Sans_Extra_Condensed } from "next/font/google";

// Both "voices" of the logo: thin tracked caps ask, heavy condensed caps answer.
// Requires <html lang="ru"> so Д/Л render in their Russian (not Bulgarian) forms.
export const display = Sofia_Sans_Extra_Condensed({
  subsets: ["cyrillic", "latin"],
  variable: "--nf-display",
  display: "swap",
});

// The café's replies: true cursive Russian italic.
export const serif = Cormorant_Garamond({
  subsets: ["cyrillic", "latin"],
  style: ["italic", "normal"],
  variable: "--nf-serif",
  display: "swap",
});

export const sans = Onest({
  subsets: ["cyrillic", "latin"],
  variable: "--nf-sans",
  display: "swap",
});

// Every price, hour and label. latin-ext carries ₽.
export const mono = Martian_Mono({
  subsets: ["cyrillic", "latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--nf-mono",
  display: "swap",
});

// Placeholder barista handwriting on the cup, until real notes are vectorised.
export const hand = Neucha({
  weight: "400",
  subsets: ["cyrillic", "latin"],
  variable: "--nf-hand",
  display: "swap",
  preload: false,
});

export const fontVariables = [display, serif, sans, mono, hand].map((f) => f.variable).join(" ");
