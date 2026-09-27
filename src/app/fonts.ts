import { Cormorant_Garamond, Onest, Sofia_Sans_Extra_Condensed } from "next/font/google";

// Three families, no more. Display: heavy condensed caps for titles, dish names and big numbers.
// Requires <html lang="ru"> so Д/Л render in their Russian (not Bulgarian) forms.
export const display = Sofia_Sans_Extra_Condensed({
  subsets: ["cyrillic", "latin"],
  variable: "--nf-display",
  display: "swap",
});

// The café's voice, used sparingly and only in italic: the team statement, review quotes, the hero's
// reply. No upright face is loaded (an upright request falls back to this italic).
export const serif = Cormorant_Garamond({
  subsets: ["cyrillic", "latin"],
  style: "italic",
  variable: "--nf-serif",
  display: "swap",
});

// Everything else: body, UI, labels, and every price, hour and phone (with tabular figures).
// latin-ext carries ₽.
export const sans = Onest({
  subsets: ["cyrillic", "latin", "latin-ext"],
  variable: "--nf-sans",
  display: "swap",
});

export const fontVariables = [display, serif, sans].map((f) => f.variable).join(" ");
