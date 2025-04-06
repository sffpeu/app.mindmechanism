"use client"

import { useState } from "react"
import { Sidebar, SidebarBody, SidebarLink } from "./ui/sidebar"
import { useTheme } from "@/app/ThemeContext"
import { useAuth } from "@/lib/FirebaseAuthContext"
import { useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Settings, List, Info, Satellite, Clock, Calendar, RotateCw, Timer, Compass, HelpCircle, Book, LogOut, User } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"

export function Menu() {
  const { isDarkMode } = useTheme()
  const { user } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <Clock className="h-5 w-5 shrink-0 text-black dark:text-white" />,
    },
    {
      label: "Sessions",
      href: "/sessions",
      icon: <Timer className="h-5 w-5 shrink-0 text-black dark:text-white" />,
    },
    {
      label: "Profile",
      href: "/profile",
      icon: <User className="h-5 w-5 shrink-0 text-black dark:text-white" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5 shrink-0 text-black dark:text-white" />,
    },
    {
      label: "Logout",
      href: "#",
      icon: <LogOut className="h-5 w-5 shrink-0 text-black dark:text-white" />,
    },
  ]

  return (
    <div className="fixed left-0 top-0 z-50 h-full">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={link}
                  onClick={link.label === "Logout" ? handleSignOut : undefined}
                />
              ))}
            </div>
          </div>
          {user && (
            <div>
              <SidebarLink
                link={{
                  label: user.displayName || user.email || "User",
                  href: "/profile",
                  icon: (
                    <div className="h-7 w-7 shrink-0 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                      <User className="h-4 w-4 text-black dark:text-white" />
                    </div>
                  ),
                }}
              />
            </div>
          )}
        </SidebarBody>
      </Sidebar>
    </div>
  )
}

const Logo = () => {
  return (
    <Link
      href="/"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black dark:text-white"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-black dark:text-white"
      >
        Mind Mechanism
      </motion.span>
    </Link>
  )
}

const LogoIcon = () => {
  return (
    <Link
      href="/"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black dark:text-white"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
    </Link>
  )
} 