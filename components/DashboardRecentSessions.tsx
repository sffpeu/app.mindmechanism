import { useEffect, useState } from 'react';
import { Session, getUserSessions } from '@/lib/sessions';
import { useAuth } from '@/lib/FirebaseAuthContext';
import { RefreshCw, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

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

const clockColors = [
  'text-red-500',
  'text-orange-500',
  'text-yellow-500',
  'text-green-500',
  'text-blue-500',
  'text-pink-500',
  'text-purple-500',
  'text-indigo-500',
  'text-cyan-500'
];

const clockStrokeColors = [
  'stroke-red-500',
  'stroke-orange-500',
  'stroke-yellow-500',
  'stroke-green-500',
  'stroke-blue-500',
  'stroke-pink-500',
  'stroke-purple-500',
  'stroke-indigo-500',
  'stroke-cyan-500'
];

const formatTime = (ms: number) => {
  if (ms === 0) return '∞';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

function MiniClock({ progress, strokeColor }: { progress: number; strokeColor: string }) {
  const size = 40;
  const strokeWidth = 3;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (progress / 100) * circumference;
  return (
    <svg width={size} height={size} className="flex-shrink-0" viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-gray-200 dark:text-white/10"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={strokeColor}
        strokeDasharray={circumference}
        strokeDashoffset={circumference - dash}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

interface DashboardRecentSessionsProps {
  sessions?: Session[];
}

export function DashboardRecentSessions({ sessions: propSessions }: DashboardRecentSessionsProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(!propSessions);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (propSessions) {
      setSessions(propSessions);
      return;
    }

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
  }, [user?.uid, propSessions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <LoadingSpinner size="md" isLoading={loading} />
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

  const handleRestartSession = (session: Session) => {
    const encodedWords = encodeURIComponent(JSON.stringify(session.words || []));
    router.push(`/${session.clock_id}?duration=${session.duration}&words=${encodedWords}&sessionId=${session.id}`);
  };

  const handleContinueSession = (session: Session) => {
    if (session.status === 'in_progress' || session.status === 'aborted') {
      const now = new Date().getTime();
      const startTime = session.start_time.toDate().getTime();
      const lastActiveTime = session.last_active_time?.toDate().getTime() || startTime;
      const pausedDuration = session.paused_duration || 0;

      const timeSpent = session.status === 'aborted' ?
        session.actual_duration || 0 :
        lastActiveTime - startTime - pausedDuration;

      const remainingTime = Math.max(0, session.duration - timeSpent);
      const sessionAge = now - lastActiveTime;

      if (remainingTime > 0 && sessionAge < 24 * 60 * 60 * 1000) {
        const encodedWords = encodeURIComponent(JSON.stringify(session.words || []));
        router.push(`/${session.clock_id}?duration=${remainingTime}&words=${encodedWords}&sessionId=${session.id}`);
        localStorage.removeItem('pendingSession');
      } else {
        router.push(`/${session.clock_id}?duration=${session.duration}&words=${encodeURIComponent(JSON.stringify(session.words || []))}`);
      }
    }
  };

  const SessionMini = ({ session }: { session: Session }) => {
    const clockType = clockTitles[session.clock_id] || 'Unknown Clock';
    const textColor = clockColors[session.clock_id] || 'text-gray-500';
    const strokeColor = clockStrokeColors[session.clock_id] || 'stroke-gray-500';
    const startTime = session.start_time.toDate();
    const lastActiveTime = session.last_active_time?.toDate() || startTime;
    const pausedDuration = session.paused_duration || 0;

    const progress = session.status === 'completed' ? 100 :
      session.status === 'aborted' ?
        Math.min((session.actual_duration / session.duration) * 100, 100) :
        Math.min(((lastActiveTime.getTime() - startTime.getTime() - pausedDuration) / session.duration) * 100, 100);

    const canContinue = session.status === 'in_progress' || session.status === 'aborted';

    return (
      <div className="flex flex-col items-center p-3 rounded-xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 min-w-[120px] max-w-[160px]">
        <MiniClock progress={progress} strokeColor={strokeColor} />
        <h3 className={`text-xs font-medium mt-2 text-center line-clamp-2 ${textColor}`}>
          {clockType}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {formatTime(session.duration)}
        </p>
        <div className="flex gap-1.5 mt-2 w-full justify-center flex-wrap">
          {canContinue && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleContinueSession(session)}
            >
              <Play className="h-3 w-3 mr-1" />
              Continue
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleRestartSession(session)}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Restart
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
      {sessions.slice(0, 6).map((session) => (
        <SessionMini key={session.id} session={session} />
      ))}
    </div>
  );
}
