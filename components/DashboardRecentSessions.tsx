import { Session } from '@/lib/sessions';
import { Clock, Play, ChevronRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

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

const formatRemainingTime = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} min left`;
};

export function DashboardRecentSessions({ sessions }: DashboardRecentSessionsProps) {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isWordsDialogOpen, setIsWordsDialogOpen] = useState(false);
  const router = useRouter();

  if (sessions.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">No recent sessions found.</p>
      </div>
    );
  }

  const handleContinueSession = (session: Session) => {
    if (session.status === 'in_progress' || session.status === 'aborted') {
      // For aborted sessions, use actual_duration
      // For in_progress sessions, calculate from timestamps
      const timeSpent = session.status === 'aborted' ?
        session.actual_duration || 0 :
        (session.last_active_time?.toDate()?.getTime() || session.start_time.toDate().getTime()) - 
        session.start_time.toDate().getTime() - 
        (session.paused_duration || 0);

      const remainingTime = Math.max(0, session.duration - timeSpent);
      
      if (remainingTime > 0) {
        const encodedWords = encodeURIComponent(JSON.stringify(session.words));
        router.push(`/clock/${session.clock_id}?duration=${remainingTime}&words=${encodedWords}&sessionId=${session.id}`);
      }
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-3">
        {sessions.slice(0, 3).map((session) => {
          const clockType = clockTitles[session.clock_id] || 'Unknown Clock';
          const clockColor = clockColors[session.clock_id]?.split(' ')[0] || 'text-gray-500';
          const startTime = session.start_time.toDate();
          const lastActiveTime = session.last_active_time?.toDate() || startTime;
          const pausedDuration = session.paused_duration || 0;
          
          // Calculate time spent and remaining time
          const timeSpent = session.status === 'completed' ? session.duration :
            session.status === 'aborted' ? session.actual_duration || 0 :
            lastActiveTime.getTime() - startTime.getTime() - pausedDuration;

          const remainingTime = Math.max(0, session.duration - timeSpent);
          const progress = Math.min((timeSpent / session.duration) * 100, 100);

          // Format session duration in minutes
          const sessionDuration = Math.ceil(session.duration / 60000);

          return (
            <div 
              key={session.id}
              className={`p-3 rounded-xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 transition-all`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className={`text-sm font-medium ${clockColor}`}>
                    {clockType}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <Calendar className="h-3 w-3" />
                    {startTime.toLocaleDateString()} {startTime.toLocaleTimeString()}
                  </div>
                </div>
                {(session.status === 'in_progress' || session.status === 'aborted') && remainingTime > 0 && (
                  <button
                    onClick={() => handleContinueSession(session)}
                    className={`p-1 rounded-full border ${clockColor} border-current hover:bg-${clockColor.split('-')[1]}-50 dark:hover:bg-${clockColor.split('-')[1]}-500/10 transition-colors`}
                  >
                    <Play className={`h-3 w-3 ${clockColor}`} />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Session: {sessionDuration}m</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{Math.round(progress)}%</span>
                </div>
                {(session.status === 'in_progress' || session.status === 'aborted') && remainingTime > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatRemainingTime(remainingTime)}</span>
                  </div>
                )}
              </div>

              {session.words && session.words.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  {session.words.slice(0, 3).map((word, index) => (
                    <span 
                      key={index}
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${clockColor} border-current bg-transparent hover:bg-${clockColor.split('-')[1]}-50 dark:hover:bg-${clockColor.split('-')[1]}-500/10 transition-colors`}
                    >
                      {word}
                    </span>
                  ))}
                  {session.words.length > 3 && (
                    <button
                      onClick={() => {
                        setSelectedWords(session.words);
                        setIsWordsDialogOpen(true);
                      }}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      +{session.words.length - 3} more
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={isWordsDialogOpen} onOpenChange={setIsWordsDialogOpen}>
        <DialogContent className="bg-white dark:bg-black/90 border border-gray-200 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Assigned Words</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 p-4">
            {selectedWords.map((word, index) => (
              <div key={index} className="w-full">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{word}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {/* Add glossary definition here */}
                  Definition placeholder for {word}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}