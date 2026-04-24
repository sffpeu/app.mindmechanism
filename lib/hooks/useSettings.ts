import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SpotifyTokens } from '@/lib/spotify'

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
   * null = not connected. Populated after local pairing flow.
   */
  smartHomeHub: 'hue' | 'ikea' | null;
  setSmartHomeHub: (hub: 'hue' | 'ikea' | null) => void;

  /** Hue bridge local IP address (e.g. "192.168.1.42") */
  hueBridgeIp: string | null;
  setHueBridgeIp: (ip: string | null) => void;

  /** Hue API key (username returned from bridge pairing) */
  hueApiKey: string | null;
  setHueApiKey: (key: string | null) => void;

  /** Whether to sync wheel colours to Hue lights on clock pages */
  hueEnabled: boolean;
  setHueEnabled: (enabled: boolean) => void;

  /** Hue light brightness 1–254. Default 180 */
  hueBrightness: number;
  setHueBrightness: (bri: number) => void;

  /**
   * Resolved light IDs to control (derived from room selection).
   * Empty array means all lights on the bridge.
   */
  hueLightIds: string[];
  setHueLightIds: (ids: string[]) => void;

  /**
   * Selected room (group) IDs — used to restore the room picker UI
   * and to re-derive hueLightIds if the light list changes.
   * Empty array = no rooms selected = all lights.
   */
  hueRoomIds: string[];
  setHueRoomIds: (ids: string[]) => void;

  // ── Music ─────────────────────────────────────────────────────────────────

  /** Spotify PKCE tokens. null = not connected */
  spotifyTokens: SpotifyTokens | null;
  setSpotifyTokens: (tokens: SpotifyTokens | null) => void;

  /** Apple Music user token returned from MusicKit.authorize(). null = not connected */
  appleMusicUserToken: string | null;
  setAppleMusicUserToken: (token: string | null) => void;
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

      hueBridgeIp: null,
      setHueBridgeIp: (ip) => set({ hueBridgeIp: ip }),

      hueApiKey: null,
      setHueApiKey: (key) => set({ hueApiKey: key }),

      hueEnabled: true,
      setHueEnabled: (enabled) => set({ hueEnabled: enabled }),

      hueBrightness: 180,
      setHueBrightness: (bri) => set({ hueBrightness: Math.max(1, Math.min(254, bri)) }),

      hueLightIds: [],
      setHueLightIds: (ids) => set({ hueLightIds: ids }),

      hueRoomIds: [],
      setHueRoomIds: (ids) => set({ hueRoomIds: ids }),

      spotifyTokens: null,
      setSpotifyTokens: (tokens) => set({ spotifyTokens: tokens }),

      appleMusicUserToken: null,
      setAppleMusicUserToken: (token) => set({ appleMusicUserToken: token }),
    }),
    {
      name: 'app-settings',
    }
  )
);
