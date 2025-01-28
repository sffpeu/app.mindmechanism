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
  try {
    const { data: session, error } = await supabase
      .from('sessions')
      .insert([{
        ...data,
        start_time: new Date().toISOString(),
        status: 'in_progress',
        actual_duration: 0
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating session:', error)
      throw error
    }

    return session
  } catch (error) {
    console.error('Error in createSession:', error)
    throw error
  }
}

export async function updateSession(sessionId: string, data: Partial<SessionData> & { status: 'completed' | 'aborted', end_time: string, actual_duration: number }) {
  try {
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
  } catch (error) {
    console.error('Error in updateSession:', error)
    throw error
  }
}

export async function getUserSessions(userId: string) {
  try {
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })

    if (error) {
      console.error('Error fetching user sessions:', error)
      throw error
    }

    return sessions || []
  } catch (error) {
    console.error('Error in getUserSessions:', error)
    return []
  }
}

export async function getUserStats(userId: string) {
  try {
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching user stats:', error)
      throw error
    }

    const completedSessions = sessions?.filter(s => s.status === 'completed') || []
    const totalTime = completedSessions.reduce((acc, session) => acc + (session.actual_duration || 0), 0)
    const totalSessions = completedSessions.length
    const completionRate = sessions?.length ? 
      (completedSessions.length / sessions.length) * 100 : 0

    // Calculate monthly progress
    const now = new Date()
    const thisMonth = sessions?.filter(session => {
      const sessionDate = new Date(session.start_time)
      return sessionDate.getMonth() === now.getMonth() && 
             sessionDate.getFullYear() === now.getFullYear()
    }) || []

    const completedThisMonth = thisMonth.filter(s => s.status === 'completed')
    const monthlyProgress = {
      totalSessions: completedThisMonth.length,
      totalTime: completedThisMonth.reduce((acc, session) => acc + (session.actual_duration || 0), 0),
      completionRate: thisMonth.length ? 
        (completedThisMonth.length / thisMonth.length) * 100 : 0
    }

    return {
      totalTime,
      totalSessions,
      completionRate,
      monthlyProgress
    }
  } catch (error) {
    console.error('Error in getUserStats:', error)
    return {
      totalTime: 0,
      totalSessions: 0,
      completionRate: 0,
      monthlyProgress: {
        totalSessions: 0,
        totalTime: 0,
        completionRate: 0
      }
    }
  }
} 