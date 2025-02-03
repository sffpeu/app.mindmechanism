import { useEffect, useState } from 'react';
import { Session, getUserSessions } from '@/lib/sessions';
import { useAuth } from '@/lib/FirebaseAuthContext';
import { Clock, CheckCircle2, Timer, Calendar, RotateCw } from 'lucide-react';

// Clock titles mapping
const clockTitles = [
  "Galileo's First Observation",
  "Neptune's Discovery",
  "Galileo's Spring Observation",
  "Jupiter's Moons",
  "Uranus Discovery",
  "Saturn's Rings",
  "Ancient Star Charts",
  "Winter Solstice Study",
  "Medieval Observations"
];

// Clock colors mapping
const clockColors = [
  'text-red-500 bg-red-500',
  'text-orange-500 bg-orange-500',
  'text-yellow-500 bg-yellow-500',
  'text-green-500 bg-green-500',
  'text-blue-500 bg-blue-500',
  'text-pink-500 bg-pink-500',
  'text-purple-500 bg-purple-500',
  'text-indigo-500 bg-indigo-500',
  'text-cyan-500 bg-cyan-500'
];

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
        const clockType = clockTitles[session.clock_id] || 'Unknown Clock';
        const clockColor = clockColors[session.clock_id]?.split(' ')[0] || 'text-gray-500';
        const startTime = session.start_time.toDate();
        const progress = session.status === 'completed' ? 100 : 
          session.status === 'aborted' ? 
            (session.actual_duration / session.duration) * 100 : 
            ((Date.now() - startTime.getTime()) / session.duration) * 100;

        const shadowColor = clockColor.includes('red') ? 'rgba(239,68,68,0.3)' :
          clockColor.includes('orange') ? 'rgba(249,115,22,0.3)' :
          clockColor.includes('yellow') ? 'rgba(234,179,8,0.3)' :
          clockColor.includes('green') ? 'rgba(34,197,94,0.3)' :
          clockColor.includes('blue') ? 'rgba(59,130,246,0.3)' :
          clockColor.includes('pink') ? 'rgba(236,72,153,0.3)' :
          clockColor.includes('purple') ? 'rgba(147,51,234,0.3)' :
          clockColor.includes('indigo') ? 'rgba(99,102,241,0.3)' :
          'rgba(6,182,212,0.3)';

        return (
          <div 
            key={session.id}
            className={`p-6 rounded-xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 transition-all hover:shadow-[0_0_15px_${shadowColor}] hover:border-${clockColor.split('-')[1]}-500/50`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className={`text-lg font-medium ${clockColor}`}>
                  {clockType}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
                  <Calendar className="h-4 w-4" />
                  {startTime.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
              {session.status === 'completed' && (
                <CheckCircle2 className={`h-5 w-5 ${clockColor}`} />
              )}
            </div>

            <div className="grid grid-cols-3 gap-1.5 my-4">
              <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5">
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                  Duration
                </span>
                <span className="text-xs font-medium text-gray-900 dark:text-white block text-center">
                  {session.duration / 60000}m
                </span>
              </div>
              <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5">
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                  <Timer className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                  Progress
                </span>
                <span className="text-xs font-medium text-gray-900 dark:text-white block text-center">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5">
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                  <RotateCw className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                  Status
                </span>
                <span className="text-xs font-medium text-gray-900 dark:text-white block text-center">
                  {session.status}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center space-x-2 mb-3">
                <Timer className={`h-4 w-4 ${clockColor}`} />
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${clockColor.replace('text', 'bg')}`}
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
              </div>
              
              {session.words && session.words.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Assigned Words:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {session.words.map((word, index) => (
                      <span 
                        key={index}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${clockColor} border-current bg-transparent`}
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