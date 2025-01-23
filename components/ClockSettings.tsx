import React, { useState, useEffect, useRef } from 'react';
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { ClockSettings as ClockSettingsType, SatelliteSettings } from '../types/ClockSettings';
import Image from 'next/image';
import { Slider } from "./ui/slider"
import { Card, CardContent } from "./ui/card"
import { MinusIcon, PlusIcon, ChevronRight, ChevronLeft, Plus, X, Calendar, Timer, RotateCw, Compass, Scale, Move, Layers } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs"
import { clockSatellites } from './Clock';
import { Switch } from "./ui/switch"

// Add dotColors constant at the top of the file
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

// Default emotional states
const defaultEmotionalStates = [
  'Believe', 'Trust', 'Hope', 'Dream', 'Love', 'Peace', 'Joy', 'Calm',
  'Grace', 'Faith', 'Bliss', 'Shine', 'Flow', 'Rise', 'Grow', 'Soar'
];

type RotationDirection = 'clockwise' | 'counterclockwise';
type SettingsStep = 'main' | 'words' | 'preview';

interface ClockSettingsProps {
  settings: ClockSettingsType;
  onSave: (settings: Partial<ClockSettingsType>) => void;
  onCancel: () => void;
}

// Update the base input class
const baseInputClass = `
  h-9 
  w-full
  px-3
  text-base
  text-black dark:text-white 
  bg-white dark:bg-black 
  border border-black/20 dark:border-white/20 
  rounded-md
  focus:outline-none 
  focus:ring-2 
  focus:ring-black dark:focus:ring-white 
  focus:border-black dark:focus:border-white
  caret-black dark:caret-white
`.replace(/\s+/g, ' ').trim();

const inputRefs = new Map<number, React.RefObject<HTMLInputElement>>();

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = "1",
  placeholder,
  className = "",
  suffix,
  showStepButtons = false,
}: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  step?: string;
  placeholder?: string;
  className?: string;
  suffix?: string;
  showStepButtons?: boolean;
}) {
  const increment = () => {
    const currentValue = value === '' ? 0 : parseFloat(value);
    const stepValue = parseFloat(step);
    const maxValue = max ? parseFloat(max) : Infinity;
    const newValue = Math.min(currentValue + stepValue, maxValue);
    onChange(newValue.toString());
  };

  const decrement = () => {
    const currentValue = value === '' ? 0 : parseFloat(value);
    const stepValue = parseFloat(step);
    const minValue = min ? parseFloat(min) : -Infinity;
    const newValue = Math.max(currentValue - stepValue, minValue);
    onChange(newValue.toString());
  };

  return (
    <div className="relative flex-1">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        min={min}
        max={max}
        step={step}
        onFocus={(e) => {
          e.target.select();
          requestAnimationFrame(() => {
            e.target.focus();
          });
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          const input = e.target as HTMLInputElement;
          input.focus();
          input.select();
        }}
        onChange={(e) => {
          let value = e.target.value;
          if (!/^\d*\.?\d*$/.test(value)) {
            return;
          }
          onChange(value);
          requestAnimationFrame(() => {
            e.target.focus();
          });
        }}
        className={`${baseInputClass} ${suffix ? 'pr-12' : ''} ${showStepButtons ? 'pr-8' : ''} ${className}`}
        placeholder={placeholder}
        style={{
          WebkitAppearance: 'none',
          MozAppearance: 'textfield',
          zIndex: 99999999
        }}
      />
      {showStepButtons && (
        <div className="absolute right-0 top-0 bottom-0 w-8 flex flex-col border-l border-black/10 dark:border-white/10">
          <button
            type="button"
            onClick={increment}
            className="flex-1 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white"
          >
            <ChevronRight className="h-3 w-3 rotate-[-90deg]" />
          </button>
          <div className="w-full h-[1px] bg-black/10 dark:bg-white/10" />
          <button
            type="button"
            onClick={decrement}
            className="flex-1 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white"
          >
            <ChevronRight className="h-3 w-3 rotate-90" />
          </button>
        </div>
      )}
      {suffix && !showStepButtons && (
        <div className="absolute right-3 top-0 h-full flex items-center text-sm text-black/60 dark:text-white/60">
          {suffix}
        </div>
      )}
      {suffix && showStepButtons && (
        <div className="absolute right-9 top-0 h-full flex items-center text-sm text-black/60 dark:text-white/60">
          {suffix}
        </div>
      )}
    </div>
  );
}

