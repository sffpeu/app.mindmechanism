'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Disc3, Play, Square, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  loadCompositions,
  deleteComposition,
  compositionDataUrl,
  type UserComposition,
} from '@/lib/userCompositionsStorage'

export function SequencerLoopsCard() {
  const [items, setItems] = useState<UserComposition[]>([])
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const refresh = useCallback(() => {
    setItems(loadCompositions())
  }, [])

  useEffect(() => {
    refresh()
    const h = () => refresh()
    window.addEventListener('mm-compositions-updated', h)
    return () => window.removeEventListener('mm-compositions-updated', h)
  }, [refresh])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  const play = (c: UserComposition) => {
    audioRef.current?.pause()
    const a = new Audio(compositionDataUrl(c))
    a.onended = () => {
      setPlayingId(null)
      audioRef.current = null
    }
    audioRef.current = a
    setPlayingId(c.id)
    void a.play().catch(() => {
      setPlayingId(null)
      audioRef.current = null
    })
  }

  const stop = () => {
    audioRef.current?.pause()
    audioRef.current = null
    setPlayingId(null)
  }

  const remove = (id: string) => {
    if (playingId === id) stop()
    deleteComposition(id)
    refresh()
  }

  if (items.length === 0) {
    return (
      <Card className="p-4 bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 space-y-2">
        <div className="flex items-start gap-2">
          <Disc3 className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Your sequencer loops</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
              Record loops on the{' '}
              <Link href="/sequencer" className="text-violet-600 dark:text-violet-400 hover:underline font-medium">
                16-step sequencer
              </Link>
              . Saved takes appear here for preview and download-free playback in the browser.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Disc3 className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Your sequencer loops</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
              From the{' '}
              <Link href="/sequencer" className="text-violet-600 dark:text-violet-400 hover:underline font-medium">
                sequencer
              </Link>
              . Stored on this device only.
            </p>
          </div>
        </div>
      </div>
      <ul className="space-y-2">
        {items.map((c) => (
          <li
            key={c.id}
            className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 px-2 py-1.5"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{c.name}</p>
              <p className="text-[10px] text-gray-400">
                {new Date(c.createdAt).toLocaleString(undefined, {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </p>
            </div>
            {playingId === c.id ? (
              <Button type="button" variant="secondary" size="icon" className="h-8 w-8 shrink-0" onClick={stop}>
                <Square className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => play(c)}
                aria-label={`Play ${c.name}`}
              >
                <Play className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-red-600 dark:text-red-400"
              onClick={() => remove(c.id)}
              aria-label={`Delete ${c.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
