// Ember Court — the computer opponent, "The Warden".
// Every candidate play is scored by what it does to the round's damage:
// the Warden simulates the lane totals with the card played and measures
// the net damage swing, so it places cards where they actually hurt.

import { lanePower, lanePowerFrom, playCard } from "./engine.js";

// Net damage the AI would deal minus what it would take, if the round
// resolved right now (positive = the AI is ahead on the board).
function netDamage(state) {
  let net = 0;
  for (let i = 0; i < 3; i++) {
    const mine = lanePower(state, i, "ai");
    const foe = lanePower(state, i, "you");
    net += Math.max(0, mine - foe) - Math.max(0, foe - mine);
  }
  return net;
}

// Lanes the AI currently leads, for the tiebreak value of winning lanes.
function lanesLed(state) {
  let n = 0;
  for (let i = 0; i < 3; i++) {
    if (lanePower(state, i, "ai") > lanePower(state, i, "you")) n++;
  }
  return n;
}

function scorePlay(state, side, handIndex, laneIndex) {
  const card = state.hands[side][handIndex];
  const lane = state.lanes[laneIndex];
  const beforeNet = netDamage(state);
  const beforeLed = lanesLed(state);

  // Hypothetical lane totals with this card played (no mutation).
  let myCards = lane[side];
  let mySap = side === "you" ? lane.sapYou : lane.sapAi;
  let foeSap = side === "you" ? lane.sapAi : lane.sapYou;
  const foe = side === "you" ? "ai" : "you";
  if (card.kind === "sapper") {
    foeSap += 3;
  } else {
    myCards = [...myCards, card];
  }
  const afterMine = lanePowerFrom(myCards, mySap);
  const afterFoe = lanePowerFrom(lane[foe], foeSap);
  const beforeMine = lanePower(state, laneIndex, side);
  const beforeFoe = lanePower(state, laneIndex, foe);
  const beforeLaneNet = Math.max(0, beforeMine - beforeFoe) - Math.max(0, beforeFoe - beforeMine);
  const afterLaneNet = Math.max(0, afterMine - afterFoe) - Math.max(0, afterFoe - afterMine);
  const afterNet = beforeNet - beforeLaneNet + afterLaneNet;
  const afterLed = beforeLed
    - (beforeMine > beforeFoe ? 1 : 0)
    + (afterMine > afterFoe ? 1 : 0);

  let score = (afterNet - beforeNet) * 10;
  score += (afterLed - beforeLed) * 8;
  // A sapper against an empty lane is wasted.
  if (card.kind === "sapper" && beforeFoe === 0) score -= 40;
  // All else equal, prefer the cheaper card.
  score -= card.cost;
  return score;
}

export function choosePlay(state, side = "ai") {
  let best = null;
  for (let h = 0; h < state.hands[side].length; h++) {
    const card = state.hands[side][h];
    if (card.cost > state.ember[side]) continue;
    for (let lane = 0; lane < 3; lane++) {
      const score = scorePlay(state, side, h, lane);
      if (!best || score > best.score) best = { score, handIndex: h, lane };
    }
  }
  // Ember carries over, so the Warden only plays when the move helps now;
  // a useless move is worse than saving the ember for a later round.
  if (!best || best.score < 1) return null;
  return best;
}

// Plays the AI turn one card at a time; the caller awaits between calls
// so the board visibly fills. Returns the number of cards played.
export function playTurn(state, side = "ai") {
  let played = 0;
  for (;;) {
    const move = choosePlay(state, side);
    if (!move) break;
    playCard(state, side, move.handIndex, move.lane);
    played++;
  }
  return played;
}
