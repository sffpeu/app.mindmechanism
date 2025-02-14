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
  4: [ // Clock 5
    { rotationTime: 720 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 1140 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 1710 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 1710 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 900 * 1000, rotationDirection: 'clockwise' }
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
  const path = `/${index + 1}_clock.svg`;
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
  showSatellites = false,
  showInfo = true,
  customWords = []
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
  const searchParams = new URLSearchParams(window.location.search);
  const duration = searchParams.get('duration');
  const sessionId = searchParams.get('sessionId');

  // Add new state for auto-save
  const [lastAutoSave, setLastAutoSave] = useState<number>(Date.now());

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
      }
    }
  }, [duration]);

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
      
      if (remaining <= 0) {
        clearInterval(timer);
        handleSessionComplete();
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [initialDuration, isPaused, sessionStartTime, lastAutoSave, sessionId]);

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

    try {
      if (isPaused) {
        // Resuming - adjust start time to account for paused duration
        const now = Date.now();
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
        const now = Date.now();
        const elapsed = now - (sessionStartTime || now);
        const remaining = Math.max(0, initialDuration! - elapsed);
        const progress = Math.round(((initialDuration! - remaining) / initialDuration!) * 100);
        
        await updateSession(sessionId, {
          status: 'in_progress',
          actual_duration: initialDuration! - remaining,
          last_active_time: new Date(now).toISOString(),
          progress
        });
        
        setIsPaused(true);
        setPausedTimeRemaining(remaining);
      }
    } catch (error) {
      console.error('Error updating session pause state:', error);
      toast.error('Failed to update session state');
    }
  };

  const handleReset = async () => {
    if (!initialDuration || !sessionId || !user?.uid) return;

    try {
      const now = new Date();
      await updateSession(sessionId, {
        status: 'aborted',
        end_time: now.toISOString(),
        actual_duration: initialDuration - (remainingTime || 0),
        last_active_time: now.toISOString()
      });

      // Reset the timer but keep the session ID
      setRemainingTime(initialDuration);
      setSessionStartTime(now.getTime());
      setIsPaused(false);
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

  const handleNodeClick = (index: number) => {
    if (selectedNodeIndex === index) {
      setSelectedNodeIndex(null);
      setInfoCardsHiddenByNode(false);
    } else {
      setSelectedNodeIndex(index);
      setInfoCardsHiddenByNode(true);
      setShowInfoCards(false);
    }
  };

  const renderFocusNodes = (clockRotation: number, clockFocusNodes: number, clockStartingDegree: number, clockId: number) => {
    return (
      <div className="absolute inset-0" style={{ pointerEvents: 'auto' }}>
        {Array.from({ length: Math.max(0, clockFocusNodes || 0) }).map((_, index) => {
          const angle = ((360 / Math.max(1, clockFocusNodes || 1)) * index + clockStartingDegree) % 360;
          const radians = angle * (Math.PI / 180);
          const radius = isMultiView ? 53 : 55;
          const x = 50 + radius * Math.cos(radians);
          const y = 50 + radius * Math.sin(radians);

          const isSelected = selectedNodeIndex === index;

          return (
            <motion.div
              key={`${clockId}-${index}`}
              className={`absolute ${isMultiView ? 'w-2 h-2' : 'w-3 h-3'} rounded-full cursor-pointer`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: dotColors[clockId % dotColors.length].replace('bg-[', '').replace(']', ''),
                boxShadow: isSelected ? '0 0 12px rgba(0, 0, 0, 0.5)' : '0 0 8px rgba(0, 0, 0, 0.3)',
              }}
              whileHover={{ scale: 1.5 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => handleNodeClick(index)}
            />
          );
        })}
      </div>
    );
  };

  const renderWordDisplay = () => {
    if (selectedNodeIndex === null || !customWords || !customWords[selectedNodeIndex]) return null;

    return (
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 1000 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
      >
        <motion.div
          className="bg-white/90 dark:bg-black/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg"
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: 'center',
          }}
        >
          <p className="text-sm font-medium text-black dark:text-white whitespace-nowrap">
            {customWords[selectedNodeIndex]}
          </p>
        </motion.div>
      </motion.div>
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
                className="rounded-full [&_*]:stroke-[0.25]"
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
    const clockColor = id === 9 ? null : hexToRgb(dotColors[id].replace('bg-[#', '').replace(']', ''));
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
                className="rounded-full dark:invert [&_*]:stroke-[0.25]"
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
                const angle = ((360 / Math.max(1, focusNodes || 1)) * index + startingDegree) % 360;
                const radians = angle * (Math.PI / 180);
                const radius = isMultiView ? 53 : 55;
                const x = 50 + radius * Math.cos(radians);
                const y = 50 + radius * Math.sin(radians);

                const isSelected = selectedNodeIndex === index;

                return (
                  <motion.div
                    key={`${id}-${index}`}
                    className={`absolute ${isMultiView ? 'w-2 h-2' : 'w-3 h-3'} rounded-full cursor-pointer`}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: dotColors[id % dotColors.length].replace('bg-[', '').replace(']', ''),
                      boxShadow: isSelected ? '0 0 12px rgba(0, 0, 0, 0.5)' : '0 0 8px rgba(0, 0, 0, 0.3)',
                      pointerEvents: 'auto',
                      zIndex: 300,
                    }}
                    whileHover={{ scale: 1.5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    onClick={() => handleNodeClick(index)}
                  />
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Word display */}
        {renderWordDisplay()}

        {/* Satellites layer */}
        <div className="absolute inset-[-20%]" style={{ pointerEvents: 'auto', zIndex: 1000 }}>
          {renderSatellites(rotation, id)}
        </div>
      </div>
    );
  };

  function InfoCard({ icon, title, value, onHide }: { icon: React.ReactNode; title: string; value: string; onHide: () => void }) {
    return (
      <Card 
        className="bg-white/80 dark:bg-black/80 backdrop-blur-sm cursor-pointer hover:bg-white/90 dark:hover:bg-black/90 transition-colors"
        onClick={onHide}
      >
        <CardContent className="flex items-center p-1.5">
          <div className="mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0">{icon}</div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
            <p className="text-sm font-semibold truncate dark:text-white">{value}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isMultiView || isMultiView2) {
    return (
      <div className="relative w-[75vw] h-[75vw] max-w-[550px] max-h-[550px]">
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

        {/* Individual clocks in multiview2 */}
        {isMultiView2 && allClocks?.map((clock, index) => {
          if (index >= 9) return null;

          // Calculate position for each mini clock
          const angle = (360 / 8) * index;
          const radius = index === 8 ? 0 : 32; // Reduced radius for tighter arrangement
          const radians = (angle * Math.PI) / 180;
          const x = 50 + radius * Math.cos(radians);
          const y = 50 + radius * Math.sin(radians);

          // Calculate rotation
          const now = Date.now();
          const elapsedMilliseconds = now - clock.startDateTime.getTime();
          const calculatedRotation = (elapsedMilliseconds / clock.rotationTime) * 360;
          const clockRotation = clock.rotationDirection === 'clockwise'
            ? (clock.startingDegree + calculatedRotation) % 360
            : (clock.startingDegree - calculatedRotation + 360) % 360;

          return (
            <motion.div
              key={`mini-clock-${clock.id}`}
              className="absolute w-[20%] aspect-square hover:scale-110 transition-transform duration-200 group"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: "easeOut"
              }}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: index === 8 ? 40 : 30,
              }}
            >
              <div className="relative w-full h-full">
                {/* Tooltip */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-black dark:text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {clockRotation.toFixed(1)}°
                </div>
                <div
                  className="absolute inset-0 rounded-full overflow-hidden"
                  style={{
                    transform: `rotate(${clockRotation}deg)`,
                  }}
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
                      className="rounded-full [&_*]:stroke-[0.25]"
                      priority
                      loading="eager"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

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
        {/* Clock faces layer */}
        <div className="absolute inset-[5%] rounded-full">
          <div className="absolute inset-0 dark:invert" style={{ zIndex: 1 }}>
            {allClocks?.map((clock, index) => {
              const now = Date.now();
              const elapsedMilliseconds = now - clock.startDateTime.getTime();
              const calculatedRotation = (elapsedMilliseconds / clock.rotationTime) * 360;
              const clockRotation = clock.rotationDirection === 'clockwise'
                ? (clock.startingDegree + calculatedRotation) % 360
                : (clock.startingDegree - calculatedRotation + 360) % 360;

              return (
                <div key={clock.id} className="absolute inset-0" style={{ mixBlendMode: 'multiply' }}>
                  <div className="absolute inset-[2%] rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-0"
                      style={{ 
                        transform: `rotate(${clockRotation}deg)`,
                      }}
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
                          className="rounded-full [&_*]:stroke-[0.25]"
                          priority
                          loading="eager"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Focus nodes layer - only for multiview1 */}
        {!isMultiView2 && (
          <div className="absolute inset-[5%] rounded-full" style={{ zIndex: 100, pointerEvents: 'none' }}>
            {allClocks?.map((clock, index) => {
              const now = Date.now();
              const elapsedMilliseconds = now - clock.startDateTime.getTime();
              const calculatedRotation = (elapsedMilliseconds / clock.rotationTime) * 360;
              const clockRotation = clock.rotationDirection === 'clockwise'
                ? (clock.startingDegree + calculatedRotation) % 360
                : (clock.startingDegree - calculatedRotation + 360) % 360;

              return (
                <div 
                  key={`focus-nodes-${clock.id}`}
                  className="absolute inset-0"
                  style={{ 
                    transform: `rotate(${clockRotation}deg)`,
                    pointerEvents: 'auto',
                    zIndex: 100,
                  }}
                >
                  {renderFocusNodes(clockRotation, clock.focusNodes, clock.startingDegree, clock.id)}
                </div>
              );
            })}
          </div>
        )}
        {/* Satellites layer - only for multiview1 */}
        {!isMultiView2 && (
          <div className="absolute inset-[5%] rounded-full" style={{ zIndex: 110, pointerEvents: 'none' }}>
            {allClocks?.map((clock, index) => {
              const now = Date.now();
              const elapsedMilliseconds = now - clock.startDateTime.getTime();
              const calculatedRotation = (elapsedMilliseconds / clock.rotationTime) * 360;
              const clockRotation = clock.rotationDirection === 'clockwise'
                ? (clock.startingDegree + calculatedRotation) % 360
                : (clock.startingDegree - calculatedRotation + 360) % 360;

              return (
                <div 
                  key={`satellites-${clock.id}`}
                  className="absolute inset-0"
                  style={{ 
                    transform: `rotate(${clockRotation}deg)`,
                    pointerEvents: 'auto',
                    zIndex: 110,
                  }}
                >
                  {renderSatellites(clockRotation, clock.id)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between min-h-screen w-full dark:bg-black">
      <div className="flex-grow flex items-center justify-center">
        {renderSingleClock()}
      </div>

      {/* Timer Controls */}
      {remainingTime !== null && (
        <div className="fixed bottom-8 left-8 z-50 flex items-center gap-2">
          <div className="px-4 py-2 rounded-lg bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-black/5 dark:border-white/10">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatTime(remainingTime)}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePauseResume}
              className="p-2 rounded-lg bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-black/5 dark:border-white/10 hover:bg-white/90 dark:hover:bg-black/90 transition-colors"
            >
              {isPaused ? (
                <Play className="h-5 w-5 text-gray-900 dark:text-white" />
              ) : (
                <Pause className="h-5 w-5 text-gray-900 dark:text-white" />
              )}
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-black/5 dark:border-white/10 hover:bg-white/90 dark:hover:bg-black/90 transition-colors"
            >
              <RotateCw className="h-5 w-5 text-gray-900 dark:text-white" />
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-[1000px] mx-auto mb-2 px-3 relative">
        {showElements && (
          <>
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
            <motion.div 
              className="h-[60px] flex items-center justify-center overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800"
              initial={false}
              animate={{ 
                height: showInfoCards ? "60px" : "0px",
                opacity: showInfoCards ? 1 : 0,
                y: showInfoCards ? 0 : 20
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="w-full">
                <div className="flex justify-start items-center gap-1.5 px-2">
                  <div className="shrink-0">
                    <InfoCard icon={<ClockIcon className="h-4 w-4" />} title="Current" value={currentTime.toLocaleTimeString()} onHide={() => setShowInfoCards(false)} />
                  </div>
                  <div className="shrink-0">
                    <InfoCard icon={<Calendar className="h-4 w-4" />} title="Started" value={startDateTime.toLocaleDateString()} onHide={() => setShowInfoCards(false)} />
                  </div>
                  <div className="shrink-0">
                    <InfoCard icon={<RotateCw className="h-4 w-4" />} title="Rotation" value={`${rotationDirection === 'clockwise' ? '+' : ''}${rotation.toFixed(3)}°`} onHide={() => setShowInfoCards(false)} />
                  </div>
                  <div className="shrink-0">
                    <InfoCard icon={<Repeat className="h-4 w-4" />} title="R. Complete" value={rotationsCompleted.toString()} onHide={() => setShowInfoCards(false)} />
                  </div>
                  <div className="shrink-0">
                    <InfoCard icon={<Timer className="h-4 w-4" />} title="Elapsed" value={elapsedTime} onHide={() => setShowInfoCards(false)} />
                  </div>
                  <div className="shrink-0">
                    <InfoCard icon={<Compass className="h-4 w-4" />} title="Start °" value={`${startingDegree.toFixed(1)}°`} onHide={() => setShowInfoCards(false)} />
                  </div>
                  <div className="shrink-0">
                    <InfoCard icon={<RotateCw className="h-4 w-4" />} title="Rot. Time" value={`${rotationTime / 1000}s`} onHide={() => setShowInfoCards(false)} />
                  </div>
                  <div className="shrink-0">
                    <InfoCard icon={<div className={`w-4 h-4 ${dotColors[id % dotColors.length]} rounded-full`} />} title="Focus Nodes" value={focusNodes.toString()} onHide={() => setShowInfoCards(false)} />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

function getElapsedTime(currentDate: Date, startDateTime: Date): string {
  const elapsed = currentDate.getTime() - startDateTime.getTime();
  const days = Math.floor(elapsed / (24 * 60 * 60 * 1000));
  
  // If more than 365 days, show years
  if (days >= 365) {
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    const hours = Math.floor((elapsed % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((elapsed % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((elapsed % (60 * 1000)) / 1000);
    return `${years}y ${remainingDays}d ${hours}h ${minutes}m ${seconds}s`;
  }
  
  // Otherwise show days as before
  const hours = Math.floor((elapsed % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((elapsed % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((elapsed % (60 * 1000)) / 1000);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

