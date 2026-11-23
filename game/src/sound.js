// Ember Court — tiny WebAudio sounds, synthesized, no audio files.
// All sounds are short oscillator blips so the game stays fully offline.

let ctx = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function blip(freq, dur, type = "sine", gain = 0.08, when = 0) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sounds = {
  select() { blip(660, 0.07, "triangle", 0.05); },
  play(muted) {
    if (muted) return;
    blip(392, 0.09, "triangle", 0.08);
    blip(523, 0.1, "triangle", 0.06, 0.06);
  },
  resolve(muted) {
    if (muted) return;
    blip(330, 0.12, "sine", 0.07);
    blip(440, 0.14, "sine", 0.07, 0.1);
  },
  win(muted) {
    if (muted) return;
    [523, 659, 784, 1047].forEach((f, i) => blip(f, 0.22, "triangle", 0.08, i * 0.12));
  },
  lose(muted) {
    if (muted) return;
    [392, 330, 262, 196].forEach((f, i) => blip(f, 0.25, "sine", 0.08, i * 0.14));
  },
  click(muted) {
    if (muted) return;
    blip(520, 0.05, "square", 0.03);
  },
};
