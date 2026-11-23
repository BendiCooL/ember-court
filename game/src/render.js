// Ember Court — rendering: turns `state` into DOM. No game logic here.

import { lanePower, totalPower, LANE_NAMES, MAX_ROUNDS, START_LIFE } from "./engine.js";

const $ = (id) => document.getElementById(id);

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

export function cardEl(card, opts = {}) {
  const c = el("div", "card kind-" + card.kind);
  if (opts.faceDown) {
    c.classList.add("back");
    c.appendChild(el("div", "card-back-mark", "♜"));
    return c;
  }
  c.appendChild(el("div", "card-cost", String(card.cost)));
  c.appendChild(el("div", "card-name", card.name));
  c.appendChild(el("div", "card-kind", card.kind === "unit" ? "UNIT" : card.kind === "sapper" ? "SAPPER" : "BANNER"));
  c.appendChild(el("div", "card-text", card.text));
  if (card.kind !== "sapper") c.appendChild(el("div", "card-power", String(card.power)));
  if (opts.selectable) c.classList.add("selectable");
  if (opts.selected) c.classList.add("selected");
  if (opts.disabled) c.classList.add("disabled");
  if (opts.onClick) c.addEventListener("click", opts.onClick);
  return c;
}

function lifeBar(side, life) {
  const wrap = el("div", "life-wrap");
  wrap.appendChild(el("span", "life-label", side === "you" ? "YOU" : "WARDEN"));
  const bar = el("div", "life-bar");
  const fill = el("div", "life-fill " + (side === "you" ? "you" : "ai"));
  fill.style.width = Math.max(0, (life / START_LIFE) * 100) + "%";
  bar.appendChild(fill);
  wrap.appendChild(bar);
  wrap.appendChild(el("span", "life-num", `${life} / ${START_LIFE}`));
  return wrap;
}

function emberPips(n) {
  const w = el("span", "ember-pips");
  for (let i = 0; i < n; i++) w.appendChild(el("span", "ember-pip", "●"));
  return w;
}

