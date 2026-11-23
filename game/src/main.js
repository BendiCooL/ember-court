// Ember Court — boot and turn flow: title → play → AI turn → resolve → next round.
// Wires the engine, AI, renderer and input together.

import { newGame, playCard, resolveRound, nextRound, canPlay } from "./engine.js";
import { choosePlay } from "./ai.js";
import { render } from "./render.js";
import { bindInput } from "./input.js";
import { sounds } from "./sound.js";

let state = newGame(seedFromUrl());

function seedFromUrl() {
  const m = /[?&]seed=(\d+)/.exec(location.search);
  return m ? Number(m[1]) : undefined;
}

// ?fast=1 shortens the Warden's animation pauses (used by the test driver).
const FAST = /[?&]fast=1/.test(location.search);
const STEP = FAST ? 40 : 420;

const handlers = {
  onCardClick(idx) {
    if (state.phase !== "play") return;
    if (state.selected === idx) {
      state.selected = null;
    } else {
      state.selected = idx;
      sounds.click(state.muted);
    }
    render(state, handlers);
  },
  onCardKey(idx) {
    if (idx < state.hands.you.length) handlers.onCardClick(idx);
  },
  onLaneClick(laneIndex) {
    if (state.phase !== "play" || state.selected == null) return;
    const card = state.hands.you[state.selected];
    if (!card || !canPlay(state, card)) return;
    playCard(state, "you", state.selected, laneIndex);
    state.selected = null;
    sounds.play(state.muted);
    render(state, handlers);
  },
  async onEndRound() {
    if (state.phase !== "play") return;
    if (state.first === "you") await playAiTurn();
    const result = resolveRound(state);
    sounds.resolve(state.muted);
    render(state, handlers);
    if (result) {
      if (result.winner === "you") sounds.win(state.muted);
      else sounds.lose(state.muted);
      return;
    }
    await sleep(FAST ? 60 : 900);
    nextRound(state);
    render(state, handlers);
    await beginRound();
  },
  onMute() {
    state.muted = !state.muted;
    render(state, handlers);
  },
  onNewGame() {
    state = newGame(seedFromUrl());
    render(state, handlers);
  },
  onEscape() {
    state.selected = null;
    render(state, handlers);
  },
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// The Warden plays one card at a time so the board visibly fills.
async function playAiTurn() {
  state.phase = "ai";
  render(state, handlers);
  await sleep(FAST ? 40 : 450);
  for (;;) {
    const move = choosePlay(state, "ai");
    if (!move) break;
    playCard(state, "ai", move.handIndex, move.lane);
    sounds.play(state.muted);
    render(state, handlers);
    await sleep(STEP);
  }
  await sleep(FAST ? 40 : 350);
}

// At the start of a round the first player may be the Warden (even rounds).
async function beginRound() {
  if (state.first === "ai") {
    await playAiTurn();
    if (state.phase === "ai") {
      state.phase = "play";
      render(state, handlers);
    }
  } else {
    state.phase = "play";
    render(state, handlers);
  }
}

document.getElementById("start-btn").addEventListener("click", () => {
  sounds.click(state.muted);
  beginRound();
});
document.getElementById("end-round").addEventListener("click", () => handlers.onEndRound());
document.getElementById("mute-btn").addEventListener("click", () => handlers.onMute());
document.getElementById("new-game-btn").addEventListener("click", () => handlers.onNewGame());
document.getElementById("play-again-btn").addEventListener("click", () => handlers.onNewGame());
bindInput(handlers);
render(state, handlers);

// Test hooks for the Playwright driver (not part of the game UI).
window.__ember = {
  get state() { return state; },
  newGame(seed) { state = newGame(seed); render(state, handlers); },
  start() { beginRound(); },
  endRound() { return handlers.onEndRound(); },
  setLife(side, n) { state.life[side] = n; render(state, handlers); },
  setRound(n) { state.round = n; render(state, handlers); },
  // Plays one Warden card (used by the test driver to photograph a full board).
  aiStep() {
    if (state.phase !== "play") return false;
    const move = choosePlay(state, "ai");
    if (!move) return false;
    playCard(state, "ai", move.handIndex, move.lane);
    render(state, handlers);
    return true;
  },
};
