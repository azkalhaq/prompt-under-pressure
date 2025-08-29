"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { type StroopTrialData } from '@/app/lib/stroop-db';

interface StroopConfig {
  iti: number;
  trialTimer: number;
  instructionSwitchTrials: number;
}

interface StroopTrial {
  instruction: 'word' | 'color';
  text: string;
  textColor: string;
  condition: 'consistent' | 'inconsistent';
  correctAnswer: string;
}

const COLORS = ['red', 'blue', 'green', 'yellow'];
const COLOR_WORDS = ['RED', 'BLUE', 'GREEN', 'YELLOW'];

export default function StroopTest({ userId }: { userId: string }) {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [currentTrial, setCurrentTrial] = useState(1);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTrialData, setCurrentTrialData] = useState<StroopTrial | null>(null);
  const [instruction, setInstruction] = useState<'word' | 'color'>('word');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [trialStartTime, setTrialStartTime] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [itiCountdown, setItiCountdown] = useState(0);
  const [trialCountdown, setTrialCountdown] = useState(0);
  const [isSessionComplete] = useState(false);

  // Refs for timers
  const trialTimerRef = useRef<NodeJS.Timeout | null>(null);
  const itiTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Configuration from environment variables
  const config: StroopConfig = {
    iti: parseInt(process.env.NEXT_PUBLIC_STROOP_ITI || '1000'),
    trialTimer: parseInt(process.env.NEXT_PUBLIC_STROOP_TRIAL_TIMER || '5000'),
    instructionSwitchTrials: parseInt(process.env.NEXT_PUBLIC_STROOP_INSTRUCTION_SWITCH || '10')
  };

  // Generate a random Stroop trial
  const generateTrial = useCallback((): StroopTrial => {
    const randomWord = COLOR_WORDS[Math.floor(Math.random() * COLOR_WORDS.length)];
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    // 50% chance of consistent/inconsistent
    const isConsistent = Math.random() > 0.5;
    const textColor = isConsistent ? randomWord.toLowerCase() : randomColor;
    const condition = isConsistent ? 'consistent' : 'inconsistent';
    
    return {
      instruction,
      text: randomWord,
      textColor,
      condition,
      correctAnswer: instruction === 'word' ? randomWord.toLowerCase() : textColor
    };
  }, [instruction]);

  // Start a new trial
  const startTrial = useCallback(() => {
    const trial = generateTrial();
    setCurrentTrialData(trial);
    setReactionTime(null);
    setFeedback(null);
    setTrialStartTime(Date.now());
    setIsActive(true);
    setIsPaused(false);

    // Start trial countdown if timer is set
    if (config.trialTimer > 0) {
      setTrialCountdown(config.trialTimer / 1000);
      trialTimerRef.current = setTimeout(() => {
        // Handle trial timeout inline to avoid circular dependencies
        if (currentTrialData) {
          const endTime = Date.now();
          const rt = trialStartTime ? endTime - trialStartTime : null;
          saveTrialData(rt, null);
          setFeedback('incorrect');
          setTimeout(() => {
            nextTrial();
          }, 1000);
        }
      }, config.trialTimer);
    }
  }, [generateTrial, config.trialTimer]);

  // Handle user response
  const handleResponse = useCallback((selectedAnswer: string) => {
    if (!currentTrialData || !isActive || isPaused) return;
    
    const endTime = Date.now();
    const rt = trialStartTime ? endTime - trialStartTime : null;
    const isCorrect = selectedAnswer === currentTrialData.correctAnswer;
    
    setReactionTime(rt);
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setIsActive(false);
    
    // Clear trial timer
    if (trialTimerRef.current) {
      clearTimeout(trialTimerRef.current);
      trialTimerRef.current = null;
    }
    
    // Save trial data
    saveTrialData(rt, isCorrect);
    
    // Show feedback and move to next trial
    setTimeout(() => {
      nextTrial();
    }, 1000);
  }, [currentTrialData, isActive, isPaused, trialStartTime]);

  // Save trial data to database
  const saveTrialData = useCallback(async (rt: number | null, correctness: boolean | null) => {
    if (!currentTrialData) return;
    
    const trialData: StroopTrialData = {
      user_id: userId,
      session_id: sessionId,
      trial_number: currentTrial,
      instruction: currentTrialData.instruction,
      text: currentTrialData.text,
      text_color: currentTrialData.textColor,
      condition: currentTrialData.condition,
      iti: config.iti,
      reaction_time: rt,
      correctness: correctness
    };

    try {
      await fetch('/api/stroop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'insert_trial',
          data: trialData
        })
      });
    } catch (error) {
      console.error('Failed to save trial data:', error);
    }
  }, [currentTrialData, userId, sessionId, currentTrial, config.iti]);

  // Move to next trial
  const nextTrial = useCallback(() => {
    setCurrentTrial(prev => prev + 1);
    setIsActive(false);
    setIsPaused(false);
    setFeedback(null);
    setReactionTime(null);
    setTrialStartTime(null);
    
    // Check if instruction should switch
    if (currentTrial % config.instructionSwitchTrials === 0) {
      setInstruction(prev => prev === 'word' ? 'color' : 'word');
    }
    
    // Start ITI countdown
    if (config.iti > 0) {
      setItiCountdown(config.iti / 1000);
      itiTimerRef.current = setTimeout(() => {
        startTrial();
      }, config.iti);
    } else {
      startTrial();
    }
  }, [currentTrial, config.instructionSwitchTrials, config.iti, startTrial]);

  // Start session
  const startSession = useCallback(async () => {
    try {
      await fetch('/api/stroop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_session',
          data: { userId, sessionId }
        })
      });
      startTrial();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  }, [userId, sessionId, startTrial]);

  // End session
  const endSession = useCallback(async () => {
    try {
      await fetch('/api/stroop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_session',
          data: { 
            sessionId, 
            totalTrials: currentTrial - 1, 
            endTime: new Date().toISOString() 
          }
        })
      });
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }, [sessionId, currentTrial]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (trialTimerRef.current) clearTimeout(trialTimerRef.current);
      if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    };
  }, []);

  // ITI countdown effect
  useEffect(() => {
    if (itiCountdown > 0) {
      countdownTimerRef.current = setTimeout(() => {
        setItiCountdown(prev => prev - 1);
      }, 1000);
    }
  }, [itiCountdown]);

  // Trial countdown effect
  useEffect(() => {
    if (trialCountdown > 0 && isActive) {
      countdownTimerRef.current = setTimeout(() => {
        setTrialCountdown(prev => prev - 1);
      }, 1000);
    }
  }, [trialCountdown, isActive]);

  // End session when complete
  useEffect(() => {
    if (isSessionComplete) {
      endSession();
    }
  }, [isSessionComplete, endSession]);

  if (!currentTrialData && !isSessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Stroop Test</h2>
        <p className="text-gray-600 mb-6 text-center">
          Click the button below to start the Stroop test session.
        </p>
        <button
          onClick={startSession}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Test
        </button>
      </div>
    );
  }

  if (isSessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-green-600">Session Complete!</h2>
        <p className="text-gray-600 mb-4">You have completed the Stroop test.</p>
        <p className="text-sm text-gray-500">Total trials: {currentTrial - 1}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Stroop Test</h2>
        <p className="text-gray-600">Trial {currentTrial}</p>
        {itiCountdown > 0 && (
          <p className="text-blue-600 font-semibold">Next trial in: {itiCountdown}s</p>
        )}
        {trialCountdown > 0 && isActive && (
          <p className="text-red-600 font-semibold">Time remaining: {trialCountdown}s</p>
        )}
      </div>

      {/* Main trial area */}
      {currentTrialData && !itiCountdown && (
        <div className="text-center">
          {/* Instruction */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">
              {instruction === 'word' ? 'Choose the WORD' : 'Choose the COLOR'}
            </h3>
          </div>

          {/* Stimulus */}
          <div className="mb-8">
            <div 
              className={`text-6xl font-bold mb-8 transition-all duration-300 ${
                feedback === 'correct' ? 'bg-green-100 text-green-800' :
                feedback === 'incorrect' ? 'bg-red-100 text-red-800' :
                'bg-gray-50'
              }`}
              style={{ 
                color: currentTrialData.textColor,
                padding: '2rem',
                borderRadius: '0.5rem'
              }}
            >
              {currentTrialData.text}
            </div>
          </div>

          {/* Response buttons */}
          {!feedback && isActive && (
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleResponse(color)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    color === 'red' ? 'bg-red-500 hover:bg-red-600 text-white' :
                    color === 'blue' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                    color === 'green' ? 'bg-green-500 hover:bg-green-600 text-white' :
                    'bg-yellow-500 hover:bg-yellow-600 text-black'
                  }`}
                >
                  {color.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div className={`text-xl font-bold ${
              feedback === 'correct' ? 'text-green-600' : 'text-red-600'
            }`}>
              {feedback === 'correct' ? 'Correct!' : 'Incorrect!'}
            </div>
          )}

          {/* Trial info */}
          <div className="mt-6 text-sm text-gray-500">
            <p>Condition: {currentTrialData.condition}</p>
            {reactionTime && <p>Reaction time: {reactionTime}ms</p>}
          </div>
        </div>
      )}

      {/* ITI screen */}
      {itiCountdown > 0 && (
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-400 mb-4">+</div>
          <p className="text-gray-600">Preparing next trial...</p>
        </div>
      )}
    </div>
  );
}
