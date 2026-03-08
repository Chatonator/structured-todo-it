import { useState, useCallback, useRef, useEffect } from 'react';

export type PomodoroPhase = 'idle' | 'focus' | 'shortBreak' | 'longBreak';

/** Play a short beep using Web Audio API */
function playBeep(frequency = 880, durationMs = 200, count = 2) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = frequency;
      osc.type = 'sine';
      const start = ctx.currentTime + i * (durationMs / 1000 + 0.1);
      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + durationMs / 1000);
      osc.start(start);
      osc.stop(start + durationMs / 1000);
    }
  } catch {
    // Audio not available
  }
}
export type PomodoroStatus = 'idle' | 'running' | 'paused';

interface PomodoroConfig {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesBeforeLong: number;
}

const DEFAULT_CONFIG: PomodoroConfig = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLong: 4,
};

const SESSIONS_KEY = 'pomodoro_sessions_today';
const SESSIONS_DATE_KEY = 'pomodoro_sessions_date';

function getTodaySessions(): number {
  try {
    const date = localStorage.getItem(SESSIONS_DATE_KEY);
    const today = new Date().toDateString();
    if (date !== today) return 0;
    return parseInt(localStorage.getItem(SESSIONS_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

function saveTodaySessions(count: number): void {
  try {
    localStorage.setItem(SESSIONS_DATE_KEY, new Date().toDateString());
    localStorage.setItem(SESSIONS_KEY, String(count));
  } catch {}
}

function phaseDuration(phase: PomodoroPhase, config: PomodoroConfig): number {
  switch (phase) {
    case 'focus': return config.focusMinutes * 60;
    case 'shortBreak': return config.shortBreakMinutes * 60;
    case 'longBreak': return config.longBreakMinutes * 60;
    default: return 0;
  }
}

export function usePomodoroTool(config: PomodoroConfig = DEFAULT_CONFIG) {
  const [phase, setPhase] = useState<PomodoroPhase>('idle');
  const [status, setStatus] = useState<PomodoroStatus>('idle');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [cycleIndex, setCycleIndex] = useState(0); // 0-based focus count in current round
  const [sessionsToday, setSessionsToday] = useState(getTodaySessions);
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Tick
  useEffect(() => {
    if (status !== 'running') return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [status, clearTimer]);

  // Phase completed when running and secondsLeft hits 0
  useEffect(() => {
    if (status !== 'running' || secondsLeft > 0 || phase === 'idle') return;

    if (phase === 'focus') {
      const newSessions = sessionsToday + 1;
      setSessionsToday(newSessions);
      saveTodaySessions(newSessions);

      const nextCycle = cycleIndex + 1;
      if (nextCycle >= config.cyclesBeforeLong) {
        // Long break
        setCycleIndex(0);
        const dur = phaseDuration('longBreak', config);
        setPhase('longBreak');
        setSecondsLeft(dur);
        setTotalSeconds(dur);
      } else {
        setCycleIndex(nextCycle);
        const dur = phaseDuration('shortBreak', config);
        setPhase('shortBreak');
        setSecondsLeft(dur);
        setTotalSeconds(dur);
      }
    } else {
      // After any break → focus
      const dur = phaseDuration('focus', config);
      setPhase('focus');
      setSecondsLeft(dur);
      setTotalSeconds(dur);
    }
  }, [secondsLeft, status, phase, cycleIndex, sessionsToday, config, clearTimer]);

  const start = useCallback(() => {
    const dur = phaseDuration('focus', config);
    setPhase('focus');
    setSecondsLeft(dur);
    setTotalSeconds(dur);
    setCycleIndex(0);
    setStatus('running');
  }, [config]);

  const pause = useCallback(() => {
    clearTimer();
    setStatus('paused');
  }, [clearTimer]);

  const resume = useCallback(() => {
    setStatus('running');
  }, []);

  const skip = useCallback(() => {
    clearTimer();
    // Simulate phase end
    setSecondsLeft(0);
    setStatus('running');
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setPhase('idle');
    setStatus('idle');
    setSecondsLeft(0);
    setTotalSeconds(0);
    setCycleIndex(0);
  }, [clearTimer]);

  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  return {
    phase,
    status,
    secondsLeft,
    totalSeconds,
    progress,
    cycleIndex,
    cyclesBeforeLong: config.cyclesBeforeLong,
    sessionsToday,
    linkedTaskId,
    setLinkedTaskId,
    start,
    pause,
    resume,
    skip,
    reset,
  };
}
