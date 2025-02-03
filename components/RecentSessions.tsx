import { useEffect, useState } from 'react';
import { Session, getUserSessions } from '@/lib/sessions';
import { useAuth } from '@/lib/FirebaseAuthContext';
import { clockSettings } from '@/lib/clockSettings';
import { Clock, CheckCircle2, Timer } from 'lucide-react';

export function RecentSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function loadSessions() {
      if (!user?.uid) return;
      try {
        const userSessions = await getUserSessions(user.uid);
        setSessions(userSessions);
      } catch (error) {
        console.error('Error loading sessions:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600 dark:text-gray-400">No sessions found. Start a new session to see your history here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sessions.map((session) => {
        const clockType = clockSettings[session.clock_id]?.title || 'Unknown Clock';
        const startTime = session.start_time.toDate();
        const progress = session.status === 'completed' ? 100 : 
          session.status === 'aborted' ? 
            (session.actual_duration / session.duration) * 100 : 
            ((Date.now() - startTime.getTime()) / session.duration) * 100;

        return (
          <div 
            key={session.id}
            className="bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 rounded-lg p-4 shadow-sm hover:border-black/10 dark:hover:border-white/20 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h3 className="font-medium text-gray-900 dark:text-white">{clockType}</h3>
              </div>
              {session.status === 'completed' && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </div>

            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>Started: {startTime.toLocaleString()}</p>
              <p>Duration: {session.duration / 60000} minutes</p>
              <div className="flex items-center space-x-2">
                <Timer className="h-4 w-4" />
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
                <span>{Math.round(progress)}%</span>
              </div>
              
              {session.words && session.words.length > 0 && (
                <div>
                  <p className="mb-1">Assigned Words:</p>
                  <div className="flex flex-wrap gap-1">
                    {session.words.map((word, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
} 