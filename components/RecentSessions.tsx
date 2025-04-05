import { useEffect, useState } from 'react';
import { Session, getUserSessions, deleteSession } from '@/lib/sessions';
import { useAuth } from '@/lib/FirebaseAuthContext';
import { Clock, CheckCircle2, Timer, Calendar, MoreVertical, List, Grid, Trash2, RefreshCw, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
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

// Helper function to format time in MM:SS
const formatTime = (ms: number) => {
  if (ms === 0) return '∞';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export function RecentSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isWordsDialogOpen, setIsWordsDialogOpen] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [isListView, setIsListView] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

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
        <LoadingSpinner size="md" />
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

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      toast.success('Session deleted successfully');
    } catch (error) {
      toast.error('Failed to delete session');
    }
  };

  const handleRestartSession = (session: Session) => {
    // Navigate to the new page structure
    const encodedWords = encodeURIComponent(JSON.stringify(session.words || []));
    router.push(`/${session.clock_id}?duration=${session.duration}&words=${encodedWords}&sessionId=${session.id}`);
  };

  const handleContinueSession = (session: Session) => {
    const now = new Date().getTime();
    const startTime = session.start_time.toDate().getTime();
    const lastActiveTime = session.last_active_time?.toDate().getTime() || startTime;
    const pausedDuration = session.paused_duration || 0;
    
    // Calculate actual time spent excluding paused duration
    const timeSpent = session.status === 'aborted' ?
      session.actual_duration || 0 :
      lastActiveTime - startTime - pausedDuration;

    // Calculate remaining time and check session expiry
    const remainingTime = Math.max(0, session.duration - timeSpent);
    const sessionAge = now - lastActiveTime;
    
    if (remainingTime > 0 && sessionAge < 24 * 60 * 60 * 1000) { // 24h expiry
      const encodedWords = encodeURIComponent(JSON.stringify(session.words || []));
      router.push(`/clock/${session.clock_id}?duration=${remainingTime}&sessionId=${session.id}&words=${encodedWords}`);
      
      // Clean up any existing pending session
      localStorage.removeItem('pendingSession');
    } else {
      // Session expired - create a new one
      router.push(`/clock/${session.clock_id}?duration=${session.duration}&words=${encodeURIComponent(JSON.stringify(session.words || []))}`);
    }
  };

  const displayedSessions = showAllSessions ? sessions : sessions.slice(0, 3);

  const SessionCard = ({ session }: { session: Session }) => {
    const clockType = clockTitles[session.clock_id] || 'Unknown Clock';
    const clockColor = clockColors[session.clock_id]?.split(' ')[0] || 'text-gray-500';
    const startTime = session.start_time.toDate();
    const lastActiveTime = session.last_active_time?.toDate() || startTime;
    const pausedDuration = session.paused_duration || 0;
    
    // Calculate progress and remaining time
    const progress = session.status === 'completed' ? 100 : 
      session.status === 'aborted' ? 
        Math.min((session.actual_duration / session.duration) * 100, 100) : 
        Math.min(((lastActiveTime.getTime() - startTime.getTime() - pausedDuration) / session.duration) * 100, 100);
    
    const remainingTime = session.duration - (session.actual_duration || 0);

    return (
      <div className={`p-3.5 rounded-xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 transition-all relative ${
        isListView ? 'flex items-center justify-between' : ''
      }`}>
        <div className={isListView ? 'flex-1' : ''}>
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
            <div className="flex items-center gap-2">
              {session.status === 'completed' && (
                <CheckCircle2 className={`h-4 w-4 ${clockColor}`} />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white dark:bg-black/90 border border-gray-200 dark:border-white/10">
                  <DropdownMenuItem onClick={() => handleRestartSession(session)} className="text-gray-700 dark:text-white">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restart
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-700 dark:text-white">
                    <Tag className="h-4 w-4 mr-2" />
                    Tag
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeleteSession(session.id)}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {!isListView && (
            <div className="grid grid-cols-3 gap-1.5 my-2">
              <div className="p-1 rounded-lg bg-gray-50 dark:bg-white/5">
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  Duration
                </span>
                <span className="text-xs font-medium text-gray-900 dark:text-white block text-center">
                  {formatTime(session.duration)}
                </span>
              </div>
              <div className="p-1 rounded-lg bg-gray-50 dark:bg-white/5">
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                  <Timer className="h-3 w-3" />
                  Remaining
                </span>
                <span className="text-xs font-medium text-gray-900 dark:text-white block text-center">
                  {formatTime(remainingTime)}
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
            </div>
          )}

          {session.words && session.words.length > 0 && (
            <div>
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
            </div>
          )}
        </div>

        {isListView && (
          <div className="flex items-center gap-4 ml-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {formatTime(session.duration)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {formatTime(remainingTime)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round(progress)}%
            </div>
          </div>
        )}

        {session.status === 'in_progress' && remainingTime > 0 && (
          <button
            onClick={() => handleContinueSession(session)}
            className={`mt-2 w-full py-1.5 rounded-lg ${clockColor} bg-opacity-10 dark:bg-opacity-20 hover:bg-opacity-20 dark:hover:bg-opacity-30 transition-all text-sm font-medium`}
          >
            Continue Session
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className={isListView ? "space-y-2" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"}>
        {displayedSessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>

      {sessions.length > 3 && (
        <div className="text-center mt-4">
          <Button
            variant="ghost"
            onClick={() => setShowAllSessions(!showAllSessions)}
            className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
          >
            {showAllSessions ? 'Show Less' : 'Show More'}
          </Button>
        </div>
      )}

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
    </div>
  );
} 