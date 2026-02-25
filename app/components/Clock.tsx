import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const Clock: React.FC = () => {
  const isMultiView = false;
  const isMultiView2 = false;

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
      </motion.div>
    );
  }

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
    </motion.div>
  );
};

export default Clock; 