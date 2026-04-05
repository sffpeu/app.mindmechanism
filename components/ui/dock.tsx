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
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEventHandler,
} from 'react';
import { createPortal } from 'react-dom';
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
  /** Spring size at rest (magnification is peak size on hover). Default 40. */
  minItemSize?: number;
  spring?: SpringOptions;
  orientation?: 'horizontal' | 'vertical';
  /** Vertical dock only: `left` = default (AppDock); `right` = mirrored strip on screen edge so tooltips open toward center. */
  dockEdge?: 'left' | 'right';
};
type DockItemProps = {
  className?: string;
  children: React.ReactNode;
  style?: CSSProperties;
  /** When true, omit button semantics so the item can sit inside a link or act as a plain control. */
  asNavSlot?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
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
  minItemSize: number;
  distance: number;
  orientation: 'horizontal' | 'vertical';
  dockEdge: 'left' | 'right';
};
type DockProviderProps = {
  children: React.ReactNode;
  value: DocContextType;
};

const DockContext = createContext<DocContextType | undefined>(undefined);

const DockItemRefContext = createContext<React.RefObject<HTMLDivElement | null> | null>(null);

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
  minItemSize = 40,
  orientation = 'horizontal',
  dockEdge = 'left',
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const mouseY = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(() => {
    const hoverBreadth = magnification + magnification / 2 + 4;
    const padded = Math.max(hoverBreadth, panelHeight * 2);
    if (orientation === 'vertical') {
      return padded;
    }
    return Math.max(DOCK_HEIGHT, padded);
  }, [magnification, panelHeight, orientation]);

  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  const isVertical = orientation === 'vertical';
  const verticalOuterAlign = isVertical && dockEdge === 'right' ? 'items-end' : 'items-start';

  return (
    <motion.div
      style={{
        ...(isVertical ? { width: height } : { height: height }),
        scrollbarWidth: 'none',
      }}
      className={cn(
        'mx-2 flex',
        isVertical
          ? cn('flex-col max-h-full overflow-visible', verticalOuterAlign)
          : 'max-w-full items-end overflow-x-auto overflow-y-auto'
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
        <DockProvider
          value={{
            mouseX,
            mouseY,
            spring,
            distance,
            magnification,
            minItemSize,
            orientation,
            dockEdge,
          }}
        >
          {children}
        </DockProvider>
      </motion.div>
    </motion.div>
  );
}

function DockItem({ children, className, style, asNavSlot, onClick }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { distance, magnification, minItemSize, mouseX, mouseY, spring, orientation, dockEdge } =
    useDock();
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
    [minItemSize, magnification, minItemSize]
  );

  const size = useSpring(sizeTransform, spring);

  return (
    <DockItemRefContext.Provider value={ref}>
      <motion.div
        ref={ref}
        style={{
          ...(isVertical ? { height: size } : { width: size }),
          ...style,
        }}
        onHoverStart={() => isHovered.set(1)}
        onHoverEnd={() => isHovered.set(0)}
        onFocus={() => !asNavSlot && isHovered.set(1)}
        onBlur={() => !asNavSlot && isHovered.set(0)}
        onClick={onClick}
        className={cn(
          'relative inline-flex items-center justify-center shrink-0',
          asNavSlot && onClick && 'cursor-pointer',
          isVertical ? 'w-full' : '',
          className
        )}
        tabIndex={asNavSlot ? undefined : 0}
        role={asNavSlot ? undefined : 'button'}
        aria-haspopup={asNavSlot ? undefined : 'true'}
      >
        {Children.map(children, (child) =>
          cloneElement(child as React.ReactElement, {
            width: size,
            isHovered,
            orientation,
            dockEdge,
          })
        )}
      </motion.div>
    </DockItemRefContext.Provider>
  );
}

const TOOLTIP_Z = 2147483000;

const labelTooltipClass = (className?: string) =>
  cn(
    'w-fit max-w-[min(240px,calc(100vw-3rem))] overflow-visible whitespace-normal break-words rounded-md border border-gray-200 bg-gray-100 px-2 py-1 text-xs text-neutral-700 shadow-md dark:border-neutral-900 dark:bg-neutral-800 dark:text-white',
    className
  );

function DockLabel({ children, className, ...rest }: DockLabelProps) {
  const restProps = rest as Record<string, unknown>;
  const isHovered = restProps['isHovered'] as MotionValue<number>;
  const orientation = restProps['orientation'] as 'horizontal' | 'vertical' | undefined;
  const dockEdge = (restProps['dockEdge'] as 'left' | 'right' | undefined) ?? 'left';
  const [isVisible, setIsVisible] = useState(false);
  const isVertical = orientation === 'vertical';
  const labelOnRight = isVertical && dockEdge === 'left';
  const labelOnLeft = isVertical && dockEdge === 'right';
  const itemRef = useContext(DockItemRefContext);
  const [portalPos, setPortalPos] = useState<{ top: number; left: number } | null>(null);
  const usePortal = Boolean(labelOnLeft && itemRef);

  useEffect(() => {
    if (!isHovered) return;
    const unsubscribe = isHovered.on('change', (latest) => {
      setIsVisible(latest === 1);
    });

    return () => unsubscribe();
  }, [isHovered]);

  const updatePortalPosition = () => {
    if (!itemRef?.current || !usePortal) return;
    const rect = itemRef.current.getBoundingClientRect();
    setPortalPos({
      top: rect.top + rect.height / 2,
      left: rect.left - 8,
    });
  };

  useLayoutEffect(() => {
    if (!usePortal) return;
    if (!isVisible) return;
    updatePortalPosition();
    const onScrollOrResize = () => updatePortalPosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [isVisible, usePortal, itemRef]);

  const inlineLabel = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{
            opacity: 0,
            x: isVertical ? (labelOnRight ? 10 : -10) : 0,
            y: isVertical ? 0 : 10,
          }}
          animate={{
            opacity: 1,
            x: 0,
            y: isVertical ? 0 : -10,
          }}
          exit={{
            opacity: 0,
            x: isVertical ? (labelOnRight ? 10 : -10) : 0,
            y: isVertical ? 0 : 0,
          }}
          transition={{ duration: 0.2 }}
          className={cn(
            'absolute z-[1000]',
            labelTooltipClass(className),
            labelOnRight && 'left-full ml-2 top-1/2 -translate-y-1/2',
            !isVertical && '-top-6 left-1/2'
          )}
          role='tooltip'
          style={isVertical ? undefined : { x: '-50%' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (usePortal) {
    if (typeof document === 'undefined') return null;
    return createPortal(
      <AnimatePresence>
        {isVisible && portalPos && (
          <motion.div
            key='dock-tooltip'
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.2 }}
            className={labelTooltipClass(className)}
            style={{
              position: 'fixed',
              top: portalPos.top,
              left: portalPos.left,
              transform: 'translate(-100%, -50%)',
              zIndex: TOOLTIP_Z,
            }}
            role='tooltip'
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );
  }

  return inlineLabel;
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
