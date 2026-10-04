import { useProgress } from "./progress";

let ctx: AudioContext | null = null;

function tone(freq: number, dur: number, delay = 0) {
  try {
    if (typeof window === "undefined") return;
    if (!useProgress.getState().sound) return;
    const Webkit = window as Window & { webkitAudioContext?: typeof AudioContext };
    const AC = window.AudioContext || Webkit.webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.045, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  } catch {
    /* audio is optional */
  }
}

export function playCorrect() {
  tone(523, 0.12);
  tone(659, 0.16, 0.09);
}

export function playWrong() {
  tone(196, 0.2);
}

export function playComplete() {
  tone(523, 0.1);
  tone(659, 0.12, 0.1);
  tone(784, 0.2, 0.2);
}