function StepButton({ onClick, children, className = "" }: { onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-[52px] h-7 flex items-center justify-center text-xs font-medium text-black dark:text-white bg-white dark:bg-black border border-black/20 dark:border-white/20 hover:bg-black/10 dark:hover:bg-white/10 rounded-md ${className}`}
    >
      {children}
    </button>
  );
}

export function ClockSettings({ settings, onSave, onCancel }: ClockSettingsProps) {
  const [localSettings, setLocalSettings] = useState<Partial<ClockSettingsType>>({
    ...settings,
    satellites: settings.satellites || initializeSatellites(settings.id),
  });

  // Initialize satellites with default settings
  function initializeSatellites(clockId: number): SatelliteSettings[] {
    const count = clockSatellites[clockId] || 0;
    return Array.from({ length: count }).map((_, index) => ({
      id: index,
      rotationTime: 60000, // default 60 seconds
      rotationDirection: 'clockwise' as const,
    }));
  }

  // Default values
  const defaultDate = new Date('2024-01-01T00:00:00Z');
  const startDateTime = localSettings.startDateTime || defaultDate;
  const defaultRotationTime = 60000; // 60 seconds
  const defaultStartingDegree = 0;
  const defaultFocusNodes = 0;
  const defaultRotationDirection = 'clockwise' as RotationDirection;
  const defaultImageOrientation = 0;
  const defaultImageScale = 1;

  const [day, setDay] = useState(startDateTime.getDate().toString());
  const [month, setMonth] = useState((startDateTime.getMonth() + 1).toString());
  const [year, setYear] = useState(startDateTime.getFullYear().toString());
  const [startTime, setStartTime] = useState(startDateTime.toTimeString().substr(0, 5));
  const [rotationTime, setRotationTime] = useState((localSettings.rotationTime || defaultRotationTime).toString());
  const [startingDegree, setStartingDegree] = useState((localSettings.startingDegree || defaultStartingDegree).toString());
  const [focusNodes, setFocusNodes] = useState((localSettings.focusNodes || defaultFocusNodes).toString());
  const [rotationDirection, setRotationDirection] = useState<RotationDirection>(localSettings.rotationDirection || defaultRotationDirection);
  const [imageOrientation, setImageOrientation] = useState((localSettings.imageOrientation || defaultImageOrientation).toString());
  const [imageScale, setImageScale] = useState((localSettings.imageScale || defaultImageScale).toString());
  const [imageX, setImageX] = useState(localSettings.imageX?.toString() || "0");
  const [imageY, setImageY] = useState(localSettings.imageY?.toString() || "0");
  const [customWords, setCustomWords] = useState<string[]>(localSettings.customWords || [...defaultEmotionalStates]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (target.classList.contains('settings-backdrop')) {
          onCancel();
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel]);

  useEffect(() => {
    // Initialize refs for each satellite
    localSettings.satellites?.forEach((satellite) => {
      if (!inputRefs.has(satellite.id)) {
        inputRefs.set(satellite.id, React.createRef<HTMLInputElement>());
      }
    });
  }, [localSettings.satellites]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isNaN(parsedDate.getTime())) {
      alert('Invalid date. Please enter a valid date.');
      return;
    }
    const [hours, minutes] = startTime.split(':').map(Number);
    parsedDate.setHours(hours, minutes);
    onSave({
      startDateTime: parsedDate,
      rotationTime: parseInt(rotationTime),
      startingDegree: parseFloat(startingDegree),
      focusNodes: parseInt(focusNodes),
      rotationDirection,
      imageOrientation: parseFloat(imageOrientation),
      imageScale: parseFloat(imageScale),
      imageX: parseFloat(imageX),
      imageY: parseFloat(imageY),
      customWords
    });
  };

  function SettingCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-black/80 dark:text-white/80">{icon}</div>
          <h3 className="text-sm font-medium text-black/80 dark:text-white/80">{title}</h3>
        </div>
        <div className="w-full space-y-2">{children}</div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center settings-backdrop overflow-hidden"
      style={{ zIndex: 99999999 }}
    >
      <div 
        ref={containerRef} 
        className="relative bg-white dark:bg-black rounded-lg shadow-xl w-[95vw] max-w-[1000px] h-[90vh] max-h-[800px] flex flex-col"
        style={{ zIndex: 99999999 }}
      >
        <div className="absolute inset-0 bg-white dark:bg-black rounded-lg" style={{ zIndex: 1 }} />
        <Button
          onClick={onCancel}
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white dark:bg-black hover:bg-black/10 dark:hover:bg-white/10 border border-black/20 dark:border-white/20"
          style={{ zIndex: 1000001 }}
        >
          <X className="h-4 w-4 text-black dark:text-white" />
        </Button>

        <form onSubmit={handleSubmit} className="h-full flex flex-col relative" style={{ zIndex: 99999999 }}>
          <Tabs defaultValue="general" className="h-full flex flex-col">
            <div className="px-4 pt-3 pb-0 sticky top-0 bg-white dark:bg-black z-10">
              <TabsList className="bg-black/5 dark:bg-white/5 p-1 rounded-lg">
                <TabsTrigger 
                  value="general" 
                  className="rounded-md px-4 py-2 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white text-black/60 dark:text-white/60"
                >
                  General
                </TabsTrigger>
                <TabsTrigger 
                  value="satellites" 
                  className="rounded-md px-4 py-2 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white text-black/60 dark:text-white/60"
                >
                  Satellites
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 px-4 py-3 overflow-y-auto space-y-3">
              <TabsContent value="general" className="m-0 h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
                  {/* Left Column - Clock Preview */}
                  <div className="col-span-1">
                    <div className="aspect-square w-full relative rounded-full overflow-hidden border border-black/10 dark:border-white/20">
                      {/* Combined rotating container for SVG and focus nodes */}
                      <div 
                        className="absolute inset-0"
                        style={{
                          transform: `rotate(${imageOrientation}deg)`,
                          transition: 'transform 0.3s ease-in-out',
                        }}
                      >
                        {/* SVG Image */}
                        <div
                          className="absolute inset-0"
                          style={{
                            transform: `translate(${imageX}%, ${imageY}%) scale(${imageScale})`,
                            transition: 'transform 0.3s ease-in-out',
                          }}
                        >
                          <Image
                            src={settings.imageUrl}
                            alt="Clock Face Preview"
                            fill
                            style={{ objectFit: 'cover' }}
                            className="dark:invert"
                          />
                        </div>
                        {/* Focus Nodes */}
                        {Array.from({ length: Math.max(0, parseInt(focusNodes) || 0) }).map((_, index) => {
                          const angle = ((360 / Math.max(1, parseInt(focusNodes) || 1)) * index + parseFloat(startingDegree || '0')) % 360;
                          const radians = angle * (Math.PI / 180);
                          const radius = 48; // Percentage from center
                          const x = 50 + radius * Math.cos(radians);
                          const y = 50 + radius * Math.sin(radians);
                          return (
                            <div
                              key={index}
                              className="absolute w-2 h-2 rounded-full"
                              style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                transform: 'translate(-50%, -50%)',
                                backgroundColor: dotColors[settings.id % dotColors.length].replace('bg-[', '').replace(']', ''),
                                transition: 'all 0.3s ease-in-out',
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Middle Column - Basic Settings */}
                  <div className="col-span-1 space-y-4">
                    <SettingCard icon={<Calendar className="h-4 w-4" />} title="Start Date & Time">
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <NumberInput
                            value={day}
                            onChange={setDay}
                            min="1"
                            max="31"
                            placeholder="DD"
                            showStepButtons
                          />
                          <NumberInput
                            value={month}
                            onChange={setMonth}
                            min="1"
                            max="12"
                            placeholder="MM"
                            showStepButtons
                          />
                          <NumberInput
                            value={year}
                            onChange={setYear}
                            placeholder="YYYY"
                            showStepButtons
                          />
                        </div>
                        <Input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className={`${baseInputClass} text-base`}
                        />
                      </div>
                    </SettingCard>

                    <SettingCard icon={<Timer className="h-4 w-4" />} title="Rotation Settings">
                      <div className="space-y-2">
                        <NumberInput
                          value={rotationTime}
                          onChange={setRotationTime}
                          min="1"
                          placeholder="Seconds per rotation"
                          suffix="sec"
                          showStepButtons
                        />
                        <Select 
                          value={rotationDirection} 
                          onValueChange={(value: RotationDirection) => setRotationDirection(value)}
                        >
                          <SelectTrigger className={`${baseInputClass} text-base`}>
                            <SelectValue placeholder="Select rotation direction" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="clockwise">Clockwise</SelectItem>
                            <SelectItem value="counterclockwise">Counterclockwise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </SettingCard>

                    <SettingCard icon={<Compass className="h-4 w-4" />} title="Orientation">
                      <NumberInput
                        value={startingDegree}
                        onChange={setStartingDegree}
                        min="0"
                        max="360"
                        step="0.1"
                        placeholder="Starting degree"
                        suffix="°"
                        showStepButtons
                      />
                    </SettingCard>
                  </div>

                  {/* Right Column - Advanced Settings */}
                  <div className="col-span-1 space-y-4">
                    <SettingCard icon={<Layers className="h-4 w-4" />} title="Focus Nodes">
                      <NumberInput
                        value={focusNodes}
                        onChange={setFocusNodes}
                        min="1"
                        max="45"
                        placeholder="Number of focus nodes"
                        showStepButtons
                      />
                    </SettingCard>

                    <SettingCard icon={<Scale className="h-4 w-4" />} title="Image Scale & Position">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Scale</Label>
                          <div className="flex items-center gap-2">
                            <Slider
                              value={[parseFloat(imageScale)]}
                              min={0.1}
                              max={2}
                              step={0.01}
                              onValueChange={(value) => setImageScale(value[0].toFixed(2))}
                              className="flex-1"
                            />
                            <NumberInput
                              value={imageScale}
                              onChange={setImageScale}
                              min="0.1"
                              max="2"
                              step="0.01"
                              className="w-20"
                              showStepButtons
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">X Position</Label>
                            <NumberInput
                              value={imageX}
                              onChange={setImageX}
                              placeholder="X position"
                              suffix="%"
                              showStepButtons
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Y Position</Label>
                            <NumberInput
                              value={imageY}
                              onChange={setImageY}
                              placeholder="Y position"
                              suffix="%"
                              showStepButtons
                            />
                          </div>
                        </div>
                      </div>
                    </SettingCard>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="satellites" className="m-0 h-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                  {/* Left Column - Satellite Preview */}
                  <div className="lg:col-span-1">
                    <div className="aspect-square w-full max-w-[300px] mx-auto relative rounded-full overflow-hidden border border-black/10 dark:border-white/20">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3/4 h-3/4 rounded-full border-2 border-black/20 dark:border-white/20 relative">
                          {localSettings.satellites?.map((_, index) => {
                            const angle = (360 / (localSettings.satellites?.length || 1)) * index;
                            const radius = 45; // percentage
                            const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
                            const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
                            return (
                              <div
                                key={index}
                                className="absolute w-3 h-3 bg-black dark:bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"
                                style={{
                                  left: `${x}%`,
                                  top: `${y}%`,
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle and Right Columns - Satellite Settings */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-black dark:text-white">Satellite Configuration</h3>
                      <div className="text-sm text-black/60 dark:text-white/60">
                        {localSettings.satellites?.length || 0} Satellites
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {localSettings.satellites?.map((satellite, index) => (
                        <SettingCard
                          key={satellite.id}
                          icon={
                            <div className="w-6 h-6 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center">
                              <span className="text-xs font-medium text-black dark:text-white">{index + 1}</span>
                            </div>
                          }
                          title={`Satellite ${index + 1}`}
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs text-black/60 dark:text-white/60">Rotation Time</Label>
                              <div className="flex gap-3">
                                <div className="flex-1">
                                  <NumberInput
                                    value={satellite.rotationTime === 0 ? '' : (satellite.rotationTime / 1000).toString()}
                                    onChange={(value) => {
                                      const newSatellites = [...(localSettings.satellites || [])];
                                      const timeInSeconds = value === '' ? 0 : parseInt(value, 10);
                                      newSatellites[index] = {
                                        ...satellite,
                                        rotationTime: timeInSeconds * 1000,
                                      };
                                      setLocalSettings({ ...localSettings, satellites: newSatellites });
                                    }}
                                    placeholder="Enter time"
                                    suffix="sec"
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <div className="grid grid-cols-3 gap-1.5">
                                    <StepButton
                                      onClick={() => {
                                        const newSatellites = [...(localSettings.satellites || [])];
                                        const currentTime = satellite.rotationTime / 1000;
                                        newSatellites[index] = {
                                          ...satellite,
                                          rotationTime: (currentTime + 100) * 1000,
                                        };
                                        setLocalSettings({ ...localSettings, satellites: newSatellites });
                                      }}
                                    >
                                      +100
                                    </StepButton>
                                    <StepButton
                                      onClick={() => {
                                        const newSatellites = [...(localSettings.satellites || [])];
                                        const currentTime = satellite.rotationTime / 1000;
                                        newSatellites[index] = {
                                          ...satellite,
                                          rotationTime: (currentTime + 10) * 1000,
                                        };
                                        setLocalSettings({ ...localSettings, satellites: newSatellites });
                                      }}
                                    >
                                      +10
                                    </StepButton>
                                    <StepButton
                                      onClick={() => {
                                        const newSatellites = [...(localSettings.satellites || [])];
                                        const currentTime = satellite.rotationTime / 1000;
                                        newSatellites[index] = {
                                          ...satellite,
                                          rotationTime: (currentTime + 1) * 1000,
                                        };
                                        setLocalSettings({ ...localSettings, satellites: newSatellites });
                                      }}
                                    >
                                      +1
                                    </StepButton>
                                  </div>
                                  <div className="grid grid-cols-3 gap-1.5">
                                    <StepButton
                                      onClick={() => {
                                        const newSatellites = [...(localSettings.satellites || [])];
                                        const currentTime = satellite.rotationTime / 1000;
                                        newSatellites[index] = {
                                          ...satellite,
                                          rotationTime: Math.max(0, currentTime - 100) * 1000,
                                        };
                                        setLocalSettings({ ...localSettings, satellites: newSatellites });
                                      }}
                                    >
                                      -100
                                    </StepButton>
                                    <StepButton
                                      onClick={() => {
                                        const newSatellites = [...(localSettings.satellites || [])];
                                        const currentTime = satellite.rotationTime / 1000;
                                        newSatellites[index] = {
                                          ...satellite,
                                          rotationTime: Math.max(0, currentTime - 10) * 1000,
                                        };
                                        setLocalSettings({ ...localSettings, satellites: newSatellites });
                                      }}
                                    >
                                      -10
                                    </StepButton>
                                    <StepButton
                                      onClick={() => {
                                        const newSatellites = [...(localSettings.satellites || [])];
                                        const currentTime = satellite.rotationTime / 1000;
                                        newSatellites[index] = {
                                          ...satellite,
                                          rotationTime: Math.max(0, currentTime - 1) * 1000,
                                        };
                                        setLocalSettings({ ...localSettings, satellites: newSatellites });
                                      }}
                                    >
                                      -1
                                    </StepButton>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-black/60 dark:text-white/60">Direction</Label>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm text-black/60 dark:text-white/60">
                                  {satellite.rotationDirection === 'clockwise' ? 'Clockwise' : 'Counterclockwise'}
                                </span>
                                <Switch
                                  checked={satellite.rotationDirection === 'clockwise'}
                                  onCheckedChange={(checked) => {
                                    const newSatellites = [...(localSettings.satellites || [])];
                                    newSatellites[index] = {
                                      ...satellite,
                                      rotationDirection: checked ? 'clockwise' : 'counterclockwise',
                                    };
                                    setLocalSettings({ ...localSettings, satellites: newSatellites });
                                  }}
                                  className="data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=unchecked]:bg-black/20 dark:data-[state=unchecked]:bg-white/20"
                                />
                              </div>
                            </div>
                          </div>
                        </SettingCard>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>

            <div className="p-3 border-t border-black/20 dark:border-white/20 flex justify-end gap-2 sticky bottom-0 bg-white dark:bg-black">
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="bg-white dark:bg-black text-black dark:text-white border border-black/20 dark:border-white/20 hover:bg-black/10 dark:hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => onSave(localSettings)}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
              >
                Save Changes
              </Button>
            </div>
          </Tabs>
        </form>
      </div>
    </div>
  );
}

