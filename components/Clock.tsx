'use client'

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClockIcon, Calendar, RotateCw, Timer, Compass, ChevronUp, ChevronDown, Repeat, Eye, EyeOff, Settings, Play, Pause } from 'lucide-react';
import { ClockSettings } from '../types/ClockSettings';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/FirebaseAuthContext'
import { updateSession, updateSessionActivity, pauseSession } from '@/lib/sessions'
import { toast } from 'react-hot-toast';
import { useLocation } from '@/lib/hooks/useLocation';
import { Timestamp } from 'firebase/firestore';
import { useSoundEffects } from '@/lib/sounds';

const dotColors = [
  'bg-[#fd290a]', // 1. Red
  'bg-[#fba63b]', // 2. Orange
  'bg-[#f7da5f]', // 3. Yellow
  'bg-[#6dc037]', // 4. Green
  'bg-[#156fde]', // 5. Blue
  'bg-[#941952]', // 6. Dark Pink
  'bg-[#541b96]', // 7. Purple
  'bg-[#ee5fa7]', // 8. Pink
  'bg-[#56c1ff]', // 9. Light Blue
];

// Update satellites count for each clock
export const clockSatellites: Record<number, number> = {
  0: 8, // Clock 1
  1: 2, // Clock 2
  2: 2, // Clock 3
  3: 0, // Clock 4
  4: 5, // Clock 5
  5: 0, // Clock 6
  6: 5, // Clock 7
  7: 5, // Clock 8
  8: 1, // Clock 9
};

// Default satellite configurations
export const defaultSatelliteConfigs: Record<number, Array<{ rotationTime: number, rotationDirection: 'clockwise' | 'counterclockwise' }>> = {
  0: [ // Clock 1
    { rotationTime: 300 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 600 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 900 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 2700 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 5400 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 5400 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'counterclockwise' }
  ],
  1: [ // Clock 2
    { rotationTime: 1800 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 3600 * 1000, rotationDirection: 'counterclockwise' }
  ],
  2: [ // Clock 3
    { rotationTime: 600 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'clockwise' }
  ],
  3: [ // Clock 4
    { rotationTime: 60 * 1000, rotationDirection: 'clockwise' }
  ],
  4: [ // Clock 5
    { rotationTime: 720 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 1140 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 1710 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 1710 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 900 * 1000, rotationDirection: 'clockwise' }
  ],
  5: [ // Clock 6
    { rotationTime: 60 * 1000, rotationDirection: 'clockwise' }
  ],
  6: [ // Clock 7
    { rotationTime: 900 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 900 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 900 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 700 * 1000, rotationDirection: 'clockwise' }
  ],
  7: [ // Clock 8
    { rotationTime: 1800 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'clockwise' }
  ]
};

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
  hideControls?: boolean;
  showSatellites?: boolean;
  showInfo?: boolean;
  onInfoUpdate?: (info: {
    rotation: number;
    rotationsCompleted: number;
    elapsedTime: string;
  }) => void;
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

