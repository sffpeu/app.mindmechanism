import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

interface DotNavigationProps {
  activeDot: number;
  isSmallMultiView?: boolean;
  onOutlinedDotClick?: () => void;
  onDotHover?: (index: number | null) => void;
}

// Clock 1–9 hex palette (match Clock.tsx, glossary, sessions)
const DOT_HEX = ['#fd290a', '#fba63b', '#f7da5f', '#6dc037', '#156fde', '#941952', '#541b96', '#ee5fa7', '#56c1ff'] as const;

const dotColors = DOT_HEX.map(
  (hex) => `bg-transparent border-[${hex}] dark:border-[${hex}]`
);
const dotColorsFilled = DOT_HEX.map(
  (hex) => `bg-[${hex}] border-[${hex}] dark:bg-[${hex}] dark:border-[${hex}]`
);

const DotNavigation: React.FC<DotNavigationProps> = ({
  activeDot, 
  isSmallMultiView = false,
  onOutlinedDotClick,
  onDotHover
}) => {
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isSessionsPage = pathname === '/sessions';

  useEffect(() => {
    if (isSessionsPage) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [isSessionsPage]);

  const handleDotClick = (index: number) => {
    if (index === 9) {
      // Navigate to multiview/1 when clicking the last dot
      router.push('/multiview/1');
      return;
    }
    router.push(`/${index}`);
  };

  const Container = isSessionsPage ? motion.div : 'div';
  const DotContainer = isSessionsPage ? motion.div : 'div';

  return (
    <Container 
      initial={isSessionsPage ? { x: 50, opacity: 0 } : undefined}
      animate={isSessionsPage ? { 
        x: isVisible ? 0 : 50,
        opacity: isVisible ? 1 : 0 
      } : undefined}
      transition={isSessionsPage ? { 
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      } : undefined}
      className="fixed right-8 top-[55%] -translate-y-1/2 flex flex-col space-y-3 z-[999] pointer-events-auto"
    >
      {Array.from({ length: 10 }).map((_, index) => (
        <DotContainer 
          key={index} 
          className="flex items-center justify-end gap-1.5 group relative pointer-events-auto"
          initial={isSessionsPage ? { x: 25, opacity: 0 } : undefined}
          animate={isSessionsPage ? { 
            x: isVisible ? 0 : 25,
            opacity: isVisible ? 1 : 0 
          } : undefined}
          transition={isSessionsPage ? { 
            duration: 0.5,
            delay: 0.1 + index * 0.05,
            ease: [0.16, 1, 0.3, 1]
          } : undefined}
          onMouseEnter={() => {
            setHoveredDot(index);
            onDotHover?.(index);
          }}
          onMouseLeave={() => {
            setHoveredDot(null);
            onDotHover?.(null);
          }}
          onTouchStart={() => {
            setHoveredDot(index);
            onDotHover?.(index);
          }}
          onTouchEnd={() => {
            setHoveredDot(null);
            onDotHover?.(null);
          }}
        >
          {index === 9 && activeDot === 9 && (
            <button
              onClick={() => router.push('/multiview/2')}
              className={`w-4 h-4 rounded-full border-2 border-black dark:border-white transition-all duration-200 hover:scale-150 opacity-0 group-hover:opacity-100 ${
                isSmallMultiView ? 'bg-black dark:bg-white' : 'bg-transparent'
              } touch-manipulation pointer-events-auto`}
            />
          )}
          <button
            onClick={() => handleDotClick(index)}
            className={`w-4 h-4 rounded-full transition-all duration-200 transform hover:scale-150 border-2 ${
              index === 9
                ? 'bg-black dark:bg-white border-black dark:border-white'
                : index === activeDot
                  ? dotColorsFilled[index]
                  : hoveredDot === index
                    ? dotColorsFilled[index]
                    : dotColors[index]
            } touch-manipulation pointer-events-auto`}
          />
        </DotContainer>
      ))}
    </Container>
  );
}

export default DotNavigation;

