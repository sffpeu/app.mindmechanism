'use client'

import { useState } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { Play, BookOpen, ClipboardList, ArrowRight, LogIn, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { HeroParallax } from '../components/ui/hero-parallax'

export default function HomePage() {
  const { theme } = useTheme()
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/signin')
  }

  const products = [
    {
      title: "Mind Mapping",
      link: "/features/mindmap",
      thumbnail:
        "https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?q=80&w=2070&auto=format&fit=crop",
    },
    {
      title: "Task Management",
      link: "/features/tasks",
      thumbnail:
        "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=2072&auto=format&fit=crop",
    },
    {
      title: "Note Taking",
      link: "/features/notes",
      thumbnail:
        "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=2074&auto=format&fit=crop",
    },
    {
      title: "Project Planning",
      link: "/features/projects",
      thumbnail:
        "https://images.unsplash.com/photo-1572177812156-58036aae439c?q=80&w=2070&auto=format&fit=crop",
    },
    {
      title: "Goal Setting",
      link: "/features/goals",
      thumbnail:
        "https://images.unsplash.com/photo-1553034545-32d1a66e769b?q=80&w=2070&auto=format&fit=crop",
    },
    {
      title: "Time Management",
      link: "/features/time",
      thumbnail:
        "https://images.unsplash.com/photo-1584208124888-3a20b9c799e5?q=80&w=2070&auto=format&fit=crop",
    },
    {
      title: "Focus Mode",
      link: "/features/focus",
      thumbnail:
        "https://images.unsplash.com/photo-1489533119213-66a5cd877091?q=80&w=2071&auto=format&fit=crop",
    },
    {
      title: "Analytics",
      link: "/features/analytics",
      thumbnail:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
    },
    {
      title: "Collaboration",
      link: "/features/collaboration",
      thumbnail:
        "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=2070&auto=format&fit=crop",
    },
    {
      title: "Knowledge Base",
      link: "/features/knowledge",
      thumbnail:
        "https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?q=80&w=2068&auto=format&fit=crop",
    },
    {
      title: "AI Assistant",
      link: "/features/ai",
      thumbnail:
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2070&auto=format&fit=crop",
    },
    {
      title: "Integrations",
      link: "/features/integrations",
      thumbnail:
        "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop",
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <Menu 
            showElements={showElements}
            onToggleShow={() => setShowElements(!showElements)}
            showSatellites={showSatellites}
            onSatellitesChange={setShowSatellites}
          />
        </div>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 p-8 mb-8">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-black dark:text-white mb-4">
              Welcome to M13 Mechanism
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl">
              Explore a unique meditation experience with our innovative clock interface. Track your progress, discover insights, and enhance your practice.
            </p>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push('/sessions')}
                className="px-6 py-2.5 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 transition-all text-sm"
              >
                Explore
              </button>
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="px-6 py-2.5 rounded-lg bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all flex items-center gap-2 text-sm text-black dark:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="px-6 py-2.5 rounded-lg bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all flex items-center gap-2 text-sm text-black dark:text-white"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Parallax Hero Section */}
        <div className="relative">
          <HeroParallax products={products} />
          
          {/* Custom Header Override */}
          <div className="absolute top-0 left-0 right-0 z-10 pt-32 px-4">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-4xl md:text-7xl font-bold text-white mb-4">
                1M3 Mindmechanism
              </h1>
              <p className="text-xl md:text-2xl text-white/90 max-w-2xl">
                Your mind. Your mechanism.
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="space-y-8 mt-32">
          <h2 className="text-lg font-semibold text-black dark:text-white">Key Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3">
                <Play className="h-4 w-4 text-black dark:text-white" />
              </div>
              <h3 className="text-base font-medium text-black dark:text-white mb-2">Meditation Clock</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">A unique clock interface designed to enhance your meditation practice.</p>
              <button 
                onClick={() => router.push('/sessions')}
                className="flex items-center gap-1.5 text-xs font-medium text-black dark:text-white group-hover:gap-2 transition-all"
              >
                Learn more
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3">
                <BookOpen className="h-4 w-4 text-black dark:text-white" />
              </div>
              <h3 className="text-base font-medium text-black dark:text-white mb-2">Guided Sessions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Access a library of guided meditation sessions for all levels.</p>
              <button 
                onClick={() => router.push('/sessions')}
                className="flex items-center gap-1.5 text-xs font-medium text-black dark:text-white group-hover:gap-2 transition-all"
              >
                Learn more
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3">
                <ClipboardList className="h-4 w-4 text-black dark:text-white" />
              </div>
              <h3 className="text-base font-medium text-black dark:text-white mb-2">Progress Tracking</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Monitor your meditation journey with detailed insights and statistics.</p>
              <button 
                onClick={() => router.push('/sessions')}
                className="flex items-center gap-1.5 text-xs font-medium text-black dark:text-white group-hover:gap-2 transition-all"
              >
                Learn more
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 