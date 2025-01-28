import { supabase } from '@/lib/supabase'

interface SessionData {
  user_id: string
  clock_id: number
  duration: number
  words: string[]
  moon_phase: string
  moon_illumination: number
  moon_rise: string
  moon_set: string
  weather_condition: string
  temperature: number
  humidity: number
  uv_index: number
  pressure: number
  wind_speed: number
  city: string
  country: string
  elevation: number
  sea_level: number
  latitude: number
  longitude: number
}

export async function createSession(data: SessionData) {
  const { data: session, error } = await supabase
    .from('sessions')
    .insert([data])
    .select()
    .single()

  if (error) {
    console.error('Error creating session:', error)
    throw error
  }

  return session
}

export async function updateSession(sessionId: string, data: Partial<SessionData> & { status: 'completed' | 'aborted', end_time: string, actual_duration: number }) {
  const { data: session, error } = await supabase
    .from('sessions')
    .update(data)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating session:', error)
    throw error
  }

  return session
}

export async function getUserSessions(userId: string) {
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('start_time', { ascending: false })

  if (error) {
    console.error('Error fetching user sessions:', error)
    throw error
  }

  return sessions
}

export async function getUserStats(userId: string) {
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')

  if (error) {
    console.error('Error fetching user stats:', error)
    throw error
  }

  const totalTime = sessions?.reduce((acc, session) => acc + (session.actual_duration || 0), 0) || 0
  const totalSessions = sessions?.length || 0
  const completionRate = sessions ? 
    (sessions.filter(s => s.status === 'completed').length / sessions.length) * 100 : 0

  // Calculate monthly progress
  const now = new Date()
  const thisMonth = sessions?.filter(session => {
    const sessionDate = new Date(session.start_time)
    return sessionDate.getMonth() === now.getMonth() && 
           sessionDate.getFullYear() === now.getFullYear()
  })

  const monthlyProgress = {
    totalSessions: thisMonth?.length || 0,
    totalTime: thisMonth?.reduce((acc, session) => acc + (session.actual_duration || 0), 0) || 0,
    completionRate: thisMonth ? 
      (thisMonth.filter(s => s.status === 'completed').length / thisMonth.length) * 100 : 0
  }

  return {
    totalTime,
    totalSessions,
    completionRate,
    monthlyProgress
  }
} 