'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClockIcon, Calendar, RotateCw, Timer, Compass, ChevronUp, ChevronDown, Repeat, Eye, EyeOff, Settings, Play, Pause } from 'lucide-react';
import { ClockSettings, SatelliteSettings } from '../types/ClockSettings';
import { clockSatellites, defaultSatelliteConfigs } from '@/lib/satelliteDefaults';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/FirebaseAuthContext'
import { updateSession, updateSessionActivity, pauseSession } from '@/lib/sessions'
import { getSessionLobbySnapshot } from '@/lib/sessionLobbyMeta'
import { toast } from 'react-hot-toast';
import { useLocation } from '@/lib/hooks/useLocation';
import { Timestamp } from 'firebase/firestore';
import { useSoundEffects } from '@/lib/sounds';
import { SatelliteNameLabel } from '@/components/SatelliteNameLabel';
import { CurvedCircleWordLabel } from '@/components/CurvedCircleWordLabel';

export { clockSatellites, defaultSatelliteConfigs };

const dotColors = [
  'bg-[#fd290a]', // 1
  'bg-[#fba63b]', // 2
  'bg-[#f7da5f]', // 3
  'bg-[#6dc037]', // 4
  'bg-[#156fde]', // 5
  'bg-[#941952]', // 6
  'bg-[#541b96]', // 7
  'bg-[#ee5fa7]', // 8
  'bg-[#56c1ff]', // 9
];

// Default test words
const testWords = [
  'Time',
  'Celestial',
  'Astronomy',
  'Precision',
  'Cycles',
  'Observation',
  'Synchronization',
  'Mechanics',
  'Movement',
  'Accuracy',
  'Standards',
  'Measurement'
];

// Function to get the correct image path
const getImagePath = (index: number) => {
  console.log(`Getting image path for index ${index}`);
  const path = `/clock_${index + 1}.svg`;
  console.log(`Returning path: ${path}`);
  return path;
};

interface ClockProps extends Partial<ClockSettings> {
  id: number;
  isMultiView?: boolean;
  isMultiView2?: boolean;
  allClocks?: ClockSettings[];
  showElements: boolean;
  onToggleShow?: () => void;
  currentTime: Date;
  syncTrigger: number;
  imageScale?: number;
  imageX?: number;
  imageY?: number;
  customWords?: string[];
  wordDefinitions?: Record<string, string>;
  hideControls?: boolean;
  showSatellites?: boolean;
  showWords?: boolean;
  showInfo?: boolean;
  onInfoUpdate?: (info: {
    rotation: number;
    rotationsCompleted: number;
    elapsedTime: string;
  }) => void;
  duration?: number | null;
  sessionId?: string | null;
}

// Update the display state type
type DisplayState = 'info';

// Add keyframes for the shadow animation
const shadowKeyframes = {
  "0%": { boxShadow: "0 0 50px rgba(var(--shadow-color), 0)" },
  "25%": { boxShadow: "0 0 100px rgba(var(--shadow-color), 0.15)" },
  "50%": { boxShadow: "0 0 150px rgba(var(--shadow-color), 0.3)" },
  "75%": { boxShadow: "0 0 100px rgba(var(--shadow-color), 0.15)" },
  "100%": { boxShadow: "0 0 50px rgba(var(--shadow-color), 0)" }
};

// Helper function to format time
const formatTime = (ms: number) => {
  if (!ms) return "0:00";
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Helper function to convert hex to RGB
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.replace('bg-[#', '').replace(']', ''));
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

interface ClockRotationParams {
  startDateTime: Date;
  rotationTime: number;
  startingDegree: number;
  rotationDirection: 'clockwise' | 'counterclockwise';
}

// Helper function to calculate clock rotation
const getClockRotation = (params: ClockRotationParams | ClockSettings) => {
  const now = Date.now();
  const elapsedMilliseconds = now - params.startDateTime.getTime();
  const calculatedRotation = (elapsedMilliseconds / params.rotationTime) * 360;
  return params.rotationDirection === 'clockwise'
    ? (params.startingDegree + calculatedRotation) % 360
    : (params.startingDegree - calculatedRotation + 360) % 360;
};

// Helper function to get node radius based on clock ID
const getNodeRadius = (clockId: number, isMultiView: boolean) => {
  if (isMultiView) return 53;
  
  switch (clockId) {
    case 0: return 52; // Clock 1
    case 1: return 54; // Clock 2
    case 2: return 53; // Clock 3
    case 3: return 55; // Clock 4
    case 4: return 54; // Clock 5
    case 5: return 53; // Clock 6
    case 6: return 54; // Clock 7
    case 7: return 55; // Clock 8
    case 8: return 53; // Clock 9
    default: return 55;
  }
};

const getFocusNodeStyle = (
  index: number,
  isMultiView: boolean,
  selectedNodeIndex: number | null,
  clockId: number,
  isSessionActive?: boolean
) => {
  const isSelected = selectedNodeIndex === index;
  const color = dotColors[clockId % dotColors.length].replace('bg-[', '').replace(']', '');

  // Session (assign-words style): nodes always filled; selected shows outline
  if (isSessionActive) {
    return {
      backgroundColor: color,
      border: `2px solid ${color}`,
      width: isMultiView ? '8px' : '12px',
      height: isMultiView ? '8px' : '12px',
      opacity: 1,
      transform: 'translate(-50%, -50%)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: isSelected ? 400 : 200,
      boxShadow: isSelected ? '0 0 0 2px rgba(255,255,255,0.9), 0 0 12px rgba(0,0,0,0.2)' : '0 0 8px rgba(0, 0, 0, 0.2)',
    };
  }

  return {
    backgroundColor: isSelected ? color : 'transparent',
    border: `2px solid ${color}`,
    width: isMultiView ? '8px' : '12px',
    height: isMultiView ? '8px' : '12px',
    opacity: isSelected ? 1 : 0.9,
    transform: 'translate(-50%, -50%)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: isSelected ? 400 : 200,
    boxShadow: isSelected ? `0 0 16px ${color}60` : '0 0 8px rgba(0, 0, 0, 0.2)',
  };
};

