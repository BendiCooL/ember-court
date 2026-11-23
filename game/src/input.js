// Ember Court — input: mouse clicks on cards/lanes and keyboard shortcuts.
// All input flows through the callbacks the main module provides.
// Keys: 1–5 select a hand card · Enter ends the round · M mute · N new game · Esc deselect.

export function bindInput(handlers) {
  document.addEventListener("keydown", (e) => {
    if (e.key >= "1" && e.key <= "5") {
      handlers.onCardKey(Number(e.key) - 1);
    } else if (e.key === "Enter") {
      handlers.onEndRound();
    } else if (e.key === "m" || e.key === "M") {
      handlers.onMute();
    } else if (e.key === "n" || e.key === "N") {
      handlers.onNewGame();
    } else if (e.key === "Escape") {
      handlers.onEscape();
    }
  });
}
