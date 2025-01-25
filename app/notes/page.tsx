'use client'

import { useState } from 'react'
import { Menu } from '@/components/Menu'
import { Card } from '@/components/ui/card'
import { RotateCcw, PenLine, Files } from 'lucide-react'
import { useTheme } from '@/app/ThemeContext'
import { Logo } from '@/components/Logo'

interface Note {
  title: string
  content: string
  date: string
}

export default function NotesPage() {
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const { isDarkMode } = useTheme()

  // Example sessions - replace with actual data
  const sessions = [
    { title: "Galileo's First Observation", date: '20/01/2025' },
    { title: "Galileo's First Observation", date: '20/01/2025' },
  ]

  // Example saved notes - replace with actual data
  const savedNotes: Note[] = []

  const handleSaveNote = () => {
    // Implement note saving functionality
    console.log('Saving note:', { title: noteTitle, content: noteContent })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      <Logo />
      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
      />

      <main className="container mx-auto p-4 md:p-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Select Session Card */}
          <Card className="p-4 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-black/10 dark:border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-black dark:text-white">Select Session</h2>
              <RotateCcw className="h-5 w-5 text-black/50 dark:text-white/50" />
            </div>
            <div className="space-y-3">
              {sessions.map((session, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedSession(session.title)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedSession === session.title
                      ? 'bg-black/5 dark:bg-white/10'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <h3 className="text-red-500 dark:text-red-400 font-medium">{session.title}</h3>
                  <p className="text-sm text-black/50 dark:text-white/50">{session.date}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Write Note Card */}
          <Card className="p-4 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-black/10 dark:border-white/20 md:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-black dark:text-white">Write Note</h2>
              <PenLine className="h-5 w-5 text-black/50 dark:text-white/50" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 rounded-lg p-3">
                <input
                  type="text"
                  placeholder="Note Title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="bg-transparent w-full text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 outline-none"
                />
                <span className="text-sm text-black/50 dark:text-white/50">21/01/2025</span>
              </div>
              <textarea
                placeholder="Write your note here..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full h-[400px] bg-black/5 dark:bg-white/5 rounded-lg p-3 text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 outline-none resize-none"
              />
              <button
                onClick={handleSaveNote}
                className="w-full py-3 bg-gray-400/80 hover:bg-gray-400/90 dark:bg-gray-600/80 dark:hover:bg-gray-600/90 text-white rounded-lg transition-colors"
              >
                Save Note
              </button>
            </div>
          </Card>

          {/* Saved Notes Card */}
          <Card className="p-4 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-black/10 dark:border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-black dark:text-white">Saved Notes</h2>
              <Files className="h-5 w-5 text-black/50 dark:text-white/50" />
            </div>
            <p className="text-sm text-black/50 dark:text-white/50">Recent notes</p>
            <div className="mt-4 space-y-3">
              {savedNotes.length === 0 ? (
                <p className="text-center text-black/50 dark:text-white/50 py-8">No saved notes yet</p>
              ) : (
                savedNotes.map((note, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <h3 className="font-medium text-black dark:text-white">{note.title}</h3>
                    <p className="text-sm text-black/50 dark:text-white/50">{note.date}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
} 