export function render(state, handlers) {
  $("round-label").textContent = `Round ${Math.min(state.round, MAX_ROUNDS)} / ${MAX_ROUNDS}`;
  $("score-line").textContent =
    `Lanes won — You ${state.lanesWon.you} · Warden ${state.lanesWon.ai}   ·   Damage dealt — You ${state.damageDealt.you} · Warden ${state.damageDealt.ai}`;

  // Opponent row
  const opp = $("opponent-row");
  opp.replaceChildren();
  opp.appendChild(el("div", "avatar ai-avatar", "W"));
  const oppInfo = el("div", "side-info");
  oppInfo.appendChild(el("div", "side-name", "The Warden"));
  oppInfo.appendChild(lifeBar("ai", state.life.ai));
  const oppEmber = el("div", "ember-line");
  oppEmber.appendChild(el("span", "ember-label", "Ember "));
  oppEmber.appendChild(emberPips(state.ember.ai));
  oppInfo.appendChild(oppEmber);
  opp.appendChild(oppInfo);
  const oppHand = el("div", "mini-hand");
  for (let i = 0; i < state.hands.ai.length; i++) oppHand.appendChild(cardEl({ kind: "unit" }, { faceDown: true }));
  oppHand.appendChild(el("span", "hand-count", `${state.hands.ai.length} cards · deck ${state.decks.ai.length}`));
  opp.appendChild(oppHand);

  // Lanes
  const lanesEl = $("lanes");
  lanesEl.replaceChildren();
  for (let i = 0; i < 3; i++) {
    const lane = el("div", "lane");
    lane.dataset.lane = String(i);
    if (state.selected != null && state.phase === "play") lane.classList.add("targetable");
    lane.appendChild(el("div", "lane-name", LANE_NAMES[i]));
    const aiRow = el("div", "lane-row ai-row");
    for (const card of state.lanes[i].ai) aiRow.appendChild(cardEl(card, { mini: true }));
    if (state.lanes[i].sapYou > 0) aiRow.appendChild(el("div", "sap-note", `−${state.lanes[i].sapYou} sapped`));
    lane.appendChild(aiRow);
    const mid = el("div", "lane-mid");
    const yp = lanePower(state, i, "you");
    const ap = lanePower(state, i, "ai");
    const yScore = el("span", "lane-score" + (yp > ap ? " leading" : ""), String(yp));
    const aScore = el("span", "lane-score" + (ap > yp ? " leading" : ""), String(ap));
    mid.appendChild(aScore);
    mid.appendChild(el("span", "lane-vs", "vs"));
    mid.appendChild(yScore);
    lane.appendChild(mid);
    const youRow = el("div", "lane-row you-row");
    for (const card of state.lanes[i].you) youRow.appendChild(cardEl(card, { mini: true }));
    if (state.lanes[i].sapAi > 0) youRow.appendChild(el("div", "sap-note", `−${state.lanes[i].sapAi} sapped`));
    lane.appendChild(youRow);
    lane.addEventListener("click", () => handlers.onLaneClick(i));
    lanesEl.appendChild(lane);
  }

  // Player row
  const pr = $("player-row");
  pr.replaceChildren();
  pr.appendChild(el("div", "avatar you-avatar", "Y"));
  const pInfo = el("div", "side-info");
  pInfo.appendChild(el("div", "side-name", "You — Challenger"));
  pInfo.appendChild(lifeBar("you", state.life.you));
  const pEmber = el("div", "ember-line");
  pEmber.appendChild(el("span", "ember-label", "Ember "));
  pEmber.appendChild(emberPips(state.ember.you));
  pEmber.appendChild(el("span", "ember-hint", `  (costs ${state.ember.you} left)`));
  pInfo.appendChild(pEmber);
  pr.appendChild(pInfo);

  const hand = $("player-hand");
  hand.replaceChildren();
  state.hands.you.forEach((card, idx) => {
    hand.appendChild(cardEl(card, {
      selectable: state.phase === "play",
      selected: state.selected === idx,
      disabled: state.phase !== "play" || card.cost > state.ember.you,
      onClick: () => handlers.onCardClick(idx),
    }));
  });
  hand.appendChild(el("span", "hand-count", `deck ${state.decks.you.length}`));

  // Controls + log
  const endBtn = $("end-round");
  endBtn.disabled = state.phase !== "play";
  endBtn.textContent = state.phase === "ai" ? "Warden is playing…" : state.phase === "resolve" ? "Resolving…" : "End Round  ⏎";
  const logEl = $("log");
  logEl.replaceChildren();
  for (const line of state.log.slice(-2)) logEl.appendChild(el("div", "log-line", line));

  // Overlays
  $("title-screen").classList.toggle("hidden", state.phase !== "title");
  const end = $("end-screen");
  if (state.phase === "won" || state.phase === "lost") {
    end.classList.remove("hidden");
    $("end-title").textContent = state.phase === "won" ? "VICTORY" : "DEFEAT";
    $("end-title").className = "end-title " + state.phase;
    $("end-reason").textContent = state.result.reason;
    const b = $("end-breakdown");
    b.replaceChildren();
    const rows = [
      ["Rounds played", String(state.result.rounds)],
      ["Life — You", `${state.result.life.you} / ${START_LIFE}`],
      ["Life — Warden", `${state.result.life.ai} / ${START_LIFE}`],
      ["Lanes won — You", String(state.result.lanesWon.you)],
      ["Lanes won — Warden", String(state.result.lanesWon.ai)],
      ["Damage you dealt", String(state.result.damageDealt.you)],
      ["Damage Warden dealt", String(state.result.damageDealt.ai)],
    ];
    for (const [k, v] of rows) {
      const r = el("div", "break-row");
      r.appendChild(el("span", "break-key", k));
      r.appendChild(el("span", "break-val", v));
      b.appendChild(r);
    }
    $("final-score").textContent =
      `Final score — You ${state.result.life.you} life, ${state.result.lanesWon.you} lanes · Warden ${state.result.life.ai} life, ${state.result.lanesWon.ai} lanes`;
  } else {
    end.classList.add("hidden");
  }

  $("mute-btn").textContent = state.muted ? "Sound: off" : "Sound: on";
  document.getElementById("app").dataset.phase = state.phase;
}
