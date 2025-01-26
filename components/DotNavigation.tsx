import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface DotNavigationProps {
  activeDot: number;
  isSmallMultiView?: boolean;
  onOutlinedDotClick?: () => void;
}

const dotColors = [
  'bg-transparent border-[#fd290a] dark:border-[#fd290a]', // 1. Red
  'bg-transparent border-[#fba63b] dark:border-[#fba63b]', // 2. Orange
  'bg-transparent border-[#f7da5f] dark:border-[#f7da5f]', // 3. Yellow
  'bg-transparent border-[#6dc037] dark:border-[#6dc037]', // 4. Green
  'bg-transparent border-[#156fde] dark:border-[#156fde]', // 5. Blue
  'bg-transparent border-[#941952] dark:border-[#941952]', // 6. Dark Pink
  'bg-transparent border-[#541b96] dark:border-[#541b96]', // 7. Purple
  'bg-transparent border-[#ee5fa7] dark:border-[#ee5fa7]', // 8. Pink
  'bg-transparent border-[#56c1ff] dark:border-[#56c1ff]', // 9. Light Blue
];

const DotNavigation: React.FC<DotNavigationProps> = ({
  activeDot, 
  isSmallMultiView = false,
  onOutlinedDotClick 
}) => {
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500); // 500ms delay before showing

    return () => clearTimeout(timer);
  }, []);

  const handleDotClick = (index: number) => {
    if (index === 9) {
      // Handle multiview navigation
      if (activeDot === 9) {
        // Toggle between multiview 1 and 2
        router.push(isSmallMultiView ? '/multiview/1' : '/multiview/2');
      } else {
        // Go to multiview 1
        router.push('/multiview/1');
      }
      return;
    }
    router.push(`/clock/${index}`);
  };

  return (
    <motion.div 
      initial={{ x: 100, opacity: 0 }}
      animate={{ 
        x: isVisible ? 0 : 100,
        opacity: isVisible ? 1 : 0
      }}
      transition={{ 
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="fixed right-8 top-1/2 -translate-y-1/2 flex flex-col space-y-3"
    >
      {Array.from({ length: 10 }).map((_, index) => (
        <motion.div 
          key={index} 
          className="flex items-center justify-end gap-2"
          initial={{ x: 50, opacity: 0 }}
          animate={{ 
            x: isVisible ? 0 : 50,
            opacity: isVisible ? 1 : 0
          }}
          transition={{ 
            duration: 0.5,
            delay: 0.1 + index * 0.05,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {index === 9 && activeDot === 9 && (
            <button
              onClick={() => router.push(isSmallMultiView ? '/multiview/1' : '/multiview/2')}
              className={`w-3.5 h-3.5 rounded-full border-2 border-black dark:border-white transition-all duration-200 hover:scale-150 ${
                isSmallMultiView ? 'bg-black dark:bg-white' : 'bg-transparent'
              }`}
            />
          )}
          <button
            onClick={() => handleDotClick(index)}
            onMouseEnter={() => setHoveredDot(index)}
            onMouseLeave={() => setHoveredDot(null)}
            className={`w-3.5 h-3.5 rounded-full transition-all duration-200 transform hover:scale-150 border-2 ${
              index === 9
                ? 'bg-black dark:bg-white border-black dark:border-white'
                : index === activeDot
                  ? dotColors[index]
                  : hoveredDot === index
                    ? dotColors[index]
                    : 'bg-transparent border-gray-300 dark:border-gray-600'
            }`}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

export default DotNavigation;

