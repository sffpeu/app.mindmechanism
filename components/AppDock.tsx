'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LayoutDashboard,
  Clock,
  ClipboardList,
  BookOpen,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/dock';
import { useTheme } from '@/app/ThemeContext';
import { useState } from 'react';
import { SettingsDialog } from '@/components/settings/SettingsDialog';

const navItems = [
  { title: 'Home', href: '/layers', icon: Home },
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Sessions', href: '/sessions', icon: Clock },
  { title: 'Notes', href: '/notes', icon: ClipboardList },
  { title: 'Glossary', href: '/glossary', icon: BookOpen },
];

export function AppDock() {
  const pathname = usePathname();
  const { isDarkMode, setIsDarkMode } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <div className="fixed left-0 top-0 bottom-0 z-[999] flex items-center pointer-events-none pl-3">
        <div className="pointer-events-auto">
          <Dock orientation="vertical" className="items-start">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <DockItem
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
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
