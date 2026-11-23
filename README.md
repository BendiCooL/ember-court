# Ember Court

![make.fun bounty](https://make.fun/badge/best-card-game-20261122-1826.svg)
![rank](https://make.fun/badge/best-card-game-20261122-1826/BendiCooL/ember-court/rank.svg)
![reward](https://make.fun/badge/best-card-game-20261122-1826/BendiCooL/ember-court/reward.svg)

An original three-lane card duel for the make.fun bounty
[Make the best card game](https://make.fun/bounty/best-card-game-20261122-1826).

You are the challenger. Across three lanes — Ember Gate, Frost Bridge and
Thorn Hollow — you play cards against the Warden, a computer opponent that
scores every move by the damage it deals. Win lanes to burn the Warden's
life; lose yours and the court is his.

## The game

- **20 life each, 10 rounds.** Reduce the Warden to 0 life, or hold more
  life when the rounds run out.
- **Ember is mana.** Each round you gain ember equal to the round (max 8);
  unspent ember carries over (max 10), so you can save up for a big round.
- **Cards cost ember and carry power.** Units add power to a lane, Sappers
  remove 3 enemy power from a lane, and Banners give +1 to every other
  friendly card in their lane.
- **Lanes resolve every round.** The stronger side in a lane deals the
  difference as damage. The first player alternates each round.
- **The Warden thinks.** It simulates every legal play and picks the one
  that deals the most damage — it answers your strongest lane, flips lanes
  it can win, and saves ember when nothing it can play helps.

## Play

Open `game/index.html` in a desktop browser (or serve `game/` with any
static file server). No network, no build step, no dependencies. Click a
card, then click a lane to play it; `Enter` ends the round. Keys `1–5`
select a card, `M` toggles sound, `N` starts a new game.

## Layout

- `game/` — the playable game as static files (`index.html`, `styles.css`,
  `src/` with one job per file: cards, engine, AI, render, input, sound,
  main).
- `screenshots/` — title screen, a full mid-game table, victory and defeat.
- `main.ts` — builds the submission output from this repo.
- `vendor/makefun-game.ts` — vendored from the competition kit, unchanged.

## License

MIT — see [LICENSE](LICENSE).
