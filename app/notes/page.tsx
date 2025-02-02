'use client'

import { useState } from 'react'
import { Menu } from '@/components/Menu'
import { Card } from '@/components/ui/card'
import { RotateCcw, PenLine, Files, Clock, ArrowUpDown } from 'lucide-react'
import { useTheme } from '@/app/ThemeContext'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Note } from '@/types/Note'

export default function NotesPage() {
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const { isDarkMode } = useTheme()

  // Example sessions - replace with actual data
  const sessions = [
    { title: "Galileo's First Observation", date: '20/01/2025' },
    { title: "Galileo's First Observation", date: '20/01/2025' },
  ]

  // Initialize empty saved notes array
  const [savedNotes, setSavedNotes] = useState<Note[]>([])

  const handleSaveNote = () => {
    if (!noteTitle.trim() || !noteContent.trim()) return

    const newNote: Note = {
      id: Date.now().toString(),
      title: noteTitle,
      content: noteContent,
      date: new Date().toISOString(),
      sessionId: selectedSession
    }

    setSavedNotes(prev => [newNote, ...prev])
    setNoteTitle('')
    setNoteContent('')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const sortedNotes = [...savedNotes].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column: Saved Notes and Select Session */}
          <div className="space-y-4">
            {/* Saved Notes Card */}
            <Card className="p-4 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-black/10 dark:border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-black dark:text-white">Saved Notes</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                  </button>
                  <Files className="h-5 w-5 text-black/50 dark:text-white/50" />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {sortedNotes.length === 0 ? (
                  <p className="text-center text-black/50 dark:text-white/50 py-8">No saved notes yet</p>
                ) : (
                  sortedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <h3 className="font-medium text-black dark:text-white">{note.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                        <p className="text-sm text-black/50 dark:text-white/50">{formatDate(note.date)}</p>
                      </div>
                      <p className="text-sm text-black/50 dark:text-white/50 mt-1 line-clamp-2">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Select Session Card */}
            <Card className="p-4 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-black/10 dark:border-white/20 relative">
              <div className="absolute inset-0 bg-white/90 dark:bg-black/90 backdrop-blur-[2px] rounded-xl z-10 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Available Soon</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Currently in Development</p>
                </div>
              </div>
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
          </div>

          {/* Right Column: Write Note */}
          <div className="md:col-span-2">
            {/* Write Note Card */}
            <Card className="p-4 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-black/10 dark:border-white/20">
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
                  className="w-full h-[500px] bg-black/5 dark:bg-white/5 rounded-lg p-3 text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 outline-none resize-none"
                />
                <button
                  onClick={handleSaveNote}
                  className="w-full py-3 bg-gray-400/80 hover:bg-gray-400/90 dark:bg-gray-600/80 dark:hover:bg-gray-600/90 text-white rounded-lg transition-colors"
                >
                  Save Note
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 