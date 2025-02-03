import { Session } from '@/lib/sessions';
import { Clock, CheckCircle2, Timer, Calendar } from 'lucide-react';
import Link from 'next/link';

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

interface DashboardRecentSessionsProps {
  sessions: Session[];
}

export function DashboardRecentSessions({ sessions }: DashboardRecentSessionsProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">No recent sessions found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {sessions.slice(0, 3).map((session) => {
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
          <Link 
            href="/sessions" 
            key={session.id}
            className={`block p-4 rounded-xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 transition-all hover:shadow-[0_0_15px_${shadowColor}] hover:border-${clockColor.split('-')[1]}-500/50`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className={`text-base font-medium ${clockColor}`}>
                  {clockType}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <Calendar className="h-3 w-3" />
                  {startTime.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
              {session.status === 'completed' && (
                <CheckCircle2 className={`h-4 w-4 ${clockColor}`} />
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{session.duration / 60000}m</span>
              </div>
              <div className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            {session.words && session.words.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {session.words.slice(0, 3).map((word, index) => (
                  <span 
                    key={index}
                    className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${clockColor} border-current bg-transparent`}
                  >
                    {word}
                  </span>
                ))}
                {session.words.length > 3 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{session.words.length - 3} more
                  </span>
                )}
              </div>
            )}
          </Link>
        );
      })}
      {sessions.length > 3 && (
        <Link 
          href="/sessions"
          className="text-center block py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          View all sessions →
        </Link>
      )}
    </div>
  );
} 