const WORD_LABEL_RADIUS_OFFSET = 5;

// Add these new components before the main Clock component
const WordNode = ({ word, angle, nodeRadius, isSelected }: {
  word: string;
  angle: number;
  nodeRadius: number;
  isSelected: boolean;
}) => {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-visible"
      style={{ zIndex: 500 }}
    >
      <CurvedCircleWordLabel
        word={word}
        centerAngleDeg={angle}
        radiusPercent={nodeRadius + WORD_LABEL_RADIUS_OFFSET}
        isSelected={isSelected}
      />
    </div>
  );
};

const Satellite = ({ satellite, index, clockId, x, y, isMultiView }: {
  satellite: SatelliteSettings;
  index: number;
  clockId: number;
  x: number;
  y: number;
  isMultiView: boolean;
}) => {
  const accent = satellite.pulseColor;
  const themeFill = !accent;
  const glow = accent
    ? `0 0 14px ${accent}cc, 0 0 6px ${accent}`
    : isMultiView
      ? 'none'
      : '0 0 12px rgba(0, 0, 0, 0.4)';

  return (
    <motion.div
      key={`satellite-${clockId}-${index}`}
      className="absolute cursor-pointer pointer-events-auto"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: 1 + (index * 0.1),
        duration: 0.5,
        ease: "easeOut"
      }}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 50,
      }}
      whileHover={{ scale: 1.5 }}
    >
      <SatelliteNameLabel name={satellite.name} compact={isMultiView}>
        {satellite.pulsing ? (
          <motion.div
            className={`${isMultiView ? 'w-3 h-3' : 'w-4 h-4'} rounded-full`}
            style={{
              backgroundColor: accent,
              boxShadow: glow,
            }}
            animate={{ opacity: [0.15, 1, 0.35, 1, 0.15], scale: [0.88, 1.08, 0.94, 1.04, 0.88] }}
            transition={{ duration: 1.25, repeat: Infinity, ease: 'easeInOut', times: [0, 0.18, 0.38, 0.62, 1] }}
          />
        ) : (
          <div
            className={`${isMultiView ? 'w-3 h-3' : 'w-4 h-4'} rounded-full ${themeFill ? 'bg-black dark:bg-white' : ''}`}
            style={{
              backgroundColor: accent,
              boxShadow: glow,
            }}
          />
        )}
      </SatelliteNameLabel>
    </motion.div>
  );
};

// User session satellite: one full rotation per session duration, starts at focus node 1, clock color, slightly outside
const UserSatellite = ({ x, y, clockColorHex }: { x: number; y: number; clockColorHex: string }) => {
  return (
    <motion.div
      className="absolute pointer-events-none"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 55,
      }}
    >
      <div
        className="w-4 h-4 rounded-full"
        style={{
          backgroundColor: clockColorHex,
          boxShadow: `0 0 12px ${clockColorHex}99, 0 0 4px ${clockColorHex}`,
        }}
      />
    </motion.div>
  );
};

const FocusNode = ({ 
  index, 
  angle, 
  nodeRadius, 
  isSelected, 
  word, 
  clockId, 
  isMultiView, 
  onClick, 
  selectedNodeIndex,
  isSessionActive = false
}: {
  index: number;
  angle: number;
  nodeRadius: number;
  isSelected: boolean;
  word?: string;
  clockId: number;
  isMultiView: boolean;
  onClick: () => void;
  selectedNodeIndex: number | null;
  isSessionActive?: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const radians = angle * (Math.PI / 180);
  const x = 50 + nodeRadius * Math.cos(radians);
  const y = 50 + nodeRadius * Math.sin(radians);

  const nodeStyle = getFocusNodeStyle(index, isMultiView, selectedNodeIndex, clockId, isSessionActive);
  return (
    <>
      <motion.div
        key={`${clockId}-${index}`}
        className="absolute rounded-full cursor-pointer pointer-events-auto flex items-center justify-center"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          minWidth: 44,
          minHeight: 44,
          transform: 'translate(-50%, -50%)',
          zIndex: nodeStyle.zIndex,
        }}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.1 }}
      >
        <span
          className="rounded-full flex-shrink-0"
          style={{
            ...nodeStyle,
            width: nodeStyle.width,
            height: nodeStyle.height,
            transform: 'none',
          }}
          aria-hidden
        />
      </motion.div>
      {word && (isHovered || isSelected) && (
        <motion.div
          className="pointer-events-none absolute inset-0 overflow-visible"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: isSelected ? 1.08 : 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          style={{ zIndex: 500 }}
        >
          <CurvedCircleWordLabel
            word={word}
            centerAngleDeg={angle}
            radiusPercent={nodeRadius + WORD_LABEL_RADIUS_OFFSET}
            isSelected={isSelected}
          />
        </motion.div>
      )}
    </>
  );
};

const Path = (props: any) => (
  <motion.path
    fill="transparent"
    strokeWidth="2"
    stroke="currentColor"
    className="text-black dark:text-white"
    strokeLinecap="round"
    {...props}
  />
)

