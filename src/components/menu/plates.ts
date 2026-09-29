/**
 * Where the plate is in each dish's photo, by menu item id: the middle of the vessel (plate, bowl, glass, board)
 * as fractions of the photo's width (x) and height (y). The table and the vitrine lay every photo so this point
 * lands on the frame's middle (Plate.tsx), so the plate never moves and only the food changes. Measured by eye
 * off each photo (±0.01) and checked on a contact sheet with a crosshair: re-measure when a photo changes. A new
 * dish photo without an entry fails menu.test.ts.
 */
export const plates: Record<string, { x: number; y: number }> = {
  "10-iz-10": { x: 0.507, y: 0.5 }, // bowl
  "baunti-pp": { x: 0.502, y: 0.569 }, // plate
  "boul-s-krevetkami": { x: 0.501, y: 0.394 }, // bowl
  "boul-s-kuricej": { x: 0.525, y: 0.467 }, // bowl
  "brauni": { x: 0.491, y: 0.508 }, // plate
  "dalshe-slashe": { x: 0.497, y: 0.3 }, // glass
  "deniz": { x: 0.512, y: 0.513 }, // plate
  "dubajskij-batonchik": { x: 0.5, y: 0.545 }, // plate
  "espresso-tonik": { x: 0.378, y: 0.395 }, // glass
  "finiki-v-shokolade": { x: 0.525, y: 0.555 }, // plate
  "kak-v-skazke": { x: 0.506, y: 0.494 }, // bowl
  "kapitalnyj": { x: 0.508, y: 0.497 }, // plate
  "kapuchino": { x: 0.513, y: 0.61 }, // cup
  "klever": { x: 0.499, y: 0.546 }, // glass
  "luchshe-vseh": { x: 0.488, y: 0.524 }, // bowl
  "medovik": { x: 0.508, y: 0.535 }, // plate
  "moti": { x: 0.516, y: 0.535 }, // bowl
  "otlichnyj": { x: 0.5, y: 0.512 }, // plate
  "ovsyanaya-kasha": { x: 0.527, y: 0.423 }, // bowl
  "pankejki": { x: 0.492, y: 0.543 }, // plate
  "panna-kotta": { x: 0.464, y: 0.574 }, // glass
  "pasta-s-krevetkami": { x: 0.499, y: 0.498 }, // bowl
  "pasta-s-kuricej": { x: 0.496, y: 0.461 }, // bowl
  "poke-s-kuricej": { x: 0.521, y: 0.441 }, // bowl
  "poke-s-syomgoj": { x: 0.501, y: 0.468 }, // bowl
  "risovaya-kasha": { x: 0.507, y: 0.456 }, // bowl
  "roll-s-kuricej": { x: 0.501, y: 0.557 }, // bowl
  "roll-s-syomgoj": { x: 0.504, y: 0.594 }, // plate
  "san-sebastyan": { x: 0.521, y: 0.595 }, // plate
  "sendvich-s-indejkoj": { x: 0.501, y: 0.485 }, // bowl
  "sendvich-s-kuricej": { x: 0.498, y: 0.569 }, // bowl
  "sendvich-s-pryanoj-govyadinoj": { x: 0.506, y: 0.51 }, // plate
  "sendvich-s-syomgoj": { x: 0.511, y: 0.501 }, // plate
  "shakshuka": { x: 0.509, y: 0.497 }, // bowl
  "shik": { x: 0.524, y: 0.494 }, // bowl
  "snikers-pp": { x: 0.497, y: 0.53 }, // plate
  "stanciya-mir": { x: 0.495, y: 0.596 }, // glass
  "syrniki": { x: 0.503, y: 0.457 }, // bowl
  "syrok-shokoladnyj": { x: 0.504, y: 0.573 }, // plate
  "syrok-so-sgushchenkoj": { x: 0.525, y: 0.592 }, // plate
  "talbina": { x: 0.524, y: 0.441 }, // bowl
  "tart-s-maskarpone-i-malinoj": { x: 0.508, y: 0.526 }, // plate
  "tiramisu": { x: 0.511, y: 0.573 }, // glass
  "tort-beze": { x: 0.495, y: 0.56 }, // plate
  "trajfl": { x: 0.476, y: 0.554 }, // glass
  "vishnevyj-pirog": { x: 0.447, y: 0.58 }, // plate
};
