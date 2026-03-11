'use client';

import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence,
} from 'framer-motion';
import {
  Children,
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';

const DOCK_HEIGHT = 128;
const DEFAULT_MAGNIFICATION = 80;
const DEFAULT_DISTANCE = 150;
const DEFAULT_PANEL_HEIGHT = 64;

type DockProps = {
  children: React.ReactNode;
  className?: string;
  distance?: number;
  panelHeight?: number;
  magnification?: number;
  spring?: SpringOptions;
  orientation?: 'horizontal' | 'vertical';
};
type DockItemProps = {
  className?: string;
  children: React.ReactNode;
};
type DockLabelProps = {
  className?: string;
  children: React.ReactNode;
};
type DockIconProps = {
  className?: string;
  children: React.ReactNode;
};

type DocContextType = {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  spring: SpringOptions;
  magnification: number;
  distance: number;
  orientation: 'horizontal' | 'vertical';
};
type DockProviderProps = {
  children: React.ReactNode;
  value: DocContextType;
};

const DockContext = createContext<DocContextType | undefined>(undefined);

function DockProvider({ children, value }: DockProviderProps) {
  return <DockContext.Provider value={value}>{children}</DockContext.Provider>;
}

function useDock() {
  const context = useContext(DockContext);
  if (!context) {
    throw new Error('useDock must be used within an DockProvider');
  }
  return context;
}

function Dock({
  children,
  className,
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  panelHeight = DEFAULT_PANEL_HEIGHT,
  orientation = 'horizontal',
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const mouseY = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(() => {
    return Math.max(DOCK_HEIGHT, magnification + magnification / 2 + 4);
  }, [magnification]);

  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  const isVertical = orientation === 'vertical';

  return (
    <motion.div
      style={{
        ...(isVertical ? { width: height } : { height: height }),
        scrollbarWidth: 'none',
      }}
      className={cn(
        'mx-2 flex',
        isVertical ? 'flex-col items-start max-h-full overflow-visible' : 'max-w-full items-end overflow-x-auto overflow-y-auto'
      )}
    >
      <motion.div
        onMouseMove={({ pageX, pageY }) => {
          isHovered.set(1);
          mouseX.set(pageX);
          mouseY.set(pageY);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
          mouseY.set(Infinity);
        }}
        className={cn(
          'flex gap-4 rounded-2xl px-4',
          isVertical && 'flex-col py-4 w-fit overflow-visible',
          !isVertical && 'mx-auto w-fit',
          className
        )}
        style={isVertical ? { width: panelHeight } : { height: panelHeight }}
        role='toolbar'
        aria-label='Application dock'
      >
        <DockProvider value={{ mouseX, mouseY, spring, distance, magnification, orientation }}>
          {children}
        </DockProvider>
      </motion.div>
    </motion.div>
  );
}

function DockItem({ children, className }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { distance, magnification, mouseX, mouseY, spring, orientation } = useDock();
  const isVertical = orientation === 'vertical';

  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(
    isVertical ? mouseY : mouseX,
    (val) => {
      const domRect = ref.current?.getBoundingClientRect() ?? { x: 0, y: 0, width: 0, height: 0 };
      if (isVertical) {
        return val - domRect.y - domRect.height / 2;
      }
      return val - domRect.x - domRect.width / 2;
    }
  );

  const sizeTransform = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [40, magnification, 40]
  );

  const size = useSpring(sizeTransform, spring);

  return (
    <motion.div
      ref={ref}
      style={isVertical ? { height: size } : { width: size }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      className={cn(
        'relative inline-flex items-center justify-center shrink-0',
        isVertical ? 'w-full' : '',
        className
      )}
      tabIndex={0}
      role='button'
      aria-haspopup='true'
    >
      {Children.map(children, (child) =>
        cloneElement(child as React.ReactElement, { width: size, isHovered, orientation })
      )}
    </motion.div>
  );
}

function DockLabel({ children, className, ...rest }: DockLabelProps) {
  const restProps = rest as Record<string, unknown>;
  const isHovered = restProps['isHovered'] as MotionValue<number>;
  const orientation = restProps['orientation'] as 'horizontal' | 'vertical' | undefined;
  const [isVisible, setIsVisible] = useState(false);
  const isVertical = orientation === 'vertical';

  useEffect(() => {
    if (!isHovered) return;
    const unsubscribe = isHovered.on('change', (latest) => {
      setIsVisible(latest === 1);
    });

    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: isVertical ? 10 : 0, y: isVertical ? 0 : 10 }}
          animate={{ opacity: 1, x: isVertical ? 0 : 0, y: isVertical ? 0 : -10 }}
          exit={{ opacity: 0, x: isVertical ? 10 : 0, y: isVertical ? 0 : 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'absolute z-[1000] w-fit max-w-[200px] whitespace-normal rounded-md border border-gray-200 bg-gray-100 px-2 py-1 text-xs text-neutral-700 shadow-md dark:border-neutral-900 dark:bg-neutral-800 dark:text-white',
            isVertical ? 'left-full ml-2 top-1/2 -translate-y-1/2' : '-top-6 left-1/2',
            className
          )}
          role='tooltip'
          style={isVertical ? undefined : { x: '-50%' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className, ...rest }: DockIconProps) {
  const restProps = rest as Record<string, unknown>;
  const width = restProps['width'] as MotionValue<number>;
  const orientation = restProps['orientation'] as 'horizontal' | 'vertical' | undefined;
  const isVertical = orientation === 'vertical';

  const sizeTransform = useTransform(width, (val) => val / 2);

  return (
    <motion.div
      style={isVertical ? { height: sizeTransform } : { width: sizeTransform }}
      className={cn('flex items-center justify-center', className)}
    >
      {children}
    </motion.div>
  );
}

export { Dock, DockIcon, DockItem, DockLabel };
