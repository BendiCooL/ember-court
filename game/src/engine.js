// Ember Court — rules engine: state, rounds, lane scoring, win/lose.
// Pure logic, no DOM. The render layer reads `state` and re-draws it.

import { buildDeck, shuffle, makeRng } from "./cards.js";

export const MAX_ROUNDS = 10;
export const START_LIFE = 20;
export const HAND_SIZE = 5;
export const MAX_EMBER = 8;
export const LANE_NAMES = ["Ember Gate", "Frost Bridge", "Thorn Hollow"];

export function newGame(seed) {
  const rng = makeRng(seed == null ? (Date.now() % 2147483647) : seed);
  const state = {
    seed,
    phase: "title", // title | play | ai | resolve | won | lost
    round: 1,
    ember: { you: 1, ai: 1 },
    life: { you: START_LIFE, ai: START_LIFE },
    hands: { you: [], ai: [] },
    decks: { you: shuffle(buildDeck(), rng), ai: shuffle(buildDeck(), rng) },
    lanes: [0, 1, 2].map(() => ({ you: [], ai: [], sapYou: 0, sapAi: 0 })),
    lanesWon: { you: 0, ai: 0 },
    damageDealt: { you: 0, ai: 0 },
    first: "you", // who plays first this round — alternates every round
    selected: null, // index into your hand, or null
    log: ["Welcome to the Ember Court."],
    result: null, // { winner, reason, breakdown } once the match ends
    muted: false,
  };
  drawUp(state, "you");
  drawUp(state, "ai");
  return state;
}

export function drawUp(state, side) {
  while (state.hands[side].length < HAND_SIZE && state.decks[side].length > 0) {
    state.hands[side].push(state.decks[side].pop());
  }
}

// Power of one side in one lane, after banners and sappers.
// `cards` is the side's card list in the lane; `sap` the sapped power.
export function lanePowerFrom(cards, sap) {
  let power = 0;
  let banners = 0;
  for (const card of cards) {
    power += card.power;
    if (card.kind === "banner") banners++;
  }
  // Each banner adds +1 to every OTHER friendly card in the lane.
  if (banners > 0 && cards.length > 1) {
    power += banners * (cards.length - 1);
  }
  return Math.max(0, power - sap);
}

export function lanePower(state, laneIndex, side) {
  const lane = state.lanes[laneIndex];
  const sap = side === "you" ? lane.sapYou : lane.sapAi;
  return lanePowerFrom(lane[side], sap);
}

export function totalPower(state, side) {
  return [0, 1, 2].reduce((sum, i) => sum + lanePower(state, i, side), 0);
}

export function canPlay(state, card) {
  return state.phase === "play" && card.cost <= state.ember.you;
}

export function playCard(state, side, handIndex, laneIndex) {
  const hand = state.hands[side];
  const card = hand[handIndex];
  if (!card) return null;
  if (card.cost > state.ember[side]) return null;
  hand.splice(handIndex, 1);
  state.ember[side] -= card.cost;
  const lane = state.lanes[laneIndex];
  if (card.kind === "sapper") {
    // A sapper is spent at once: it never sits in the lane.
    if (side === "you") lane.sapAi += 3; else lane.sapYou += 3;
    log(state, `${name(side)} plays ${card.name} in ${LANE_NAMES[laneIndex]} — foe loses 3 power there.`);
  } else {
    lane[side].push(card);
    log(state, `${name(side)} plays ${card.name} (${card.power}) in ${LANE_NAMES[laneIndex]}.`);
  }
  return card;
}

function name(side) {
  return side === "you" ? "You" : "The Warden";
}

