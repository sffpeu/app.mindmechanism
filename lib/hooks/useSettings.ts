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

  /** Sine Hz from symbolic values vs looped planet drone samples */
  toneMode: 'synthetic' | 'drone';
  setToneMode: (mode: 'synthetic' | 'drone') => void;

  /**
   * Per-clock gain for drone samples (0–2, 1 = 100%). Ignored in synthetic mode.
   * Multiplied with master toneVolume and the breathing envelope on clock pages.
   */
  droneClockGain: number[];
  setDroneClockGain: (index: number, gain: number) => void;

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

  /** Colour transition when the wheel changes (seconds). Default 1.2 */
  hueTransitionSec: number;
  setHueTransitionSec: (sec: number) => void;

  /**
   * When true, sync affects all lights on the bridge (hueLightIds ignored).
   * When false, only hueLightIds are updated — must be non-empty to sync.
   */
  hueUseAllLights: boolean;
  setHueUseAllLights: (useAll: boolean) => void;

  /**
   * Resolved light IDs to control (derived from room selection).
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

  /** When true, a timed session starts streaming from Spotify or Apple if connected */
  sessionStreamingDuringSessions: boolean;
  setSessionStreamingDuringSessions: (enabled: boolean) => void;

  /** Which service to prefer during sessions when both are connected */
  sessionMusicProvider: 'auto' | 'spotify' | 'apple';
  setSessionMusicProvider: (p: 'auto' | 'spotify' | 'apple') => void;

  /** Optional spotify:playlist:id, open.spotify.com URL, or raw playlist id */
  spotifySessionPlaylistUri: string | null;
  setSpotifySessionPlaylistUri: (uri: string | null) => void;

  /** Optional Apple Music share URL or pl.* / p.* playlist id */
  appleMusicSessionPlaylistUrl: string | null;
  setAppleMusicSessionPlaylistUrl: (url: string | null) => void;

  /** Master toggle for optional accessibility-focused UI layer */
  accessibilityEnabled: boolean;
  setAccessibilityEnabled: (enabled: boolean) => void;

  /** Accessibility profile mode */
  accessibilityMode: 'visual' | 'hearing';
  setAccessibilityMode: (mode: 'visual' | 'hearing') => void;

  /** Universal app background base colour */
  universalBgColor: string;
  setUniversalBgColor: (color: string) => void;

  /** Universal app background repeating pattern */
  universalPatternId: number;
  setUniversalPatternId: (id: number) => void;

  /** Pattern tile size in px */
  universalPatternSize: number;
  setUniversalPatternSize: (size: number) => void;

  /** Pattern stroke colour */
  universalPatternLineColor: string;
  setUniversalPatternLineColor: (color: string) => void;

  /** Pattern fill colour */
  universalPatternFillColor: string;
  setUniversalPatternFillColor: (color: string) => void;

  /** Optional text scaling for accessibility */
  universalTextScaleEnabled: boolean;
  setUniversalTextScaleEnabled: (enabled: boolean) => void;
  universalTextScale: number;
  setUniversalTextScale: (scale: number) => void;

  /** Saved user-tuned profiles per accessibility mode */
  accessibilityCustomProfiles: Partial<Record<'visual' | 'hearing', {
    universalBgColor: string;
    universalPatternId: number;
    universalPatternSize: number;
    universalPatternLineColor: string;
    universalPatternFillColor: string;
    universalTextScaleEnabled: boolean;
    universalTextScale: number;
  }>>;
  saveAccessibilityCustomProfile: (mode: 'visual' | 'hearing') => void;
  applyAccessibilityCustomProfile: (mode: 'visual' | 'hearing') => boolean;
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

      toneMode: 'drone',
      setToneMode: (mode) => set({ toneMode: mode }),

      droneClockGain: Array(CLOCK_COUNT).fill(1) as number[],
      setDroneClockGain: (index, gain) => {
        const next = [...get().droneClockGain]
        next[index] = Math.max(0, Math.min(2, gain))
        set({ droneClockGain: next })
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

      hueTransitionSec: 1.2,
      setHueTransitionSec: (sec) =>
        set({ hueTransitionSec: Math.max(0.2, Math.min(5, sec)) }),

      hueUseAllLights: true,
      setHueUseAllLights: (useAll) => set({ hueUseAllLights: useAll }),

      hueLightIds: [],
      setHueLightIds: (ids) => set({ hueLightIds: ids }),

      hueRoomIds: [],
      setHueRoomIds: (ids) => set({ hueRoomIds: ids }),

      spotifyTokens: null,
      setSpotifyTokens: (tokens) => set({ spotifyTokens: tokens }),

      appleMusicUserToken: null,
      setAppleMusicUserToken: (token) => set({ appleMusicUserToken: token }),

      sessionStreamingDuringSessions: true,
      setSessionStreamingDuringSessions: (enabled) =>
        set({ sessionStreamingDuringSessions: enabled }),

      sessionMusicProvider: 'auto',
      setSessionMusicProvider: (p) => set({ sessionMusicProvider: p }),

      spotifySessionPlaylistUri: null,
      setSpotifySessionPlaylistUri: (uri) =>
        set({ spotifySessionPlaylistUri: uri?.trim() ? uri.trim() : null }),

      appleMusicSessionPlaylistUrl: null,
      setAppleMusicSessionPlaylistUrl: (url) =>
        set({ appleMusicSessionPlaylistUrl: url?.trim() ? url.trim() : null }),

      accessibilityEnabled: false,
      setAccessibilityEnabled: (enabled) => set({ accessibilityEnabled: enabled }),

      accessibilityMode: 'visual',
      setAccessibilityMode: (mode) => set({ accessibilityMode: mode }),

      // Non-black default per product requirement.
      universalBgColor: '#111827',
      setUniversalBgColor: (color) => set({ universalBgColor: color }),

      universalPatternId: 0,
      setUniversalPatternId: (id) => set({ universalPatternId: Math.max(0, Math.min(7, id)) }),

      universalPatternSize: 28,
      setUniversalPatternSize: (size) =>
        set({ universalPatternSize: Math.max(12, Math.min(96, Math.round(size))) }),

      universalPatternLineColor: '#FFFFFF',
      setUniversalPatternLineColor: (color) => set({ universalPatternLineColor: color }),

      universalPatternFillColor: '#00000000',
      setUniversalPatternFillColor: (color) => set({ universalPatternFillColor: color }),

      universalTextScaleEnabled: false,
      setUniversalTextScaleEnabled: (enabled) => set({ universalTextScaleEnabled: enabled }),

      universalTextScale: 1,
      setUniversalTextScale: (scale) =>
        set({ universalTextScale: Math.max(0.85, Math.min(1.5, Number(scale.toFixed(2)))) }),

      accessibilityCustomProfiles: {},
      saveAccessibilityCustomProfile: (mode) => {
        const s = get()
        const profile = {
          universalBgColor: s.universalBgColor,
          universalPatternId: s.universalPatternId,
          universalPatternSize: s.universalPatternSize,
          universalPatternLineColor: s.universalPatternLineColor,
          universalPatternFillColor: s.universalPatternFillColor,
          universalTextScaleEnabled: s.universalTextScaleEnabled,
          universalTextScale: s.universalTextScale,
        }
        set({
          accessibilityCustomProfiles: {
            ...s.accessibilityCustomProfiles,
            [mode]: profile,
          },
        })
      },
      applyAccessibilityCustomProfile: (mode) => {
        const profile = get().accessibilityCustomProfiles[mode]
        if (!profile) return false
        set({
          universalBgColor: profile.universalBgColor,
          universalPatternId: profile.universalPatternId,
          universalPatternSize: profile.universalPatternSize,
          universalPatternLineColor: profile.universalPatternLineColor,
          universalPatternFillColor: profile.universalPatternFillColor,
          universalTextScaleEnabled: profile.universalTextScaleEnabled,
          universalTextScale: profile.universalTextScale,
        })
        return true
      },
    }),
    {
      name: 'app-settings',
    }
  )
);
