// Ember Court — card definitions and deck construction.
// Every card is an original design for this game: cost in ember, power,
// and at most one simple effect that is written on the card itself.

export const CARD_DEFS = [
  { key: "emberling", name: "Emberling", kind: "unit", cost: 1, power: 2,
    text: "A small spark with a big temper." },
  { key: "cinder-knight", name: "Cinder Knight", kind: "unit", cost: 2, power: 4,
    text: "Steady steel, warm blade." },
  { key: "flame-guard", name: "Flame Guard", kind: "unit", cost: 3, power: 6,
    text: "Holds the line. Never blinks." },
  { key: "ember-titan", name: "Ember Titan", kind: "unit", cost: 4, power: 8,
    text: "The court shakes when it stands." },
  { key: "sapper", name: "Sapper", kind: "sapper", cost: 2, power: 0,
    text: "Removes 3 power from the foe in this lane." },
  { key: "banner", name: "Banner of Embers", kind: "banner", cost: 3, power: 2,
    text: "+1 power to every other friendly card in this lane." },
];

// A 20-card deck: the same list for both sides, so every duel is fair.
const DECK_RECIPE = [
  ["emberling", 5],
  ["cinder-knight", 4],
  ["flame-guard", 3],
  ["ember-titan", 2],
  ["sapper", 3],
  ["banner", 3],
];

let nextCardId = 1;

export function buildDeck() {
  const deck = [];
  for (const [key, count] of DECK_RECIPE) {
    const def = CARD_DEFS.find((d) => d.key === key);
    for (let i = 0; i < count; i++) {
      deck.push({ id: nextCardId++, ...def });
    }
  }
  return deck;
}

// Small seeded RNG (mulberry32) so test drivers can replay exact deals.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(deck, rng) {
  const d = deck.slice();
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}
