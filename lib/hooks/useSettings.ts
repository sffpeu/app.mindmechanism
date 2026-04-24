import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const CLOCK_COUNT = 9

interface SettingsState {
  /** UI sound effects (clicks, step tones, session start) */
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;

  /** Master toggle for clock breathing tones (Web Audio oscillators) */
  tonesEnabled: boolean;
  setTonesEnabled: (enabled: boolean) => void;

  /** Master volume for clock breathing tones — 0 to 1 */
  toneVolume: number;
  setToneVolume: (volume: number) => void;

  /** Per-clock mute for breathing tones — index 0–8 */
  clockToneMuted: boolean[];
  setClockToneMuted: (index: number, muted: boolean) => void;

  /**
   * Smart Home: connected hub type.
   * null = not connected. Populated after OAuth / local pairing flow.
   */
  smartHomeHub: 'hue' | 'ikea' | null;
  setSmartHomeHub: (hub: 'hue' | 'ikea' | null) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      soundEnabled: true,
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

      tonesEnabled: true,
      setTonesEnabled: (enabled) => set({ tonesEnabled: enabled }),

      toneVolume: 0.8,
      setToneVolume: (volume) => set({ toneVolume: Math.max(0, Math.min(1, volume)) }),

      clockToneMuted: Array(CLOCK_COUNT).fill(false) as boolean[],
      setClockToneMuted: (index, muted) => {
        const next = [...get().clockToneMuted]
        next[index] = muted
        set({ clockToneMuted: next })
      },

      smartHomeHub: null,
      setSmartHomeHub: (hub) => set({ smartHomeHub: hub }),
    }),
    {
      name: 'app-settings',
    }
  )
);