export default function Clock({ 
  id, 
  startDateTime = new Date('2024-01-01T00:00:00Z'),
  rotationTime = 60000, 
  imageUrl,  // Remove default value since we'll use getImagePath
  startingDegree = 0, 
  focusNodes = 0, 
  rotationDirection = 'clockwise', 
  imageOrientation = 0,
  imageScale = 1,
  imageX = 0,
  imageY = 0,
  isMultiView = false,
  isMultiView2 = false,
  allClocks = [], 
  showElements, 
  currentTime, 
  syncTrigger, 
  onToggleShow, 
  hideControls = false,
  showSatellites = true,
  showWords = true,
  showInfo = true,
  customWords = [],
  wordDefinitions = {},
  onInfoUpdate,
  duration,
  sessionId
}: ClockProps) {
  if (!(startDateTime instanceof Date) || isNaN(startDateTime.getTime())) {
    console.error(`Invalid startDateTime for clock ${id}:`, startDateTime);
    startDateTime = new Date('2024-01-01T00:00:00Z');
  }
  
  const [rotation, setRotation] = useState(startingDegree);
  const [elapsedTime, setElapsedTime] = useState('0d 0h 0m 0s');
  const [rotationsCompleted, setRotationsCompleted] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [imageError, setImageError] = useState(false);
  const animationRef = useRef<number>();
  const lastRotation = useRef(rotation);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showInfoCards, setShowInfoCards] = useState(true);
  const [infoCardsHiddenByNode, setInfoCardsHiddenByNode] = useState(false);
  const [displayState, setDisplayState] = useState<DisplayState>('info');
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [pausedTimeRemaining, setPausedTimeRemaining] = useState<number | null>(null);
  const [initialDuration, setInitialDuration] = useState<number | null>(null);
  const [sessionElapsedForSatellite, setSessionElapsedForSatellite] = useState<number>(0);
  const { user, profile } = useAuth()
  const { location } = useLocation();

  // Add new state for auto-save
  const [lastAutoSave, setLastAutoSave] = useState<number>(Date.now());

  const { playClick } = useSoundEffects();

  const handleSessionComplete = async () => {
    if (!sessionId || !user?.uid) return;
    try {
      const lobby = await getSessionLobbySnapshot(user.uid);
      await updateSession(sessionId, {
        status: 'completed',
        progress: 100,
        end_time: new Date().toISOString(),
        actual_duration: initialDuration || 0,
        last_active_time: new Date().toISOString(),
        ...lobby,
      });
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  // Initialize session
  useEffect(() => {
    if (duration) {
      const durationMs = parseInt(duration.toString());
      if (!isNaN(durationMs)) {
        const now = Date.now();
        setInitialDuration(durationMs);
        setRemainingTime(durationMs);
        setSessionStartTime(now);
        setIsPaused(false);
        setLastAutoSave(now);
        playClick(); // Play click sound when session starts

        // If this is a continued session, check for pending state
        if (sessionId) {
          const savedSession = localStorage.getItem('pendingSession');
          if (savedSession) {
            try {
              const { sessionId: savedId, remaining, timestamp } = JSON.parse(savedSession);
              if (savedId === sessionId && Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                setRemainingTime(remaining);
                setPausedTimeRemaining(remaining);
                setIsPaused(true);
              } else {
                localStorage.removeItem('pendingSession');
              }
            } catch (error) {
              console.error('Error recovering session:', error);
              localStorage.removeItem('pendingSession');
            }
          }
        }
      }
    }
  }, [duration, sessionId, playClick]);

  // Timer effect with auto-save — start counting down as soon as session begins
  useEffect(() => {
    if (!initialDuration || isPaused || !sessionStartTime) return;
    // lastAutoSave is in deps: when it updates after the session has ended, do not restart the interval
    // (would re-fire handleSessionComplete and fight the UI).
    const remainingNow = initialDuration - (Date.now() - sessionStartTime);
    if (remainingNow <= 0) return;

    const tick = () => {
      const elapsed = Date.now() - sessionStartTime;
      const remaining = initialDuration - elapsed;
      setRemainingTime(remaining);

      // Auto-save every minute to localStorage and Firestore (so dashboard shows correct "X left")
      if (Date.now() - lastAutoSave >= 60000) {
        setLastAutoSave(Date.now());
        if (sessionId) {
          localStorage.setItem('pendingSession', JSON.stringify({
            sessionId,
            remaining,
            timestamp: Date.now()
          }));
          const timeSpent = Math.max(0, initialDuration - remaining);
          updateSession(sessionId, {
            status: 'in_progress',
            actual_duration: timeSpent,
            last_active_time: new Date().toISOString(),
            progress: Math.round((timeSpent / initialDuration) * 100)
          }).catch((err) => console.error('Error auto-saving session progress:', err));
        }
      }

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        handleSessionComplete();
      }
    };

    tick(); // Run immediately when session begins so countdown starts right away
    timerRef.current = setInterval(tick, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [initialDuration, isPaused, sessionStartTime, lastAutoSave, sessionId, handleSessionComplete]);

  // Enhanced handlePauseResume with better state persistence
  const handlePauseResume = async () => {
    if (!sessionId) return;
    playClick();

    try {
      const now = Date.now();
      if (isPaused) {
        // Resuming - adjust start time to account for paused duration
        const elapsedBeforePause = initialDuration! - (pausedTimeRemaining || 0);
        const newStartTime = now - elapsedBeforePause;
        
        await updateSession(sessionId, {
          status: 'in_progress',
          last_active_time: new Date(now).toISOString(),
          actual_duration: elapsedBeforePause,
          progress: Math.round((elapsedBeforePause / initialDuration!) * 100)
        });
        
        setSessionStartTime(newStartTime);
        setIsPaused(false);
        setLastAutoSave(now);
      } else {
        // Pausing - save current state (actual_duration = time spent so far)
        const elapsed = now - (sessionStartTime || now);
        const remaining = Math.max(0, initialDuration! - elapsed);

        await updateSession(sessionId, {
          status: 'in_progress',
          actual_duration: elapsed,
          last_active_time: new Date(now).toISOString(),
          progress: Math.round((elapsed / initialDuration!) * 100)
        });

        setIsPaused(true);
        setPausedTimeRemaining(remaining);
      }
    } catch (error) {
      console.error('Error updating session pause state:', error);
      toast.error('Failed to update session state');
    }
  };

  // Simplified handleReset
  const handleReset = async () => {
    if (!initialDuration || !sessionId || !user?.uid) return;

    try {
      const now = Date.now();
      const lobby = await getSessionLobbySnapshot(user.uid);
      await updateSession(sessionId, {
        status: 'aborted',
        end_time: new Date(now).toISOString(),
        actual_duration: initialDuration - (remainingTime || 0),
        last_active_time: new Date(now).toISOString(),
        ...lobby,
      });

      setRemainingTime(initialDuration);
      setSessionStartTime(now);
      setIsPaused(false);
      setLastAutoSave(now);
    } catch (error) {
      console.error('Error aborting session:', error);
      toast.error('Failed to abort session');
    }
  };

  // Update activity periodically while session is active
  useEffect(() => {
    if (!sessionId || isPaused || !remainingTime || remainingTime <= 0) return;

    const activityInterval = setInterval(async () => {
      try {
        await updateSessionActivity(sessionId);
      } catch (error) {
        console.error('Error updating session activity:', error);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(activityInterval);
  }, [sessionId, isPaused, remainingTime]);

  // Save session progress to Firestore (time left, so dashboard shows correct "X left")
  const saveSessionProgress = useCallback(async () => {
    if (!sessionId || remainingTime == null || !initialDuration) return;
    const timeSpent = Math.max(0, initialDuration - remainingTime);
    try {
      await updateSession(sessionId, {
        status: 'in_progress',
        actual_duration: timeSpent,
        last_active_time: new Date().toISOString(),
        progress: Math.round((timeSpent / initialDuration) * 100)
      });
    } catch (error) {
      console.error('Error saving session progress:', error);
    }
  }, [sessionId, remainingTime, initialDuration]);

  // Enhanced page visibility handler — save progress when user leaves tab
  useEffect(() => {
    if (!sessionId) return;

    const handleVisibilityChange = async () => {
      if (document.hidden && !isPaused && remainingTime != null && initialDuration) {
        try {
          await saveSessionProgress();
          setIsPaused(true);
          setPausedTimeRemaining(remainingTime);
          localStorage.setItem('pendingSession', JSON.stringify({
            sessionId,
            remaining: remainingTime,
            original: initialDuration,
            timestamp: Date.now()
          }));
        } catch (error) {
          console.error('Error handling visibility change:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sessionId, isPaused, remainingTime, initialDuration, saveSessionProgress]);

  // Save progress when user closes tab or navigates away
  useEffect(() => {
    if (!sessionId) return;

    const handlePageHide = () => {
      if (!isPaused && remainingTime != null && initialDuration) {
        saveSessionProgress();
        localStorage.setItem('pendingSession', JSON.stringify({
          sessionId,
          remaining: remainingTime,
          original: initialDuration,
          timestamp: Date.now()
        }));
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, [sessionId, isPaused, remainingTime, initialDuration, saveSessionProgress]);

  // Add session recovery on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('pendingSession');
    if (savedSession) {
      try {
        const { sessionId: savedId, remaining, timestamp } = JSON.parse(savedSession);
        
        // Only recover if session is less than 24h old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setRemainingTime(remaining);
          setPausedTimeRemaining(remaining);
          setIsPaused(true);
        } else {
          localStorage.removeItem('pendingSession');
        }
      } catch (error) {
        console.error('Error recovering session:', error);
        localStorage.removeItem('pendingSession');
      }
    }
  }, []);

  // Handle image error
  const handleImageError = () => {
    console.error(`Failed to load image for clock ${id}`);
    setImageError(true);
  };

  // Reset sync state when clock changes
  useEffect(() => {
    setIsTransitioning(true);
    
    // Calculate the target rotation based on current time
    const now = Date.now();
    const elapsedMilliseconds = now - startDateTime.getTime();
    const calculatedRotation = (elapsedMilliseconds / rotationTime) * 360;
    const targetRotation = rotationDirection === 'clockwise'
      ? (startingDegree + calculatedRotation) % 360
      : (startingDegree - calculatedRotation + 360) % 360;

    // Add slight overshoot to the initial rotation
    const overshootAmount = rotationDirection === 'clockwise' ? 5 : -5;
    setRotation(targetRotation + overshootAmount);
    
    // Then gradually ease to the actual target
    const snapTimer = setTimeout(() => {
      setRotation(targetRotation);
    }, 1200); // Increased delay before snap

    const transitionTimer = setTimeout(() => {
      setIsTransitioning(false);
    }, 2000); // Increased total transition time

    return () => {
      clearTimeout(transitionTimer);
      clearTimeout(snapTimer);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [syncTrigger, startDateTime, startingDegree, rotationTime, rotationDirection]);

  // Smooth animation loop using requestAnimationFrame
  useEffect(() => {
    if (isTransitioning) return; // Don't update rotation during transition

    const animate = () => {
      const now = Date.now();
      const elapsedMilliseconds = now - startDateTime.getTime();
      const calculatedRotation = (elapsedMilliseconds / rotationTime) * 360;
      const newRotation = rotationDirection === 'clockwise'
        ? (startingDegree + calculatedRotation) % 360
        : (startingDegree - calculatedRotation + 360) % 360;

      if (Math.abs(newRotation - lastRotation.current) > 180) {
        // Handle rotation wrap-around smoothly
        lastRotation.current = newRotation;
      }

      setRotation(newRotation);
      lastRotation.current = newRotation;

      // Update other states less frequently
      if (now % 1000 < 17) {
        setElapsedTime(getElapsedTime(new Date(now), startDateTime));
        setRotationsCompleted(Math.floor(Math.abs(calculatedRotation) / 360));
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [startDateTime, rotationTime, startingDegree, rotationDirection, isTransitioning]);

  const [hoveredNodeIndex, setHoveredNodeIndex] = useState<number | null>(null);

  const handleNodeClick = (index: number) => {
    if (selectedNodeIndex === index) {
      setSelectedNodeIndex(null);
      setInfoCardsHiddenByNode(false);
    } else {
      setSelectedNodeIndex(index);
      setInfoCardsHiddenByNode(true);
      setShowInfoCards(false);
    }
    setHoveredNodeIndex(null); // Reset hover state on click
  };

  // Assign-words order: node 1 at 12 o'clock, then clockwise (matches SessionDurationDialog layout)
  const SESSION_WORDS_START_DEGREE = 270;

  const renderFocusNodes = (clockRotation: number, clockFocusNodes: number, clockStartingDegree: number, clockId: number, isSessionActive = false) => {
    // When in session, use Assign-words order (1 at 12 o'clock, clockwise); otherwise use clock-specific alignment
    const adjustedStartingDegree = (() => {
      if (isSessionActive && customWords.length > 0) return SESSION_WORDS_START_DEGREE;
      switch (clockId) {
        case 0: return clockStartingDegree + 45; // Clock 1 (/0)
        case 1: return clockStartingDegree + 45; // Clock 2 (/1)
        case 2: return clockStartingDegree + 9;  // Clock 3 (/2)
        case 3: return clockStartingDegree + 180; // Clock 4
        case 4: return clockStartingDegree + 11; // Clock 5 (/4)
        default: return clockStartingDegree;
      }
    })();

    const wordsToUse = customWords.length > 0 ? customWords : testWords;

    return (
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: Math.max(0, clockFocusNodes || 0) }).map((_, index) => {
          const angle = ((360 / Math.max(1, clockFocusNodes || 1)) * index + adjustedStartingDegree) % 360;
          const word = wordsToUse[index % wordsToUse.length];
          return (
            <FocusNode
              key={`${clockId}-${index}`}
              index={index}
              angle={angle}
              nodeRadius={getNodeRadius(clockId, isMultiView)}
              isSelected={selectedNodeIndex === index}
              word={showWords ? word : undefined}
              clockId={clockId}
              isMultiView={isMultiView}
              onClick={() => handleNodeClick(index)}
              selectedNodeIndex={selectedNodeIndex}
              isSessionActive={isSessionActive}
            />
          );
        })}
      </div>
    );
  };

  const renderWordDisplay = () => {
    if (!showWords || !customWords || customWords.length === 0) return null;

    const clockRotation = getClockRotation({
      startDateTime,
      rotationTime,
      startingDegree,
      rotationDirection
    });
    const nodeRadius = getNodeRadius(id, isMultiView);
    const wordsPerNode = Math.ceil(customWords.length / focusNodes);
    // Session: use Assign-words order (1 at 12 o'clock, clockwise); otherwise use clock startingDegree
    const wordsStartingDegree = duration != null ? SESSION_WORDS_START_DEGREE : startingDegree;

    return (
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: focusNodes }).map((_, nodeIndex) => {
          const nodeAngle = (nodeIndex * (360 / focusNodes) + wordsStartingDegree) % 360;
          const words = customWords.slice(nodeIndex * wordsPerNode, (nodeIndex + 1) * wordsPerNode);
          
          return words.map((word, wordIndex) => {
            const wordAngle = nodeAngle + (wordIndex * (360 / focusNodes / wordsPerNode));
            return (
              <WordNode
                key={`${nodeIndex}-${wordIndex}`}
                word={word}
                angle={wordAngle}
                nodeRadius={nodeRadius}
                isSelected={false}
              />
            );
          });
        })}
      </div>
    );
  };

  const getTransitionConfig = () => ({
    type: isTransitioning ? 'spring' : 'tween',
    duration: isTransitioning ? 2 : 0.016, // Increased duration
    ease: isTransitioning ? [0.16, 1, 0.3, 1] : 'linear', // Modified bezier curve for smoother stopping
    stiffness: isTransitioning ? 50 : undefined, // Reduced stiffness for smoother motion
    damping: isTransitioning ? 20 : undefined, // Adjusted damping for smoother settling
    mass: isTransitioning ? 1.5 : undefined, // Increased mass for more inertia
    restSpeed: isTransitioning ? 0.1 : undefined, // Reduced rest speed for smoother settling
    restDelta: isTransitioning ? 0.1 : undefined // Reduced rest delta for smoother settling
  });

  const renderClockFace = (clock: ClockSettings, index: number) => {
    const now = Date.now();
    const elapsedMilliseconds = now - clock.startDateTime.getTime();
    const calculatedRotation = (elapsedMilliseconds / clock.rotationTime) * 360;
    const clockRotation = clock.rotationDirection === 'clockwise'
      ? (clock.startingDegree + calculatedRotation) % 360
      : (clock.startingDegree - calculatedRotation + 360) % 360;

    const transitionConfig = getTransitionConfig();

    return (
      <div key={clock.id} className="absolute inset-0" style={{ mixBlendMode: 'multiply' }}>
        <div className="absolute inset-[2%] rounded-full overflow-hidden">
          <motion.div 
            className="absolute inset-0"
            style={{ 
              willChange: 'transform',
            }}
            animate={{ rotate: clockRotation }}
            transition={transitionConfig}
          >
            <div
              className="absolute inset-0"
              style={{
                transform: `translate(${clock.imageX || 0}%, ${clock.imageY || 0}%) rotate(${clock.imageOrientation}deg) scale(${clock.imageScale})`,
                willChange: 'transform',
                transformOrigin: 'center',
              }}
            >
              <Image 
                src={clock.imageUrl}
                alt={`Clock Face ${index + 1}`}
                layout="fill"
                objectFit="cover"
                className="rounded-full [&_*]:fill-current [&_*]:stroke-none"
                priority
                loading="eager"
              />
            </div>
            {/* Render focus nodes directly in the rotating container */}
            {renderFocusNodes(clockRotation, clock.focusNodes, clock.startingDegree, clock.id)}
          </motion.div>
        </div>
      </div>
    );
  };

  // User satellite: one full rotation in initialDuration, starts at focus node 1 (270°), radius a bit outside
  const USER_SATELLITE_RADIUS = 48; // slightly outside normal satellites (43)
  const FOCUS_NODE_1_ANGLE = 270;   // session layout: focus node 1 at 12 o'clock

  // Smooth position updates for user satellite (every 100ms when session active)
  useEffect(() => {
    if (duration == null || initialDuration == null || sessionStartTime == null) return;
    setSessionElapsedForSatellite(0);
    const interval = setInterval(() => {
      if (isPaused && remainingTime != null) {
        setSessionElapsedForSatellite(Math.max(0, initialDuration - remainingTime));
      } else {
        const elapsed = Math.min(Date.now() - sessionStartTime, initialDuration);
        setSessionElapsedForSatellite(elapsed);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [duration, initialDuration, sessionStartTime, isPaused, remainingTime]);

  const getUserSatellitePosition = (): { x: number; y: number } | null => {
    if (duration == null || initialDuration == null || initialDuration <= 0) return null;
    const elapsed = sessionElapsedForSatellite;
    const angleDeg = (FOCUS_NODE_1_ANGLE + (elapsed / initialDuration) * 360) % 360;
    const radians = (angleDeg * Math.PI) / 180;
    const x = 50 + USER_SATELLITE_RADIUS * Math.cos(radians);
    const y = 50 + USER_SATELLITE_RADIUS * Math.sin(radians);
    return { x, y };
  };

  // Update renderSatellites function
  const renderSatellites = (clockRotation: number, clockId: number) => {
    const clockSatelliteSettings = allClocks?.find(c => c.id === clockId)?.satellites || 
      defaultSatelliteConfigs[clockId] || 
      Array.from({ length: clockSatellites[clockId] || 0 }).map((_, index) => ({
        rotationTime: 60000, // fallback default 60 seconds
        rotationDirection: 'clockwise' as const,
      }));
    
    const satelliteCount = clockSatelliteSettings.length;
    return clockSatelliteSettings.map((satellite, index) => {
      // Calculate base position
      const angle = ((360 / Math.max(1, satelliteCount)) * index) % 360;
      const radians = angle * (Math.PI / 180);
      
      // Different radius for multiview vs single clock view
      const radius = isMultiView 
        ? 57 // Increased from 55 to 57 for multiview
        : 43; // Single view radius unchanged
      
      // Calculate satellite rotation
      const now = Date.now();
      const elapsedMilliseconds = now - startDateTime.getTime();
      const satelliteRotation = (elapsedMilliseconds / satellite.rotationTime) * 360;
      const totalRotation = satellite.rotationDirection === 'clockwise'
        ? satelliteRotation
        : -satelliteRotation;

      // Apply both base position and rotation
      const rotatedRadians = (angle + totalRotation) * (Math.PI / 180);
      const x = 50 + radius * Math.cos(rotatedRadians);
      const y = 50 + radius * Math.sin(rotatedRadians);
      
      return (
        <Satellite
          key={`satellite-${clockId}-${index}`}
          satellite={satellite}
          index={index}
          clockId={clockId}
          x={x}
          y={y}
          isMultiView={isMultiView}
        />
      );
    });
  };

  // Update renderSingleClock to make background transparent
  const renderSingleClock = () => {
    const wheelOverlayMedia = !isMultiView && !isMultiView2
      ? profile?.wheelFaceOverlays?.[id]
      : undefined
    const wheelOverlayUrl = wheelOverlayMedia?.type === 'image' && wheelOverlayMedia.url?.trim()
      ? wheelOverlayMedia.url.trim()
      : undefined
    const wheelVideoUrl = wheelOverlayMedia?.type === 'video' && wheelOverlayMedia.url?.trim()
      ? wheelOverlayMedia.url.trim()
      : undefined
    const transitionConfig = getTransitionConfig();
    const clockColor = id === 9 ? null : hexToRgb(dotColors[id].replace('bg-[', '').replace(']', ''));
    const shadowStyle = clockColor ? {
      '--shadow-color': `${clockColor.r}, ${clockColor.g}, ${clockColor.b}`,
    } as React.CSSProperties : {};

    return (
      <div className="relative w-[82vw] h-[82vw] max-w-[615px] max-h-[615px]">
        {/* Glow effect */}
        {id !== 9 && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={shadowStyle}
            animate={{
              boxShadow: [
                "0 0 50px rgba(var(--shadow-color), 0)",
                "0 0 100px rgba(var(--shadow-color), 0.15)",
                "0 0 150px rgba(var(--shadow-color), 0.3)",
                "0 0 100px rgba(var(--shadow-color), 0.15)",
                "0 0 50px rgba(var(--shadow-color), 0)"
              ]
            }}
            transition={{
              duration: 60,
              ease: [0.4, 0, 0.6, 1],
              repeat: Infinity,
              times: [0, 0.25, 0.5, 0.75, 1]
            }}
          />
        )}

        {/* Satellites layer */}
        {showSatellites && (
          <div className="absolute inset-[-20%] pointer-events-none" style={{ zIndex: 50 }}>
            {renderSatellites(rotation, id)}
            {/* User session satellite: rotates once per session duration, starts at focus node 1, clock color */}
            {duration != null && (() => {
              const pos = getUserSatellitePosition();
              if (!pos) return null;
              const clockColorHex = dotColors[id % dotColors.length].replace('bg-[', '').replace(']', '');
              return <UserSatellite key="user-satellite" x={pos.x} y={pos.y} clockColorHex={clockColorHex} />;
            })()}
          </div>
        )}

        {/* Clock face */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <motion.div 
            className="absolute inset-0"
            style={{ 
              willChange: 'transform',
              zIndex: 100,
            }}
            animate={{ rotate: rotation }}
            transition={transitionConfig}
          >
            <div
              className="absolute inset-0"
              style={{
                transform: `translate(${imageX || 0}%, ${imageY || 0}%) rotate(${imageOrientation}deg) scale(${imageScale})`,
                willChange: 'transform',
                transformOrigin: 'center',
              }}
            >
              <Image 
                src={getImagePath(id)}
                alt={`Clock Face ${id}`}
                layout="fill"
                objectFit="cover"
                className="rounded-full dark:invert [&_*]:fill-current [&_*]:stroke-none"
                priority
                loading="eager"
              />
              {wheelOverlayUrl ? (
                <img
                  src={wheelOverlayUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full rounded-full object-cover dark:invert pointer-events-none z-[1]"
                />
              ) : null}
            </div>
          </motion.div>
          {/* Static video overlay — outside rotation so content does not spin */}
          {wheelVideoUrl ? (
            <video
              src={wheelVideoUrl}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover pointer-events-none"
              style={{ zIndex: 150 }}
            />
          ) : null}
        </div>

        {/* Focus nodes layer — above other layers so every node is clickable */}
        <motion.div 
          className="absolute inset-0"
          style={{ 
            willChange: 'transform',
            zIndex: 400,
            pointerEvents: 'none',
          }}
          animate={{ rotate: rotation }}
          transition={transitionConfig}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ transform: `rotate(${imageOrientation}deg)` }}>
            {renderFocusNodes(rotation, focusNodes, startingDegree, id, duration != null)}
          </div>
        </motion.div>
      </div>
    );
  };

  // Update other states less frequently
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMilliseconds = now - startDateTime.getTime();
      const calculatedRotation = (elapsedMilliseconds / rotationTime) * 360;
      const currentRotation = rotationDirection === 'clockwise'
        ? (startingDegree + calculatedRotation) % 360
        : (startingDegree - calculatedRotation + 360) % 360;
      const rotationsCount = Math.floor(Math.abs(calculatedRotation) / 360);
      const timeElapsed = getElapsedTime(new Date(now), startDateTime);

      onInfoUpdate?.({
        rotation: currentRotation,
        rotationsCompleted: rotationsCount,
        elapsedTime: timeElapsed,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [startDateTime, rotationTime, startingDegree, rotationDirection, onInfoUpdate]);

  if (isMultiView || isMultiView2) {
    return (
      <motion.div 
        className="relative w-[75vw] h-[75vw] max-w-[550px] max-h-[550px]"
        initial={{ scale: isMultiView2 ? 1.25 : 1 }}
        animate={{ scale: isMultiView2 ? 0.75 : 1 }}
        transition={{
          duration: 0.8,
          ease: [0.4, 0, 0.2, 1]
        }}
      >
        {/* Satellite grid pattern - only shown in multiview2 (30% less visible) */}
        {isMultiView2 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.14 }}
            transition={{ duration: 1 }}
            className="absolute inset-[-12%] rounded-full overflow-hidden"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src="/satellite-grid.jpg"
                alt="Satellite Grid Pattern"
                layout="fill"
                objectFit="cover"
                className="opacity-[0.14] dark:invert"
                priority
              />
            </div>
          </motion.div>
        )}

        {/* Clock faces layer */}
        <div className="absolute inset-[5%] rounded-full">
          <div className="absolute inset-0 dark:invert" style={{ zIndex: 1 }}>
            {allClocks?.map((clock, index) => {
              const clockRotation = getClockRotation(clock);

              return (
                <div key={clock.id} className="absolute inset-0" style={{ mixBlendMode: 'multiply' }}>
                  <div className="absolute inset-[2%] rounded-full overflow-hidden">
                    <motion.div 
                      className="absolute inset-0"
                      style={{ 
                        willChange: 'transform',
                      }}
                      animate={{ rotate: clockRotation }}
                      transition={getTransitionConfig()}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          transform: `translate(${clock.imageX || 0}%, ${clock.imageY || 0}%) rotate(${clock.imageOrientation}deg) scale(${clock.imageScale})`,
                          transformOrigin: 'center',
                        }}
                      >
                        <Image 
                          src={clock.imageUrl}
                          alt={`Clock Face ${index + 1}`}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-full [&_*]:fill-current [&_*]:stroke-none"
                          priority
                          loading="eager"
                        />
                      </div>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Individual clocks in multiview2 */}
        {isMultiView2 && (
          <>
            {/* Center layered clocks */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] aspect-square" style={{ zIndex: 40 }}>
              <div className="relative w-full h-full">
                {allClocks?.map((clock, index) => {
                  const clockRotation = getClockRotation(clock);
                  return (
                    <div key={`center-clock-${clock.id}`} className="absolute inset-0" style={{ mixBlendMode: 'multiply' }}>
                      <div className="absolute inset-0 rounded-full overflow-hidden">
                        <motion.div 
                          className="absolute inset-0"
                          style={{ 
                            willChange: 'transform',
                          }}
                          animate={{ rotate: clockRotation }}
                          transition={getTransitionConfig()}
                        >
                          <div
                            className="absolute inset-0"
                            style={{
                              transform: `translate(${clock.imageX || 0}%, ${clock.imageY || 0}%) rotate(${clock.imageOrientation}deg) scale(${clock.imageScale})`,
                              transformOrigin: 'center',
                            }}
                          >
                            <Image 
                              src={clock.imageUrl}
                              alt={`Clock Face ${index + 1}`}
                              layout="fill"
                              objectFit="cover"
                              className="rounded-full [&_*]:fill-current [&_*]:stroke-none"
                              priority
                              loading="eager"
                            />
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Outer ring clocks */}
            {allClocks?.map((clock, index) => {
              // Skip the 9th clock as it's part of the center stack
              if (index >= 8) return null;

              // Swap position of mini clock 6 (index 5) and mini clock 0 (index 0)
              const positionIndex = index === 0 ? 5 : index === 5 ? 0 : index;
              // Calculate position for each outer clock
              const angle = (360 / 8) * positionIndex;
              const radius = 35; // Distance from center
              const radians = (angle * Math.PI) / 180;
              const x = 50 + radius * Math.cos(radians);
              const y = 50 + radius * Math.sin(radians);

              const clockRotation = getClockRotation(clock);

              return (
                <motion.div
                  key={`outer-clock-${clock.id}`}
                  className="absolute aspect-square hover:scale-110 transition-transform duration-200 group"
                  style={{
                    width: '22%',
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 30,
                  }}
                >
                  <div className="relative w-full h-full">
                    {/* Tooltip */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-black dark:text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                      {clockRotation.toFixed(1)}°
                    </div>
                    <motion.div
                      className="absolute inset-0 rounded-full overflow-hidden"
                      animate={{ rotate: clockRotation }}
                      transition={getTransitionConfig()}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          transform: `translate(${clock.imageX || 0}%, ${clock.imageY || 0}%) rotate(${clock.imageOrientation}deg) scale(${clock.imageScale})`,
                          transformOrigin: 'center',
                          mixBlendMode: 'multiply',
                        }}
                      >
                        <Image 
                          src={clock.imageUrl}
                          alt={`Clock Face ${index + 1}`}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-full [&_*]:fill-current [&_*]:stroke-none"
                          priority
                          loading="eager"
                        />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </>
        )}

        {!hideControls && (
          <>
            <div 
              onClick={onToggleShow} 
              className="fixed bottom-4 right-4 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors z-10"
            >
              {showElements ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </div>
          </>
        )}
        {/* Glow effects for multiview1 */}
        {!isMultiView2 && (
          <motion.div
            className="absolute inset-[5%] rounded-full block dark:hidden"
            animate={{
              boxShadow: [
                "0 0 50px rgba(0, 0, 0, 0)",
                "0 0 100px rgba(0, 0, 0, 0.15)",
                "0 0 150px rgba(0, 0, 0, 0.3)",
                "0 0 100px rgba(0, 0, 0, 0.15)",
                "0 0 50px rgba(0, 0, 0, 0)"
              ]
            }}
            transition={{
              duration: 60,
              ease: [0.4, 0, 0.6, 1],
              repeat: Infinity,
              times: [0, 0.25, 0.5, 0.75, 1]
            }}
          />
        )}
        {!isMultiView2 && (
          <motion.div
            className="absolute inset-[5%] rounded-full hidden dark:block"
            animate={{
              boxShadow: [
                "0 0 50px rgba(255, 255, 255, 0)",
                "0 0 100px rgba(255, 255, 255, 0.15)",
                "0 0 150px rgba(255, 255, 255, 0.3)",
                "0 0 100px rgba(255, 255, 255, 0.15)",
                "0 0 50px rgba(255, 255, 255, 0)"
              ]
            }}
            transition={{
              duration: 60,
              ease: [0.4, 0, 0.6, 1],
              repeat: Infinity,
              times: [0, 0.25, 0.5, 0.75, 1]
            }}
          />
        )}
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col justify-between min-h-screen w-full dark:bg-black">
      <div className="flex-grow flex items-center justify-center">
        {renderSingleClock()}
      </div>

      <div className="w-full max-w-[1000px] mx-auto mb-2 px-3 relative">
        {showElements && (
          <div className="flex justify-center gap-2 mb-2">
            <motion.button
              onClick={() => {
                if (!infoCardsHiddenByNode) {
                  setShowInfoCards(prev => !prev);
                }
              }}
              className="w-20 h-1 rounded-full bg-gray-200 dark:bg-gray-700 shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 ease-out"
              whileHover={{ scaleX: 1.2 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function getElapsedTime(currentDate: Date, startDateTime: Date): string {
  const elapsed = currentDate.getTime() - startDateTime.getTime();
  const years = Math.floor(elapsed / (365 * 24 * 60 * 60 * 1000));
  const remainingDays = Math.floor((elapsed % (365 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
  const hours = Math.floor((elapsed % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((elapsed % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((elapsed % (60 * 1000)) / 1000);
  return `${years}y ${remainingDays}d ${hours}h ${minutes}m ${seconds}s`;
}

