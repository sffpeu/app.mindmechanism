"use client";
import React from "react";
import { HeroParallax } from "./components/ui/hero-parallax";
import Link from "next/link";

export default function Home() {
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
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-black/50 backdrop-blur-md">
        <button className="text-white hover:text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link href="/signin" className="px-6 py-2 rounded-full bg-white text-black hover:bg-gray-200 transition-colors">
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
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
    </div>
  );
}

