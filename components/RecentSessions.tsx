import { useEffect, useState } from 'react';
import { Session, getUserSessions } from '@/lib/sessions';
import { useAuth } from '@/lib/FirebaseAuthContext';
import { Clock, CheckCircle2, Timer, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isWordsDialogOpen, setIsWordsDialogOpen] = useState(false);
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
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">No sessions found. Start a new session to see your history here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
              className={`p-3.5 rounded-xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 transition-all hover:shadow-[0_0_15px_${shadowColor}] hover:border-${clockColor.split('-')[1]}-500/50`}
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
                {session.status === 'completed' && (
                  <CheckCircle2 className={`h-4 w-4 ${clockColor}`} />
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
                    <Timer className="h-3 w-3" />
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
                <div>
                  <div className="flex flex-wrap gap-1">
                    {session.words.slice(0, 4).map((word, index) => (
                      <span 
                        key={index}
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${clockColor} border-current bg-transparent`}
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
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={isWordsDialogOpen} onOpenChange={setIsWordsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigned Words</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 p-4">
            {selectedWords.map((word, index) => (
              <span 
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium border text-gray-700 dark:text-gray-300 border-current bg-transparent"
              >
                {word}
              </span>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 