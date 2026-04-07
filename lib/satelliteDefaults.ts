import type { SatelliteSettings } from '@/types/ClockSettings';

const s = (sec: number) => sec * 1000;

/** Canonical satellite defaults: Clock 1 = index 0 … Clock 9 = index 8 */
export const defaultSatelliteConfigs: Record<number, SatelliteSettings[]> = {
  0: [
    { id: 0, name: 'Mimas', rotationTime: s(81432), rotationDirection: 'clockwise' },
    { id: 1, name: 'Enceladus', rotationTime: s(118368), rotationDirection: 'counterclockwise' },
    { id: 2, name: 'Tethys', rotationTime: s(163008), rotationDirection: 'clockwise' },
    { id: 3, name: 'Dione', rotationTime: s(236736), rotationDirection: 'counterclockwise' },
    { id: 4, name: 'Rhea', rotationTime: s(390528), rotationDirection: 'clockwise' },
    { id: 5, name: 'Titan', rotationTime: s(1378080), rotationDirection: 'counterclockwise' },
    { id: 6, name: 'Hyperion', rotationTime: s(1838592), rotationDirection: 'clockwise' },
    { id: 7, name: 'Iapetus', rotationTime: s(6854112), rotationDirection: 'counterclockwise' },
  ],
  1: [
    { id: 0, name: 'Naiad', rotationTime: s(25401), rotationDirection: 'clockwise' },
    { id: 1, name: 'Thalassa', rotationTime: s(26870), rotationDirection: 'counterclockwise' },
    { id: 2, name: 'Despina', rotationTime: s(28339), rotationDirection: 'clockwise' },
    { id: 3, name: 'Galatea', rotationTime: s(37065), rotationDirection: 'counterclockwise' },
    { id: 4, name: 'Larissa', rotationTime: s(47520), rotationDirection: 'clockwise' },
  ],
  2: [
    { id: 0, name: 'Phobos', rotationTime: s(27576), rotationDirection: 'counterclockwise' },
    { id: 1, name: 'Deimos', rotationTime: s(109260), rotationDirection: 'clockwise' },
  ],
  3: [
    {
      id: 0,
      name: 'Venus',
      rotationTime: s(360),
      rotationDirection: 'counterclockwise',
      pulsing: true,
      pulseColor: '#d4af37',
    },
  ],
  // Clock 5 — Mercury (template)
  4: [
    {
      id: 0,
      name: 'Mercury',
      rotationTime: s(180),
      rotationDirection: 'clockwise',
      pulsing: true,
      pulseColor: '#c0c0c0',
    },
  ],
  // Clock 6 — Uranus (template)
  5: [
    { id: 0, name: 'Puck', rotationTime: s(65664), rotationDirection: 'clockwise' },
    { id: 1, name: 'Miranda', rotationTime: s(121392), rotationDirection: 'counterclockwise' },
    { id: 2, name: 'Ariel', rotationTime: s(217728), rotationDirection: 'clockwise' },
    { id: 3, name: 'Umbriel', rotationTime: s(357696), rotationDirection: 'counterclockwise' },
    { id: 4, name: 'Titania', rotationTime: s(752198), rotationDirection: 'clockwise' },
    { id: 5, name: 'Oberon', rotationTime: s(1163462), rotationDirection: 'counterclockwise' },
  ],
  6: [
    { id: 0, name: 'Metis', rotationTime: s(25488), rotationDirection: 'clockwise' },
    { id: 1, name: 'Adrastea', rotationTime: s(26093), rotationDirection: 'counterclockwise' },
    { id: 2, name: 'Amalthea', rotationTime: s(42912), rotationDirection: 'clockwise' },
    { id: 3, name: 'Thebe', rotationTime: s(57888), rotationDirection: 'counterclockwise' },
    { id: 4, name: 'Valetudo', rotationTime: s(131760), rotationDirection: 'clockwise' },
    { id: 5, name: 'S/2016 J1', rotationTime: s(142560), rotationDirection: 'counterclockwise' },
    { id: 6, name: 'S/2017 J3', rotationTime: s(155520), rotationDirection: 'clockwise' },
  ],
  7: [
    { id: 0, name: 'Io', rotationTime: s(152851), rotationDirection: 'counterclockwise' },
    { id: 1, name: 'Europa', rotationTime: s(306810), rotationDirection: 'clockwise' },
    { id: 2, name: 'Ganymede', rotationTime: s(618153), rotationDirection: 'counterclockwise' },
    { id: 3, name: 'Callisto', rotationTime: s(1441931), rotationDirection: 'clockwise' },
    { id: 4, name: 'Leda', rotationTime: s(20762000), rotationDirection: 'counterclockwise' },
    { id: 5, name: 'Himalia', rotationTime: s(21648384), rotationDirection: 'clockwise' },
    { id: 6, name: 'Lysithea', rotationTime: s(22377600), rotationDirection: 'counterclockwise' },
  ],
  8: [{ id: 0, name: 'The Moon', rotationTime: s(60), rotationDirection: 'clockwise' }],
};

/** Counts per clock (must match defaultSatelliteConfigs lengths) */
export const clockSatellites: Record<number, number> = {
  0: 8,
  1: 5,
  2: 2,
  3: 1,
  4: 1, // Mercury
  5: 6, // Uranus
  6: 7,
  7: 7,
  8: 1,
};

export function getDefaultSatellitesForClock(clockId: number): SatelliteSettings[] {
  const list = defaultSatelliteConfigs[clockId];
  if (!list?.length) return [];
  return list.map((sat) => ({ ...sat }));
}