export function resolveRound(state) {
  state.phase = "resolve";
  let roundText = [];
  for (let i = 0; i < 3; i++) {
    const yp = lanePower(state, i, "you");
    const ap = lanePower(state, i, "ai");
    if (yp > ap) {
      const dmg = yp - ap;
      state.life.ai -= dmg;
      state.damageDealt.you += dmg;
      state.lanesWon.you++;
      roundText.push(`${LANE_NAMES[i]}: you ${yp}–${ap}, Warden loses ${dmg} life.`);
    } else if (ap > yp) {
      const dmg = ap - yp;
      state.life.you -= dmg;
      state.damageDealt.ai += dmg;
      state.lanesWon.ai++;
      roundText.push(`${LANE_NAMES[i]}: Warden ${ap}–${yp}, you lose ${dmg} life.`);
    } else {
      roundText.push(`${LANE_NAMES[i]}: tied ${yp}–${yp}, no damage.`);
    }
  }
  log(state, `Round ${state.round} — ` + roundText.join(" "));
  state.lanes = [0, 1, 2].map(() => ({ you: [], ai: [], sapYou: 0, sapAi: 0 }));
  return checkEnd(state);
}

function checkEnd(state) {
  if (state.life.you <= 0 && state.life.ai <= 0) {
    // Both courts fall on the same round: the side that dealt more damage
    // takes the crown; then lanes won; the challenger only wins a full tie.
    const winner = state.damageDealt.you !== state.damageDealt.ai
      ? (state.damageDealt.you > state.damageDealt.ai ? "you" : "ai")
      : state.lanesWon.you !== state.lanesWon.ai
        ? (state.lanesWon.you > state.lanesWon.ai ? "you" : "ai")
        : "you";
    return endMatch(state, winner, "Both courts fall on the same round — decided on damage dealt.");
  }
  if (state.life.ai <= 0) {
    return endMatch(state, "you", "The Warden's life reaches 0.");
  }
  if (state.life.you <= 0) {
    return endMatch(state, "ai", "Your life reaches 0.");
  }
  if (state.round >= MAX_ROUNDS) {
    if (state.life.you !== state.life.ai) {
      const winner = state.life.you > state.life.ai ? "you" : "ai";
      return endMatch(state, winner, `After ${MAX_ROUNDS} rounds, ${winner === "you" ? "your" : "the Warden's"} life is higher.`);
    }
    if (state.lanesWon.you !== state.lanesWon.ai) {
      const winner = state.lanesWon.you > state.lanesWon.ai ? "you" : "ai";
      return endMatch(state, winner, `Life is tied — ${winner === "you" ? "you won" : "the Warden won"} more lanes.`);
    }
    const winner = state.damageDealt.you >= state.damageDealt.ai ? "you" : "ai";
    return endMatch(state, winner, "Everything is tied — the challenger takes the crown on damage dealt.");
  }
  return null;
}

function endMatch(state, winner, reason) {
  state.phase = winner === "you" ? "won" : "lost";
  state.life.you = Math.max(0, state.life.you);
  state.life.ai = Math.max(0, state.life.ai);
  state.result = {
    winner,
    reason,
    rounds: state.round,
    life: { ...state.life },
    lanesWon: { ...state.lanesWon },
    damageDealt: { ...state.damageDealt },
  };
  log(state, winner === "you" ? "Victory! The Ember Court is yours." : "Defeat. The Warden keeps the court.");
  return state.result;
}

export function nextRound(state) {
  if (state.phase === "won" || state.phase === "lost") return;
  state.round++;
  // The first player alternates each round, so neither side keeps the
  // second-player edge of seeing the other's commitments first.
  state.first = state.round % 2 === 1 ? "you" : "ai";
  // Ember carries over (cap 10): saving up for a big round is a real choice.
  state.ember.you = Math.min(10, state.ember.you + Math.min(state.round, MAX_EMBER));
  state.ember.ai = Math.min(10, state.ember.ai + Math.min(state.round, MAX_EMBER));
  drawUp(state, "you");
  drawUp(state, "ai");
  state.selected = null;
  state.phase = "play";
  log(state, `Round ${state.round} — you gain ${Math.min(state.round, MAX_EMBER)} ember. ${state.first === "ai" ? "The Warden plays first." : "You play first."}`);
}

export function log(state, text) {
  state.log.push(text);
  if (state.log.length > 4) state.log = state.log.slice(-4);
}
