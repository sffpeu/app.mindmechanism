import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, MotionStyle } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface FocusNodeProps {
  index: number;
  angle: number;
  nodeRadius: number;
  isSelected: boolean;
  word?: string;
  clockId: number;
  isMultiView: boolean;
  onClick: () => void;
  selectedNodeIndex: number | null;
  rotation: number;
}

const FocusNode: React.FC<FocusNodeProps> = ({
  index,
  angle,
  nodeRadius,
  isSelected,
  word,
  clockId,
  isMultiView,
  onClick,
  selectedNodeIndex,
  rotation
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const radians = angle * (Math.PI / 180);
  const x = 50 + nodeRadius * Math.cos(radians);
  const y = 50 + nodeRadius * Math.sin(radians);

  // Calculate the absolute position considering rotation
  const getNodeStyle = useCallback(() => {
    return {
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      width: '24px',
      height: '24px',
      transform: `translate(-50%, -50%)`,
      cursor: 'pointer',
      zIndex: isSelected || isHovered ? 100 : 50,
    } as const;
  }, [x, y, isSelected, isHovered]);

  // Calculate word position
  const getWordStyle = useCallback((): MotionStyle => {
    const wordAngle = angle + rotation;
    const isLeft = wordAngle > 90 && wordAngle < 270;
    return {
      position: 'absolute' as const,
      left: isLeft ? 'auto' : '100%',
      right: isLeft ? '100%' : 'auto',
      top: '50%',
      transform: 'translateY(-50%)',
      marginLeft: isLeft ? '0' : '8px',
      marginRight: isLeft ? '8px' : '0',
      whiteSpace: 'nowrap',
    };
  }, [angle, rotation]);

  return (
    <motion.div
      className="focus-node"
      style={getNodeStyle()}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ scale: 1.2 }}
    >
      {/* Debug visualization for hover area */}
      <div 
        className="absolute inset-0 rounded-full opacity-10 bg-blue-500 dark:bg-blue-400"
        style={{
          transform: 'scale(2)',
          pointerEvents: 'none'
        }}
      />
      
      {/* Actual node */}
      <motion.div
        className={cn(
          "absolute left-1/2 top-1/2 w-3 h-3 rounded-full",
          "transform -translate-x-1/2 -translate-y-1/2",
          "bg-black dark:bg-white",
          isSelected || isHovered ? "scale-125" : ""
        )}
        animate={{
          scale: isSelected || isHovered ? 1.25 : 1,
          opacity: isSelected || isHovered ? 1 : 0.8,
        }}
        transition={{ duration: 0.2 }}
      />

      {/* Word tooltip */}
      <AnimatePresence>
        {(isHovered || isSelected) && word && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute px-2 py-1 rounded-full text-xs font-medium 
                     bg-white/90 dark:bg-black/90 backdrop-blur-sm shadow-sm 
                     outline outline-1 outline-black/10 dark:outline-white/20"
            style={getWordStyle()}
          >
            <span className="text-black/90 dark:text-white/90">{word}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Clock: React.FC<{
  id?: number;
  focusNodes?: number;
  customWords?: string[];
  showWords?: boolean;
  rotation?: number;
  imageX?: number;
  imageY?: number;
  imageScale?: number;
  imageOrientation?: number;
  isMultiView?: boolean;
}> = ({
  id = 1,
  focusNodes = 0,
  customWords = [],
  showWords = true,
  rotation = 0,
  imageX = 0,
  imageY = 0,
  imageScale = 1,
  imageOrientation = 0,
  isMultiView = false,
}) => {
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);
  const [hoveredNodeIndex, setHoveredNodeIndex] = useState<number | null>(null);

  const handleNodeClick = (index: number) => {
    setSelectedNodeIndex(index === selectedNodeIndex ? null : index);
  };

  const getNodeRadius = (clockId: number, isMultiView: boolean) => {
    return isMultiView ? 45 : 55; // Increased radius for better spacing
  };

  const getImagePath = (id: number) => {
    return `/clock${id}.svg`;
  };

  return (
    <div className="relative w-[82vw] h-[82vw] max-w-[615px] max-h-[615px]">
      {/* Base clock layer */}
      <div className="absolute inset-0 rounded-full overflow-hidden" style={{ zIndex: 1 }}>
        <motion.div 
          className="absolute inset-0"
          animate={{ rotate: rotation }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${imageX}%, ${imageY}%) rotate(${imageOrientation}deg) scale(${imageScale})`,
              transformOrigin: 'center',
            }}
          >
            <Image 
              src={getImagePath(id)}
              alt={`Clock Face ${id}`}
              layout="fill"
              objectFit="cover"
              className="rounded-full dark:invert"
              priority
            />
          </div>
        </motion.div>
      </div>

      {/* Nodes layer with improved interaction */}
      <div 
        className="absolute inset-0 transform-gpu"
        style={{ 
          zIndex: 10,
          transformStyle: 'preserve-3d',
          perspective: '1000px'
        }}
      >
        <motion.div 
          className="absolute inset-0"
          animate={{ rotate: rotation }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <div 
            className="absolute inset-0"
            style={{ 
              transform: `rotate(${imageOrientation}deg)`,
              transformStyle: 'preserve-3d'
            }}
          >
            {Array.from({ length: Math.max(0, focusNodes) }).map((_, index) => {
              const angle = ((360 / Math.max(1, focusNodes)) * index) % 360;
              return (
                <FocusNode
                  key={`${id}-${index}`}
                  index={index}
                  angle={angle}
                  nodeRadius={getNodeRadius(id, isMultiView)}
                  isSelected={selectedNodeIndex === index}
                  word={showWords ? customWords?.[index] : undefined}
                  clockId={id}
                  isMultiView={isMultiView}
                  onClick={() => handleNodeClick(index)}
                  selectedNodeIndex={selectedNodeIndex}
                  rotation={rotation}
                />
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Clock; 