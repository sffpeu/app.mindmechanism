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
        {sessions.slice(0, 4).map((session) => {
          const clockType = clockTitles[session.clock_id] || 'Unknown Clock';
          const clockColor = clockColors[session.clock_id]?.split(' ')[0] || 'text-gray-500';
          const startTime = session.start_time.toDate();
          const lastActiveTime = session.last_active_time?.toDate() || startTime;
          const pausedDuration = session.paused_duration || 0;
          
          // Calculate progress based on session status and active time
          const progress = session.status === 'completed' ? 100 : 
            session.status === 'aborted' ? 
              Math.min((session.actual_duration / session.duration) * 100, 100) : 
              Math.min(((lastActiveTime.getTime() - startTime.getTime() - pausedDuration) / session.duration) * 100, 100);

          return (
            <div 
              key={session.id}
              className={`p-3.5 rounded-xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 transition-all ${
                clockColors[session.clock_id].includes('red') ? 'hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]' :
                clockColors[session.clock_id].includes('orange') ? 'hover:border-orange-500/50 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]' :
                clockColors[session.clock_id].includes('yellow') ? 'hover:border-yellow-500/50 hover:shadow-[0_0_15px_rgba(234,179,8,0.3)]' :
                clockColors[session.clock_id].includes('green') ? 'hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]' :
                clockColors[session.clock_id].includes('blue') ? 'hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]' :
                clockColors[session.clock_id].includes('pink') ? 'hover:border-pink-500/50 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]' :
                clockColors[session.clock_id].includes('purple') ? 'hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(147,51,234,0.3)]' :
                clockColors[session.clock_id].includes('indigo') ? 'hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]' :
                'hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className={`text-sm font-medium ${clockColor}`}>
                    {clockType}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <Calendar className="h-3 w-3" />
                    {startTime.toLocaleDateString()}
                  </div>
                </div>
                {(session.status === 'in_progress' || session.status === 'aborted') && (
                  <button
                    onClick={() => handleContinueSession(session)}
                    className="p-1.5 rounded-full bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  >
                    <Play className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5 my-2">
                <div className="p-1 rounded-lg bg-gray-50 dark:bg-white/5">
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    Duration
                  </span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white block text-center">
                    {session.duration / 60000}m
                  </span>
                </div>
                <div className="p-1 rounded-lg bg-gray-50 dark:bg-white/5">
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                    Progress
                  </span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white block text-center">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="p-1 rounded-lg bg-gray-50 dark:bg-white/5">
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                    Status
                  </span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white block text-center">
                    {session.status}
                  </span>
                </div>
              </div>

              {session.words && session.words.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {session.words.slice(0, 4).map((word, index) => (
                    <span 
                      key={index}
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:${clockColor} hover:border-current transition-colors cursor-pointer`}
                      onClick={() => {
                        setSelectedWords(session.words);
                        setIsWordsDialogOpen(true);
                      }}
                    >
                      {word}
                    </span>
                  ))}
                  {session.words.length > 4 && (
                    <button
                      onClick={() => {
                        setSelectedWords(session.words);
                        setIsWordsDialogOpen(true);
                      }}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      +{session.words.length - 4} more
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