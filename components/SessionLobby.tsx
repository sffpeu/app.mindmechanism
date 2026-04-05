'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Wifi, Battery, Share2, Clock, Calendar, Plus, LogIn, ArrowRight } from 'lucide-react'
import { getPublicSessions, joinSession, createSession, Session } from '@/lib/sessions'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'

export function SessionLobby() {
    const [sessions, setSessions] = useState<Session[]>([])
    const [loading, setLoading] = useState(true)
    const [isAdvertising, setIsAdvertising] = useState(false)
    const { user } = useAuth()
    const router = useRouter()

    // Form State
    const [startTime, setStartTime] = useState('now')
    const [duration, setDuration] = useState('15')
    const [capacity, setCapacity] = useState('5')

    const fetchSessions = async () => {
        try {
            const publicSessions = await getPublicSessions()
            setSessions(publicSessions)
        } catch (error) {
            console.error('Failed to fetch sessions', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSessions()
        const interval = setInterval(fetchSessions, 5000) // Refresh every 5s for better responsiveness
        return () => clearInterval(interval)
    }, [])

    const handleAdvertise = async () => {
        if (!user) return

        try {
            const durationMs = parseInt(duration) * 60 * 1000
            let scheduledStart = new Date()

            // Create session with 'waiting' status (default in lib/sessions.ts)
            const session = await createSession({
                user_id: user.uid,
                clock_id: 0, // Default to Clock 0 for now as requested prototype
                duration: durationMs,
                words: [],
                // Default environment values (placeholder)
                moon_phase: '', moon_illumination: 0, moon_rise: '', moon_set: '',
                weather_condition: '', temperature: 0, humidity: 0, uv_index: 0,
                pressure: 0, wind_speed: 0, city: '', country: '',
                elevation: 0, sea_level: 0, latitude: 0, longitude: 0,
                progress: 0,

                // Public Session Data
                is_public: true,
                max_participants: parseInt(capacity),
                current_participants: 1, // Host
                host_id: user.uid,
                scheduled_start_time: scheduledStart.toISOString()
            })

            toast.success('Session advertised! Redirecting to lobby...')
            setIsAdvertising(false)
            // Redirect host to the clock page immediately to wait for others
            router.push(`/0?sessionId=${session.id}&isHost=true&duration=${durationMs}`)
        } catch (error) {
            toast.error('Failed to advertise session')
            console.error(error)
        }
    }

    const handleJoin = async (session: Session) => {
        try {
            if (user?.uid === session.host_id) {
                // Re-joining as host
                router.push(`/${session.clock_id}?sessionId=${session.id}&isHost=true&duration=${session.duration}`)
                return;
            }

            await joinSession(session.id)
            toast.success('Joined session!')
            fetchSessions()
            // Redirect participant to session page
            router.push(`/${session.clock_id}?sessionId=${session.id}&duration=${session.duration}`)
        } catch (error) {
            toast.error('Failed to join session (maybe full?)')
        }
    }

    return (
        <Card className="p-4 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-500" />
                    <h2 className="text-lg font-semibold dark:text-white">Session Lobby</h2>
                </div>
                <Dialog open={isAdvertising} onOpenChange={setIsAdvertising}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-xs">
                            <Plus className="h-4 w-4 mr-1" /> Advertise
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Advertise Session</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Start</Label>
                                <Select value={startTime} onValueChange={setStartTime}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="When?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="now">Start Now (Waiting Room)</SelectItem>
                                        <SelectItem value="5m">In 5 mins</SelectItem>
                                        <SelectItem value="15m">In 15 mins</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Duration</Label>
                                <Select value={duration} onValueChange={setDuration}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Duration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5 minutes</SelectItem>
                                        <SelectItem value="15">15 minutes</SelectItem>
                                        <SelectItem value="30">30 minutes</SelectItem>
                                        <SelectItem value="60">1 hour</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Capacity</Label>
                                <Select value={capacity} onValueChange={setCapacity}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Max Users" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2">2 Users (Pair)</SelectItem>
                                        <SelectItem value="3">3 Users</SelectItem>
                                        <SelectItem value="5">5 Users</SelectItem>
                                        <SelectItem value="10">10 Users</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAdvertise}>Announce Session</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <p className="text-sm text-gray-500">Loading sessions...</p>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No active sessions nearby.</p>
                        <p className="text-xs mt-1">Be the first to start one!</p>
                    </div>
                ) : (
                    sessions.map(session => (
                        <div key={session.id} className="p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-transparent hover:border-black/5 dark:hover:border-white/10 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium dark:text-white">
                                            {session.host_id === user?.uid ? 'My Session' : 'Anonymous Session'}
                                        </span>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${session.status === 'in_progress'
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            }`}>
                                            {session.status === 'in_progress' ? 'In Progress' : 'Waiting'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {session.status === 'waiting'
                                            ? 'Waiting for participants...'
                                            : `Started ${session.start_time ? formatDistanceToNow(session.start_time.toDate(), { addSuffix: true }) : ''}`
                                        }
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 justify-end text-xs text-gray-500">
                                        <Users className="h-3 w-3" />
                                        {session.current_participants || 1}/{session.max_participants || 5}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {Math.round((session.duration || 0) / 60000)}m
                                    </p>
                                </div>
                            </div>
                            <Button
                                className="w-full mt-2 text-xs h-8"
                                variant={session.host_id === user?.uid ? "default" : "secondary"}
                                onClick={() => handleJoin(session)}
                                disabled={
                                    session.host_id !== user?.uid && (
                                        (session.current_participants || 0) >= (session.max_participants || 0) ||
                                        session.status === 'in_progress'
                                    )
                                }
                            >
                                {session.host_id === user?.uid
                                    ? (session.status === 'waiting' ? 'Go to Waiting Room' : 'Rejoin Session')
                                    : (session.status === 'waiting' ? 'Join Session' : 'Session In Progress')
                                }
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </Card>
    )
}
