// English words for the /menu page (src/content/full-menu.ts), laid over it as it loads in the English build.
// Keyed like the menu itself: chapter, category, item. The dishes the homepage shows take their names and
// descriptions from menu.ts's overlay (index.ts), so only the descriptions full-menu.ts adds to them are here.
// Russian dishes with no English word keep their name with a gloss (syrniki, raf); the café's own playful
// names get English ones. Provenance (oldName, draftNote, verify) is never shown, so it stays Russian.

export const fullMenuEn = {
  kuhnya: {
    title: "Kitchen",
    categories: {
      zavtraki: {
        title: "Breakfast",
        items: {
          shakshuka: { desc: "Eggs, tomatoes, bell pepper, onion, garlic, cream cheese, herbs and French bread." },
          "draniki-s-syomgoj": { name: "Potato pancakes with salmon and a poached egg" },
        },
      },
      kashi: {
        title: "Porridge",
        items: {
          "ovsyanaya-kasha": {
            name: "Oatmeal",
            desc: "Made with milk, with berries and sesame. Also with water or plant milk.",
            descByCity: { vladikavkaz: "Made with milk and cream, with butter and seasonal berries." },
          },
          "risovaya-kasha": {
            name: "Rice porridge",
            desc: "Made with milk, with berries. Also with water or plant milk.",
            descByCity: { vladikavkaz: "Made with milk and cream, with butter and seasonal berries." },
          },
          talbina: { name: "Talbina", desc: "Barley flour, milk, honey, walnuts, dates and cinnamon." },
        },
      },
      "sladkie-zavtraki": {
        title: "Sweet breakfasts",
        items: {
          syrniki: { desc: "Farmer’s cheese pancakes on a bed of sour cream, with cherry or raspberry sauce." },
          "mini-pankejki": { desc: "With chocolate spread and jam, granola and yogurt." },
          granola: { name: "Granola", desc: "With yogurt, seeds and berries, and cherry or raspberry sauce." },
          pankejki: { name: "Pancakes", desc: "Vanilla cream, berry syrup and cherry cream." },
        },
      },
      poke: {
        title: "Poke",
        items: {
          "poke-s-kuricej": {
            name: "Chicken poke",
            desc: "Brown and wild rice, chicken fillet, egg, cherry tomatoes, arugula, edamame and our own sauce.",
          },
          "poke-s-syomgoj": {
            name: "Salmon poke",
            desc: "Rice, salmon, bell pepper, red cabbage, sun-dried tomatoes, corn, edamame, sesame and our own sauce.",
          },
        },
      },
      bouly: {
        title: "Bowls",
        items: {
          "boul-s-krevetkami": { name: "Shrimp bowl", desc: "Quinoa, shrimp and fresh vegetables, with our own pesto." },
          "boul-s-kuricej": {
            name: "Chicken bowl",
            desc: "Chickpeas, chicken fillet, avocado, cherry tomatoes, cucumber, radish, herbs, lime, seeds and Carmen sauce.",
          },
        },
      },
      sendvichi: {
        title: "Sandwiches",
        items: {
          "sendvich-s-kuricej": {
            name: "Chicken sandwich",
            desc: "Crusty French bread, spiced chicken fillet and fresh vegetables. With country-style potatoes.",
            descByCity: {
              vladikavkaz: "French bread, cream cheese, chicken fillet, pesto, tomatoes, cucumber and herbs. With fries or country-style potatoes.",
            },
          },
          "sendvich-s-syomgoj": {
            name: "Salmon sandwich",
            desc: "Crusty French bread, salmon, cream cheese and fresh vegetables. With potatoes and a sauce of your choice.",
            descByCity: {
              vladikavkaz: "French bread, cream cheese, salmon, pesto, tomatoes, cucumber and herbs. With fries or country-style potatoes.",
            },
          },
          "sendvich-s-indejkoj": {
            name: "Turkey sandwich",
            desc: "Bread, smoked turkey, cheddar, lettuce, tomato, cucumber and our own sauce. With fries and a sauce.",
          },
          "sendvich-s-pryanoj-govyadinoj": {
            name: "Spiced beef sandwich",
            desc: "Bread, spiced beef, tomatoes, sun-dried tomatoes, lettuce and our own sauce. With fries or country-style potatoes and a sauce of your choice.",
          },
        },
      },
      rolly: {
        title: "Wraps",
        items: {
          "roll-s-kuricej": { name: "Chicken wrap", desc: "Lavash, chicken fillet, tomatoes, iceberg lettuce, cheddar and our own sauce." },
          "roll-s-syomgoj": { name: "Salmon wrap", desc: "Lavash, salmon, cream cheese and iceberg lettuce." },
        },
      },
      pasta: {
        title: "Pasta",
        items: {
          "pasta-s-kuricej": { name: "Chicken pasta", desc: "Chicken fillet, mushrooms, cherry tomatoes, cream sauce, parmesan and herb oil." },
          "pasta-s-krevetkami": { name: "Shrimp pasta", desc: "Shrimp, cherry tomatoes, cream sauce, pesto and parmesan." },
        },
      },
    },
  },
  bar: {
    title: "Bar",
    categories: {
      firmennoe: { title: "Signature" },
      "espresso-i-filtr": {
        title: "Espresso and filter",
        items: {
          espresso: { name: "Espresso" },
          amerikano: { name: "Americano" },
          "flet-uajt": { name: "Flat white" },
          latte: { name: "Latte" },
          // Raf is a Russian coffee: the one description Russian doesn't need.
          "raf-klassicheskij": { name: "Classic raf", desc: "Espresso whipped with cream and vanilla sugar." },
          "filtr-kofe": { name: "Filter coffee" },
        },
      },
      avtorskie: {
        title: "House drinks",
        items: {
          "raf-citrus": { name: "Citrus raf" },
          "raf-malina-apelsin": { name: "Raspberry-orange raf" },
          "tvin-piks": { name: "“Twin Peaks”" },
          "filtr-sliva-gibiskus": { name: "Plum-hibiscus filter" },
        },
      },
      "holodnyj-kofe": {
        title: "Iced coffee",
        items: {
          "espresso-tonik-granat": { name: "Pomegranate espresso tonic" },
          "bambl-klassicheskij": { name: "Classic bumble" },
          "bambl-na-freshe": { name: "Bumble with fresh juice" },
          "ajs-latte": { name: "Iced latte" },
        },
      },
      matcha: {
        title: "Matcha",
        items: {
          "matcha-latte": { name: "Matcha latte" },
          "matcha-lichi-ananas": { name: "Lychee-pineapple matcha", desc: "Matcha, lychee purée and pineapple juice." },
          "matcha-klubnika": { name: "Strawberry matcha" },
          "matcha-malina-belyj-shokolad": { name: "Raspberry and white chocolate matcha" },
        },
      },
      "kakao-i-shokolad": {
        title: "Cocoa and chocolate",
        items: {
          kakao: { name: "Cocoa" },
        },
      },
      chai: {
        title: "House teas",
        items: {
          "mango-citrus": { name: "Mango-citrus" },
          "karkade-granat": { name: "Hibiscus-pomegranate" },
          "oblepiha-klyukva": { name: "Sea buckthorn-cranberry" },
          "imbir-limon-myod": { name: "Ginger, lemon and honey" },
          "yagodnyj-lapsang": { name: "Berry lapsang" },
        },
      },
      limonady: {
        title: "Lemonades",
        items: {
          "malina-marakujya": { name: "Raspberry-passion fruit" },
          "granat-klyukva": { name: "Pomegranate-cranberry" },
          "modnyj-limonnyj": { name: "“Trendy Lemon”" },
          "persik-kalamansi": { name: "Peach-calamansi", desc: "Peach and calamansi purée: calamansi is a cross of mandarin and kumquat." },
        },
      },
      freshi: {
        title: "Fresh juices",
        items: {
          "fresh-apelsin": { name: "Orange" },
          "fresh-grejpfrut": { name: "Grapefruit" },
          "fresh-granat": { name: "Pomegranate" },
          "fresh-yabloko": { name: "Apple" },
          "fresh-morkov": { name: "Carrot" },
        },
      },
      koktejli: {
        title: "Milkshakes",
        items: {
          bananovyj: { name: "Banana" },
          klubnichnyj: { name: "Strawberry" },
          "shokoladno-bananovyj": { name: "Chocolate-banana" },
          "kofejno-bananovyj": { name: "Coffee-banana" },
        },
      },
      shoty: {
        title: "Shots",
        items: {
          "shot-vitaminnyj": { name: "Vitamin" },
          "espresso-shot": { name: "Espresso shot" },
        },
      },
    },
  },
  deserty: {
    title: "Desserts",
    categories: {
      firmennye: { title: "Signature" },
      "torty-i-pirozhnye": {
        title: "Cakes and pastries",
        items: {
          trajfl: { name: "Trifle", desc: "Chocolate crumble, Belgian milk chocolate, cream, bananas, pistachio and berries." },
          "tort-beze": { name: "Meringue cake", desc: "Meringue, cream, pistachio and berries." },
          "panna-kotta": { name: "Panna cotta", desc: "Cream soufflé and raspberry jam." },
          tiramisu: { name: "Tiramisu", desc: "Savoiardi biscuits, coffee soak, cream cheese, mascarpone and cocoa." },
          "tart-s-maskarpone-i-malinoj": { name: "Mascarpone and raspberry tart" },
          "shu-s-funduchnym-kremom": { name: "Choux with hazelnut cream" },
          "malinovyj-muss": { name: "Raspberry mousse", desc: "Sugar-free and gluten-free." },
          "kinder-kantri": { name: "“Kinder Country”" },
        },
      },
      "batonchiki-i-sladosti": {
        title: "Bars and sweets",
        items: {
          "dubajskij-batonchik": { name: "Dubai bar", desc: "Belgian milk chocolate, kataifi, pistachio paste and pistachios." },
          "snikers-pp": {
            name: "Healthier “Snickers” bar",
            desc: "Sugar-free Belgian milk chocolate, Jerusalem artichoke caramel and peanuts.",
          },
          "baunti-pp": { name: "Healthier “Bounty” bar", desc: "Sugar-free Belgian milk chocolate and coconut." },
          deniz: { name: "“Deniz” with sea salt", desc: "Belgian milk chocolate, Jerusalem artichoke syrup and sea salt." },
          "syrok-so-sgushchenkoj": {
            name: "Curd bar with dulce de leche",
            desc: "Farmer’s cheese, cream cheese and dulce de leche in Belgian milk and white chocolate.",
          },
          "syrok-shokoladnyj": { name: "Chocolate curd bar" },
          "finiki-v-shokolade": {
            name: "Chocolate-covered dates",
            desc: "Medjool dates in Belgian milk or dark chocolate, with a whole pistachio inside.",
          },
          moti: { name: "Mochiland mochi", desc: "Gluten-free." },
          "shokoladnaya-pp-granola": { name: "Healthier chocolate granola" },
        },
      },
    },
  },
};