// Helper function to calculate clock rotation
const getClockRotation = (clock: ClockSettings) => {
  const now = Date.now();
  const elapsedMilliseconds = now - clock.startDateTime.getTime();
  const calculatedRotation = (elapsedMilliseconds / clock.rotationTime) * 360;
  return clock.rotationDirection === 'clockwise'
    ? (clock.startingDegree + calculatedRotation) % 360
    : (clock.startingDegree - calculatedRotation + 360) % 360;
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

// Helper function to get label distance based on word length
const getLabelDistance = (word: string) => {
  if (!word) return 4;
  if (word.length > 10) return 6;
  if (word.length > 5) return 5;
  return 4;
};

// Helper function to get label rotation for better readability
const getLabelRotation = (angle: number) => {
  // Normalize angle to 0-360 range
  const normalizedAngle = angle % 360;
  
  // For angles near the top (315-45 degrees), keep text upright
  if (normalizedAngle > 315 || normalizedAngle < 45) {
    return angle;
  }
  
  // For angles near the bottom (135-225 degrees), flip text
  if (normalizedAngle > 135 && normalizedAngle < 225) {
    return angle + 180;
  }
  
  // For angles in between, rotate to minimize text overlap
  // If on the right side, rotate clockwise, if on the left side, rotate counterclockwise
  return angle + (normalizedAngle > 180 ? 90 : -90);
};

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
  showInfo = true,
  customWords = [],
  onInfoUpdate
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
  const [showInfoCards, setShowInfoCards] = useState(true);
  const [infoCardsHiddenByNode, setInfoCardsHiddenByNode] = useState(false);
  const [displayState, setDisplayState] = useState<DisplayState>('info');
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [pausedTimeRemaining, setPausedTimeRemaining] = useState<number | null>(null);
  const [initialDuration, setInitialDuration] = useState<number | null>(null);
  const { user } = useAuth() as { user: { uid: string } | null }
  const { location } = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const duration = searchParams.get('duration');
  const sessionId = searchParams.get('sessionId');

  // Add new state for auto-save
  const [lastAutoSave, setLastAutoSave] = useState<number>(Date.now());

  const { playSuccess, playClick } = useSoundEffects();

  // Initialize session
  useEffect(() => {
    if (duration) {
      const durationMs = parseInt(duration);
      if (!isNaN(durationMs)) {
        const now = Date.now();
        setInitialDuration(durationMs);
        setRemainingTime(durationMs);
        setSessionStartTime(now);
        setIsPaused(false);
        setLastAutoSave(now);

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
  }, [duration, sessionId]);

  // Timer effect with auto-save
  useEffect(() => {
    if (!initialDuration || isPaused) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const startTime = sessionStartTime || now;
      const elapsed = now - startTime;
      const remaining = Math.max(0, initialDuration - elapsed);
      
      setRemainingTime(remaining);
      
      // Auto-save every 5 seconds
      if (now - lastAutoSave >= 5000 && sessionId) {
        const progress = Math.min(100, ((initialDuration - remaining) / initialDuration) * 100);
        updateSession(sessionId, {
          status: 'in_progress',
          actual_duration: initialDuration - remaining,
          last_active_time: new Date(now).toISOString(),
          progress: Math.round(progress)
        });
        setLastAutoSave(now);
      }
      
      // Play success sound and handle completion when timer reaches zero
      if (remaining <= 0) {
        clearInterval(timer);
        playSuccess();
        handleSessionComplete();
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [initialDuration, isPaused, sessionStartTime, lastAutoSave, sessionId, playSuccess]);

  const handleSessionComplete = async () => {
    if (!sessionId || !user?.uid) return;

    try {
      await updateSession(sessionId, {
        status: 'completed',
        end_time: new Date().toISOString(),
        actual_duration: initialDuration || 0,
        last_active_time: new Date().toISOString(),
        progress: 100
      });
      toast.success('Session completed!');
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error('Failed to complete session');
    }
  };

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
        // Pausing - save current state
        const elapsed = now - (sessionStartTime || now);
        
        await updateSession(sessionId, {
          status: 'in_progress',
          actual_duration: initialDuration! - elapsed,
          last_active_time: new Date(now).toISOString(),
          progress: Math.round(((initialDuration! - elapsed) / initialDuration!) * 100)
        });
        
        setIsPaused(true);
        setPausedTimeRemaining(elapsed);
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
      await updateSession(sessionId, {
        status: 'aborted',
        end_time: new Date(now).toISOString(),
        actual_duration: initialDuration - (remainingTime || 0),
        last_active_time: new Date(now).toISOString()
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

  // Enhanced page visibility handler
  useEffect(() => {
    if (!sessionId) return;

    const handleVisibilityChange = async () => {
      if (document.hidden && !isPaused) {
        try {
          const now = new Date();
          await updateSession(sessionId, {
            status: 'in_progress',
            actual_duration: initialDuration! - (remainingTime || 0),
            last_active_time: new Date(now).toISOString(),
            paused_duration: (pausedTimeRemaining || 0) + (now.getTime() - (sessionStartTime || now.getTime()))
          });
          
          setIsPaused(true);
          setPausedTimeRemaining(remainingTime);
          
          // Save to localStorage as fallback
          localStorage.setItem('pendingSession', JSON.stringify({
            sessionId,
            remaining: remainingTime,
            original: initialDuration,
            timestamp: now.getTime()
          }));
        } catch (error) {
          console.error('Error handling visibility change:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sessionId, isPaused, remainingTime, initialDuration, sessionStartTime, pausedTimeRemaining]);

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

  const getFocusNodeStyle = (index: number, isMultiView: boolean) => {
    const isSelected = selectedNodeIndex === index;
    const color = dotColors[id % dotColors.length].replace('bg-[', '').replace(']', '');
    
    return {
      backgroundColor: color,
      width: isMultiView ? '6px' : '8px',
      height: isMultiView ? '6px' : '8px',
      opacity: isSelected ? 1 : 0.9,
      transform: `translate(-50%, -50%)`,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: isSelected ? 400 : 200,
    };
  };

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

  const renderFocusNodes = (clockRotation: number, clockFocusNodes: number, clockStartingDegree: number, clockId: number) => {
    // Adjust starting degree for specific clocks to align with their SVGs
    const adjustedStartingDegree = (() => {
      switch (clockId) {
        case 0: return clockStartingDegree + 45; // Clock 1
        case 1: return clockStartingDegree + 90; // Clock 2
        case 3: return clockStartingDegree + 180; // Clock 4
        case 7: return clockStartingDegree + 270; // Clock 8
        default: return clockStartingDegree;
      }
    })();

    return (
      <div className="absolute inset-0" style={{ pointerEvents: 'auto' }}>
        {Array.from({ length: Math.max(0, clockFocusNodes || 0) }).map((_, index) => {
          const angle = ((360 / Math.max(1, clockFocusNodes || 1)) * index + adjustedStartingDegree) % 360;
          const radians = angle * (Math.PI / 180);
          
          // Calculate node position using dynamic radius
          const nodeRadius = getNodeRadius(clockId, isMultiView);
          const x = 50 + nodeRadius * Math.cos(radians);
          const y = 50 + nodeRadius * Math.sin(radians);
          
          const isSelected = selectedNodeIndex === index;
          const word = customWords?.[index];
          
          // Calculate label position with dynamic distance
          const labelDistance = getLabelDistance(word);
          const labelRadius = nodeRadius + labelDistance;
          const labelX = 50 + labelRadius * Math.cos(radians);
          const labelY = 50 + labelRadius * Math.sin(radians);

          return (
            <div key={`${clockId}-${index}`} className="absolute">
              {/* Focus Node */}
              <motion.div
                className={`absolute ${isMultiView ? 'w-2 h-2' : 'w-3 h-3'} rounded-full cursor-pointer`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  ...getFocusNodeStyle(index, isMultiView),
                }}
                onClick={() => handleNodeClick(index)}
                whileHover={{ scale: 1.2 }}
              />
              
              {/* Word Label */}
              {word && (
                <motion.div
                  className="absolute whitespace-nowrap pointer-events-none"
                  style={{
                    left: `${labelX}%`,
                    top: `${labelY}%`,
                    transform: `translate(-50%, -50%) rotate(${getLabelRotation(angle)}deg)`,
                    transformOrigin: 'center',
                    zIndex: isSelected ? 401 : 201,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isSelected ? 1 : 0.7 }}
                  whileHover={{ opacity: 1 }}
                >
                  <div 
                    className={`px-2 py-1 rounded-full text-xs font-medium bg-white/90 dark:bg-black/90 backdrop-blur-sm 
                    ${isSelected ? 'shadow-lg scale-110' : 'shadow-sm'} transition-all
                    outline outline-1 outline-black/10 dark:outline-white/20`}
                  >
                    <span className="text-black/90 dark:text-white/90">{word}</span>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderWordDisplay = () => {
    return null;
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

  // Update renderSatellites function
  const renderSatellites = (clockRotation: number, clockId: number) => {
    if (!showSatellites) return null;
    const satelliteCount = clockSatellites[clockId] || 0;
    const clockSatelliteSettings = allClocks?.find(c => c.id === clockId)?.satellites || 
      defaultSatelliteConfigs[clockId] || 
      Array.from({ length: satelliteCount }).map((_, index) => ({
        rotationTime: 60000, // fallback default 60 seconds
        rotationDirection: 'clockwise' as const,
      }));
    
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
        <motion.div
          key={`satellite-${clockId}-${index}`}
          className="absolute cursor-pointer"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 1 + (index * 0.1), // Stagger the satellites appearance
            duration: 0.5,
            ease: "easeOut"
          }}
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
          }}
          whileHover={{ scale: 1.5 }}
        >
          <div 
            className={`${isMultiView ? 'w-3 h-3' : 'w-4 h-4'} rounded-full bg-black dark:bg-white`}
            style={{
              boxShadow: isMultiView ? 'none' : '0 0 12px rgba(0, 0, 0, 0.4)',
            }}
          />
        </motion.div>
      );
    });
  };

  // Update renderSingleClock to make background transparent
  const renderSingleClock = () => {
    const transitionConfig = getTransitionConfig();
    const clockColor = id === 9 ? null : hexToRgb(dotColors[id].replace('bg-[', '').replace(']', ''));
    const shadowStyle = clockColor ? {
      '--shadow-color': `${clockColor.r}, ${clockColor.g}, ${clockColor.b}`,
    } as React.CSSProperties : {};

    // Adjust starting degree for specific clocks to align with their SVGs
    const adjustedStartingDegree = (() => {
      switch (id) {
        case 0: return startingDegree + 45; // Clock 1
        case 1: return startingDegree + 90; // Clock 2
        case 3: return startingDegree + 180; // Clock 4
        case 7: return startingDegree + 270; // Clock 8
        default: return startingDegree;
      }
    })();
    
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

        {/* Clock face */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <motion.div 
            className="absolute inset-0"
            style={{ 
              willChange: 'transform',
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
            </div>
          </motion.div>
        </div>

        {/* Focus nodes layer */}
        <motion.div 
          className="absolute inset-0"
          style={{ 
            willChange: 'transform',
            zIndex: 200,
            pointerEvents: 'none',
          }}
          animate={{ rotate: rotation }}
          transition={transitionConfig}
        >
          <div className="absolute inset-0" style={{ transform: `rotate(${imageOrientation}deg)`, pointerEvents: 'auto' }}>
            <div className="absolute inset-0" style={{ pointerEvents: 'auto' }}>
              {Array.from({ length: Math.max(0, focusNodes || 0) }).map((_, index) => {
                const angle = ((360 / Math.max(1, focusNodes || 1)) * index + adjustedStartingDegree) % 360;
                const radians = angle * (Math.PI / 180);
                const radius = getNodeRadius(id, isMultiView);
                const x = 50 + radius * Math.cos(radians);
                const y = 50 + radius * Math.sin(radians);

                const isSelected = selectedNodeIndex === index;

                return (
                  <motion.div
                    key={`${id}-${index}`}
                    className="absolute rounded-full cursor-pointer"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      ...getFocusNodeStyle(index, isMultiView),
                    }}
                    onClick={() => handleNodeClick(index)}
                  />
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Word labels layer - always on top */}
        <div className="absolute inset-0" style={{ pointerEvents: 'auto', zIndex: 1000 }}>
          {Array.from({ length: Math.max(0, focusNodes || 0) }).map((_, index) => {
            const angle = ((360 / Math.max(1, focusNodes || 1)) * index + adjustedStartingDegree) % 360;
            const radians = angle * (Math.PI / 180);
            const nodeRadius = getNodeRadius(id, isMultiView);
            const word = customWords?.[index];
            const isSelected = selectedNodeIndex === index;

            if (!word) return null;

            // Calculate label position with dynamic distance
            const labelDistance = getLabelDistance(word);
            const labelRadius = nodeRadius + labelDistance;
            const x = 50 + labelRadius * Math.cos(radians);
            const y = 50 + labelRadius * Math.sin(radians);

            return (
              <motion.div
                key={`word-${id}-${index}`}
                className="absolute whitespace-nowrap"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -50%) rotate(${getLabelRotation(angle)}deg)`,
                  transformOrigin: 'center',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => handleNodeClick(index)}
              >
                <div 
                  className={`px-2 py-1 rounded-full text-xs font-medium bg-white/90 dark:bg-black/90 backdrop-blur-sm 
                  ${isSelected ? 'shadow-lg scale-110' : 'shadow-sm'} transition-all
                  outline outline-1 outline-black/10 dark:outline-white/20 cursor-pointer
                  hover:outline-2 hover:outline-black/20 dark:hover:outline-white/40
                  transform -translate-y-1/2`}
                >
                  <span className="text-black/90 dark:text-white/90">{word}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Satellites layer */}
        <div className="absolute inset-[-20%]" style={{ pointerEvents: 'auto', zIndex: 1000 }}>
          {renderSatellites(rotation, id)}
        </div>
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
        {/* Satellite grid pattern - only shown in multiview2 */}
        {isMultiView2 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            transition={{ duration: 1 }}
            className="absolute inset-[-12%] rounded-full overflow-hidden"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src="/satellite-grid.jpg"
                alt="Satellite Grid Pattern"
                layout="fill"
                objectFit="cover"
                className="opacity-20 dark:invert"
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

              // Calculate position for each outer clock
              const angle = (360 / 8) * index;
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

