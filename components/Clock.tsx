'use client'

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClockIcon, Calendar, RotateCw, Timer, Compass, ChevronUp, ChevronDown, Repeat, Eye, EyeOff, Settings, Play, SkipForward, Repeat as RepeatIcon } from 'lucide-react';
import { ClockSettings } from '../types/ClockSettings';
import { motion } from 'framer-motion';
import { Word, loadWords, getClockWords } from '@/lib/words';

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

// Add display state type
type DisplayState = 'info' | 'words' | 'sound';

// Add keyframes for the shadow animation
const shadowKeyframes = {
  "0%": { boxShadow: "0 0 50px rgba(var(--shadow-color), 0)" },
  "25%": { boxShadow: "0 0 100px rgba(var(--shadow-color), 0.15)" },
  "50%": { boxShadow: "0 0 150px rgba(var(--shadow-color), 0.3)" },
  "75%": { boxShadow: "0 0 100px rgba(var(--shadow-color), 0.15)" },
  "100%": { boxShadow: "0 0 50px rgba(var(--shadow-color), 0)" }
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
  customWords,
  isMultiView = false,
  isMultiView2 = false,
  allClocks = [], 
  showElements, 
  currentTime, 
  syncTrigger, 
  onToggleShow, 
  hideControls = false,
  showSatellites = false,
  showInfo = true
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
  const [displayState, setDisplayState] = useState<DisplayState>('info');
  const [words, setWords] = useState<string[]>([]);

  useEffect(() => {
    // Load words when component mounts
    async function fetchWords() {
      const loadedWords = await loadWords();
      const clockSpecificWords = getClockWords(id);
      setWords(clockSpecificWords);
    }
    fetchWords();
  }, [id]);

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

  const renderFocusNodes = (clockRotation: number, clockFocusNodes: number, clockStartingDegree: number, clockId: number) => {
    // If no words are available for this clock, return null
    if (words.length === 0) return null;

    // Add 30 degrees to starting angle for Clock 9 and Clock 2
    const adjustedStartingDegree = (clockId === 8 || clockId === 1) ? clockStartingDegree + 30 : clockStartingDegree;

    return (
      <div className="absolute inset-0" style={{ pointerEvents: 'auto' }}>
        {Array.from({ length: Math.max(0, clockFocusNodes || 0) }).map((_, index) => {
          const angle = ((360 / Math.max(1, clockFocusNodes || 1)) * index + adjustedStartingDegree) % 360;
          const radians = angle * (Math.PI / 180);
          const radius = isMultiView ? 53 : 55;
          const x = 50 + radius * Math.cos(radians);
          const y = 50 + radius * Math.sin(radians);

          // Get word for this node - cycle through available words
          const wordIndex = index % words.length;
          const word = words[wordIndex];

          return (
            <motion.div
              key={`${clockId}-${index}`}
              className={`absolute ${isMultiView ? 'w-2 h-2' : 'w-3 h-3'} rounded-full cursor-pointer`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: dotColors[clockId % dotColors.length].replace('bg-[', '').replace(']', ''),
                boxShadow: '0 0 8px rgba(0, 0, 0, 0.3)',
              }}
              whileHover={{ scale: 1.5 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            />
          );
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
            zIndex: 50,
          }}
          animate={{ rotate: rotation }}
          transition={transitionConfig}
        >
          <div className="absolute inset-0" style={{ transform: `rotate(${imageOrientation}deg)` }}>
            {renderFocusNodes(rotation, focusNodes, startingDegree, id)}
          </div>
        </motion.div>

        {/* Satellites layer */}
        <div className="absolute inset-[-20%]" style={{ pointerEvents: 'auto', zIndex: 1000 }}>
          {renderSatellites(rotation, id)}
        </div>
      </div>
    );
  };

  function WordCard({ word }: { word: string }) {
    return (
      <Card className="bg-white/80 dark:bg-black/80 backdrop-blur-sm min-w-fit">
        <CardContent className="flex items-center p-2 h-[52px] justify-center">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-center px-3 whitespace-nowrap dark:text-white">{word}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  function SoundCard() {
    return (
      <Card className="bg-white/80 dark:bg-black/80 backdrop-blur-sm min-w-[280px]">
        <CardContent className="flex items-center p-2 h-[52px] justify-between gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full dark:text-white">
            <Play className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">Ambient Sound</p>
            <p className="text-sm font-semibold truncate dark:text-white">03:45</p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 dark:text-white">
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 dark:text-white">
              <RepeatIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Update the click handler for the colored dot
  const handleDisplayToggle = () => {
    setDisplayState(current => {
      switch (current) {
        case 'info':
          return 'words';
        case 'words':
          return 'sound';
        case 'sound':
          return 'info';
        default:
          return 'info';
      }
    });
  };

  if (isMultiView || isMultiView2) {
    return (
      <div className="relative w-[90vw] h-[90vw] max-w-[700px] max-h-[700px]">
        {/* Satellite grid pattern - only shown in multiview2 */}
        {isMultiView2 && (
          <div className="absolute inset-[-17.5%] rounded-full overflow-hidden">
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
          </div>
        )}

        {/* Individual SVGs positioned around the multi-view - only shown in multiview2 */}
        {isMultiView2 && allClocks?.map((clock, index) => {
          if (index >= 9) return null; // Skip any clocks beyond the first 9
          
          // Calculate position based on index with inverted distribution
          const baseAngle = (360 / 9) * index;
          const adjustedAngle = baseAngle + 90; // Invert by adding 90 instead of subtracting
          const radius = 65; // Fixed radius for even distribution
          const x = 50 + radius * Math.cos((adjustedAngle * Math.PI) / 180);
          const y = 50 + radius * Math.sin((adjustedAngle * Math.PI) / 180);
          
          // Calculate rotation based on clock settings
          const now = Date.now();
          const elapsedMilliseconds = now - clock.startDateTime.getTime();
          const calculatedRotation = (elapsedMilliseconds / clock.rotationTime) * 360;
          const clockRotation = clock.rotationDirection === 'clockwise'
            ? (clock.startingDegree + calculatedRotation) % 360
            : (clock.startingDegree - calculatedRotation + 360) % 360;

          const clockColor = hexToRgb(dotColors[clock.id].replace('bg-[#', '').replace(']', ''));
          const shadowStyle = clockColor ? {
            '--shadow-color': `${clockColor.r}, ${clockColor.g}, ${clockColor.b}`,
          } as React.CSSProperties : {};
          
          return (
            <motion.div
              key={`mini-clock-${clock.id}`}
              className="absolute w-[25%] aspect-square hover:scale-110 transition-transform duration-200 group"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.8,
                ease: "easeOut"
              }}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 30,
              }}
            >
              <div className="relative w-full h-full">
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-black dark:text-white text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {clockRotation.toFixed(4)}°
                </div>
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
                      mixBlendMode: 'multiply',
                    }}
                  >
                    {index < 8 ? (
                      <motion.div 
                        className="absolute inset-0"
                        style={{ 
                          willChange: 'transform',
                          transformOrigin: 'center',
                        }}
                        animate={{ rotate: clockRotation }}
                        transition={{
                          duration: 0.016,
                          ease: 'linear',
                        }}
                      >
                        <Image 
                          src={(() => {
                            // Map index to correct svg based on position
                            switch(index) {
                              case 0: return '/1_small.svg';  // Position 1 (90°)
                              case 1: return '/7_small.svg';  // Position 2 (130°)
                              case 2: return '/5_small.svg';  // Position 3 (170°)
                              case 3: return '/2_small.svg';  // Position 4 (210°)
                              case 4: return '/8_small.svg';  // Position 5 (250°)
                              case 5: return '/6_small.svg';  // Position 6 (290°)
                              case 6: return '/4_small.svg';  // Position 7 (330°)
                              case 7: return '/9_small.svg';  // Position 8 (370° / 10°)
                              default: return '/3_small.svg'; // Position 9 (410° / 50°)
                            }
                          })()}
                          alt={`Clock Face ${index + 1}`}
                          layout="fill"
                          objectFit="contain"
                          className="rounded-full dark:invert [&_*]:stroke-[0.25]"
                          priority
                          onError={(e) => {
                            console.error(`Error loading image for clock ${index + 1}`);
                            handleImageError();
                          }}
                        />
                      </motion.div>
                    ) : (
                      <Image
                        src="/3_small.svg"
                        alt={`Clock ${index + 1}`}
                        layout="fill"
                        objectFit="contain"
                        className="rounded-full dark:invert [&_*]:stroke-[0.25]"
                        priority
                        onError={handleImageError}
                      />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {!hideControls && (
          <>
            <div className="fixed top-4 left-4 z-10 font-bold text-2xl dark:text-white">
              {isMultiView2 ? 'M2' : 'M1'}
            </div>
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
      <div className="fixed top-4 left-4 z-10 font-bold text-2xl dark:text-white">M</div>
      
      <div className="flex-grow flex items-center justify-center">
        {renderSingleClock()}
      </div>
      <div className="w-full max-w-[1200px] mx-auto mb-4 px-4 relative">
        {showElements && (
          <>
            <div className="flex justify-center gap-2 mb-3">
              {['info', 'words', 'sound'].map((state) => (
                <button
                  key={state}
                  onClick={() => setDisplayState(state as DisplayState)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ease-out hover:scale-150 ${
                    displayState === state 
                      ? 'bg-black/90 dark:bg-white scale-125'
                      : 'bg-black/30 dark:bg-gray-700 hover:bg-black/60 dark:hover:bg-gray-600'
                  }`}
                />
              ))}
            </div>
            <div className="h-[68px] flex items-center justify-center">
              <div className={`w-full transition-all duration-300 ease-in-out ${displayState === 'info' ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}>
                <div className="flex flex-wrap justify-center items-start gap-2">
                  <InfoCard icon={<ClockIcon className="h-4 w-4" />} title="Current" value={currentTime.toLocaleTimeString()} />
                  <InfoCard 
                    icon={<Calendar className="h-4 w-4" />} 
                    title="Started" 
                    value={startDateTime.toLocaleDateString()} 
                  />
                  <InfoCard 
                    icon={<RotateCw className="h-4 w-4" />} 
                    title="Rotation" 
                    value={`${rotationDirection === 'clockwise' ? '+' : ''}${rotation.toFixed(3)}°`} 
                  />
                  <InfoCard icon={<Repeat className="h-4 w-4" />} title="R. Complete" value={rotationsCompleted.toString()} />
                  <InfoCard icon={<Timer className="h-4 w-4" />} title="Elapsed" value={elapsedTime} />
                  <InfoCard icon={<Compass className="h-4 w-4" />} title="Start °" value={`${startingDegree.toFixed(1)}°`} />
                  <InfoCard icon={<RotateCw className="h-4 w-4" />} title="Rot. Time" value={`${rotationTime / 1000}s`} />
                  <InfoCard icon={<div className={`w-4 h-4 ${dotColors[id % dotColors.length]} rounded-full`} />} title="Focus Nodes" value={focusNodes.toString()} />
                </div>
              </div>
              <div className={`w-full transition-all duration-300 ease-in-out ${displayState === 'words' ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}>
                <div className="max-h-[120px] overflow-y-auto">
                  <div className="flex flex-wrap gap-2 justify-center px-4">
                    {Array.from({ length: focusNodes }).map((_, index) => {
                      const wordIndex = index % words.length;
                      const word = words[wordIndex] || '';
                      return (
                        <WordCard 
                          key={index} 
                          word={word} 
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className={`w-full transition-all duration-300 ease-in-out ${displayState === 'sound' ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}>
                <div className="flex justify-center">
                  <SoundCard />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <Card className="bg-white/80 dark:bg-black/80 backdrop-blur-sm">
      <CardContent className="flex items-center p-2">
        <div className="mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
          <p className="text-sm font-semibold truncate dark:text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function getElapsedTime(currentDate: Date, startDateTime: Date): string {
  const elapsed = currentDate.getTime() - startDateTime.getTime();
  const days = Math.floor(elapsed / (24 * 60 * 60 * 1000));
  const hours = Math.floor((elapsed % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((elapsed % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((elapsed % (60 * 1000)) / 1000);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

