import { useState, useEffect, useCallback } from 'react';

// Time constants
export const TOTAL_TIME_25_QUESTIONS = 15 * 60; // 15 minutes in seconds
export const TOTAL_TIME_30_QUESTIONS = 20 * 60; // 20 minutes in seconds

// Determine time limit based on number of questions
export const getTimeLimit = (questionCount: number): number => {
  if (questionCount <= 25) {
    return TOTAL_TIME_25_QUESTIONS;
  }
  return TOTAL_TIME_30_QUESTIONS;
};

// Format seconds to MM:SS display
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

interface UseTimerOptions {
  questionCount: number;
  onTimeUp?: () => void;
}

interface UseTimerReturn {
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  formattedTime: string;
  progress: number; // 0-100 percentage of time remaining
}

export const useTimer = ({ questionCount, onTimeUp }: UseTimerOptions): UseTimerReturn => {
  const initialTime = getTimeLimit(questionCount);
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const timeLimit = getTimeLimit(questionCount);

  useEffect(() => {
    let interval: number;

    if (isRunning && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time's up - auto submit
            setIsRunning(false);
            onTimeUp?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, isPaused, timeLeft, onTimeUp]);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const reset = useCallback(() => {
    setTimeLeft(getTimeLimit(questionCount));
    setIsRunning(true);
    setIsPaused(false);
  }, [questionCount]);

  const progress = timeLimit > 0 ? (timeLeft / timeLimit) * 100 : 0;

  return {
    timeLeft,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    reset,
    formattedTime: formatTime(timeLeft),
    progress,
  };
};

export default useTimer;
