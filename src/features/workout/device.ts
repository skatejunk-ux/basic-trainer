// Apparaat-functies voor de workout: trillen, piepje en scherm-aan (PLAN.md §6.3).
// Alles is uitschakelbaar via AppSettings; uit = de API wordt nooit aangeroepen.
import { useEffect } from 'react';

export const VIBRATE_TICK = 60;
export const VIBRATE_DONE = [300, 150, 300, 150, 600];

export function vibrate(enabled: boolean, pattern: number | number[]): void {
  if (!enabled) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* niet ondersteund */
  }
}

let audio: AudioContext | null = null;

/** Aanroepen vanuit een klik, zodat de browser later geluid toestaat. */
export function primeAudio(enabled: boolean): void {
  if (!enabled) return;
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') void audio.resume();
  } catch {
    /* geen Web Audio */
  }
}

export function beep(enabled: boolean, times = 2): void {
  if (!enabled || !audio) return;
  try {
    for (let i = 0; i < times; i++) {
      const t = audio.currentTime + i * 0.25;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain).connect(audio.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  } catch {
    /* negeren */
  }
}

/** Houdt het scherm aan zolang `enabled`; vraagt de lock opnieuw aan na terugkeer in de app. */
export function useWakeLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let active = true;
    const request = async () => {
      try {
        const l = await navigator.wakeLock.request('screen');
        if (active) lock = l;
        else void l.release();
      } catch {
        /* geweigerd (bv. batterijbesparing) */
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void request();
    };
    void request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release().catch(() => {});
    };
  }, [enabled]);
}
