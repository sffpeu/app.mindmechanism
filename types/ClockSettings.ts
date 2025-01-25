export interface SatelliteSettings {
  id: number;
  rotationTime: number; // in milliseconds
  rotationDirection: 'clockwise' | 'counterclockwise';
}

export interface ClockSettings {
  id: number;
  startDateTime: Date;
  rotationTime: number;
  imageUrl: string;
  startingDegree: number;
  focusNodes: number;
  rotationDirection: 'clockwise' | 'counterclockwise';
  imageOrientation: number;
  imageScale: number;
  imageX?: number;
  imageY?: number;
  satellites?: SatelliteSettings[];
}

export interface ClockProps extends Omit<ClockSettings, 'id'> {
  id: number;
  isMultiView?: boolean;
  isMultiView2?: boolean;
  allClocks?: ClockSettings[];
  showElements: boolean;
  onToggleShow?: () => void;
  currentTime: Date;
  syncTrigger: number;
  hideControls?: boolean;
  showSatellites?: boolean;
  showInfo?: boolean;
}

