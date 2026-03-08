'use client';

import { CircleMenu } from '@/components/ui/circle-menu';
import {
  Home,
  LayoutDashboard,
  Clock,
  ClipboardList,
  BookOpen,
  Settings
} from 'lucide-react';

const menuItems = [
  { label: 'Home', icon: <Home size={16} />, href: '/home' },
  { label: 'Dashboard', icon: <LayoutDashboard size={16} />, href: '/dashboard' },
  { label: 'Sessions', icon: <Clock size={16} />, href: '/sessions' },
  { label: 'Notes', icon: <ClipboardList size={16} />, href: '/notes' },
  { label: 'Glossary', icon: <BookOpen size={16} />, href: '/glossary' },
  { label: 'Settings', icon: <Settings size={16} />, href: '/settings' }
];

export function BottomCircleMenu() {
  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none z-[100]">
      <div className="pointer-events-auto">
        <CircleMenu items={menuItems} />
      </div>
    </div>
  );
}
