'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  LayoutDashboard,
  Clock,
  ClipboardList,
  BookOpen,
  Info,
  Settings,
  Sun,
  Moon,
  Maximize2,
  LayoutGrid,
  Minimize2,
} from 'lucide-react';
import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/dock';
import { useTheme } from '@/app/ThemeContext';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { AppInfoOverlay } from '@/components/AppInfoOverlay';
import { useAuth } from '@/lib/FirebaseAuthContext';
import { useFullscreen } from '@/lib/hooks/useFullscreen';
import { useIdleFade } from '@/lib/hooks/useIdleFade';
import { cn } from '@/lib/utils';

function isPublicAuthPath(pathname: string | null) {
  if (!pathname) return true;
  if (pathname === '/' || pathname === '/home' || pathname === '/home/') return true;
  return pathname.startsWith('/auth/');
}

/** Horizontal center of dock icons: pl-3 + Dock mx-2 + half of vertical rail width (see `panelHeight` on Dock, default 64) */
const DOCK_ICON_CENTER_LEFT = 'calc(0.75rem + 0.5rem + 32px)'

const navItems = [
  { title: 'Home', href: '/layers', icon: Home },
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Sessions', href: '/sessions', icon: Clock },
  { title: 'Notes', href: '/notes', icon: ClipboardList },
  { title: 'Glossary', href: '/glossary', icon: BookOpen },
  { title: 'Deck', href: '/deck', icon: LayoutGrid },
];

export function AppDock() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isDarkMode, setIsDarkMode } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isFullscreen, toggle: toggleFullscreen, supported: fullscreenSupported } = useFullscreen();

  useEffect(() => {
    setMounted(true);
  }, []);

  const showDock =
    !isPublicAuthPath(pathname) && (loading || user !== null);

  const isClockPage = /^\/[0-8]$/.test(pathname ?? '')
  const { isIdle } = useIdleFade()

  const dockUi = (
    <>
      {/* Above clock DotNavigation (z-[10000]) so main nav stays clickable during sessions */}
      <div className={cn(
        "fixed left-0 top-0 bottom-0 z-[12000] flex flex-col items-start justify-center pointer-events-none pl-3 transition-opacity duration-700",
        isClockPage && isIdle && "opacity-0 pointer-events-none"
      )}>
        {/* Broadcast pill slot — clock pages portal SessionPresenceBroadcast here */}
        <div id="dock-broadcast-slot" className="pointer-events-auto" />
        <div className="pointer-events-auto">
          <Dock orientation="vertical" className="items-start">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className="inline-flex rounded-full no-underline text-inherit outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2 dark:focus-visible:ring-white/40"
                  aria-label={item.title}
                  onClick={(e) => {
                    if (e.button !== 0) return;
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                    e.preventDefault();
                    router.push(item.href);
                  }}
                >
                  <DockItem
                    asNavSlot
                    className={`aspect-square rounded-full transition-colors ${
                      isActive
                        ? 'bg-black dark:bg-white'
                        : 'bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <DockLabel>{item.title}</DockLabel>
                    <DockIcon>
                      <Icon
                        className={`h-full w-full ${
                          isActive
                            ? 'text-white dark:text-black'
                            : 'text-neutral-600 dark:text-neutral-300'
                        }`}
                      />
                    </DockIcon>
                  </DockItem>
                </Link>
              );
            })}
            {/* Settings */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setIsSettingsOpen(true);
              }}
              className="outline-none border-none cursor-pointer no-underline"
              aria-label="Open settings"
            >
              <DockItem className="aspect-square rounded-full bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700">
                <DockLabel>Settings</DockLabel>
                <DockIcon>
                  <Settings className="h-full w-full text-neutral-600 dark:text-neutral-300" />
                </DockIcon>
              </DockItem>
            </a>
            {fullscreenSupported ? (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  void toggleFullscreen();
                }}
                className="outline-none border-none cursor-pointer no-underline"
                aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
              >
                <DockItem className="aspect-square rounded-full bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700">
                  <DockLabel>{isFullscreen ? 'Exit full screen' : 'Full screen'}</DockLabel>
                  <DockIcon>
                    {isFullscreen ? (
                      <Minimize2 className="h-full w-full text-neutral-600 dark:text-neutral-300" />
                    ) : (
                      <Maximize2 className="h-full w-full text-neutral-600 dark:text-neutral-300" />
                    )}
                  </DockIcon>
                </DockItem>
              </a>
            ) : null}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setIsDarkMode(!isDarkMode);
              }}
              className="outline-none border-none cursor-pointer no-underline"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <DockItem className="aspect-square rounded-full bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700">
                <DockLabel>{isDarkMode ? 'Light mode' : 'Dark mode'}</DockLabel>
                <DockIcon>
                  {isDarkMode ? (
                    <Sun className="h-full w-full text-neutral-600 dark:text-neutral-300" />
                  ) : (
                    <Moon className="h-full w-full text-neutral-600 dark:text-neutral-300" />
                  )}
                </DockIcon>
              </DockItem>
            </a>
          </Dock>
        </div>
      </div>
      {/* Info — top of screen, aligned with dock icon column; never idle-fades */}
      <button
        type="button"
        onClick={() => setIsInfoOpen(true)}
        aria-label="App information"
        className={cn(
          'fixed top-4 z-[12001] flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full shadow-md ring-2 ring-black/10 transition-all duration-200',
          'bg-gray-200 text-neutral-800 hover:bg-gray-300 hover:ring-black/15',
          'dark:bg-neutral-800 dark:text-neutral-100 dark:ring-white/20 dark:hover:bg-neutral-700 dark:hover:ring-white/30',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900'
        )}
        style={{ left: DOCK_ICON_CENTER_LEFT }}
      >
        <Info className="h-5 w-5" aria-hidden />
      </button>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <AppInfoOverlay
        clockHex="#8b5cf6"
        open={isInfoOpen}
        onOpenChange={setIsInfoOpen}
      />
    </>
  );

  if (!showDock) {
    return null;
  }

  if (typeof document === 'undefined' || !mounted) {
    return dockUi;
  }
  return createPortal(dockUi, document.body);
}
