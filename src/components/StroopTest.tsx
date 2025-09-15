"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { type StroopTrialData } from '@/lib/stroop-db';
import { useInactivity } from '@/contexts/InactivityContext';
import { useStroopContext } from '@/contexts/StroopContext';
import { useSubmission } from '@/contexts/SubmissionContext';

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

// Horizontal Progress Bar Component
const HorizontalProgress = ({ progress, color = '#3B82F6' }: {
  progress: number; // 0-100
  color?: string;
}) => {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden dark:bg-gray-700">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ 
            width: `${progress}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
};

export default function StroopTest({ userId, sessionId }: { userId: string; sessionId: string }) {
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
  const [autoStarted, setAutoStarted] = useState(false);
  
  // Game statistics
  const [stats, setStats] = useState({
    totalTrials: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    skippedTrials: 0
  });

  // Get Stroop context
  const { shouldStartStroop, resetStroopTrigger } = useStroopContext();
  const { isPaused: isGloballyPaused } = useInactivity();
  const { isSubmissionModalOpen } = useSubmission();
  
  // Combined pause state - pause if either inactivity timeout or submission modal is open
  const isFullyPaused = isGloballyPaused || isSubmissionModalOpen;

  // Refs for timers
  const itiTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Configuration from environment variables
  const config: StroopConfig = {
    iti: parseInt(process.env.NEXT_PUBLIC_STROOP_ITI || '1000'),
    trialTimer: parseInt(process.env.NEXT_PUBLIC_STROOP_TRIAL_TIMER || '5000'),
    instructionSwitchTrials: parseInt(process.env.NEXT_PUBLIC_STROOP_INSTRUCTION_SWITCH || '10')
  };



  // Start a new trial
  const startTrial = useCallback((newInstruction?: 'word' | 'color') => {
    const instructionToUse = newInstruction || instruction;
    
    console.log('Start Trial Debug:', {
      currentInstruction: instruction,
      newInstruction: instructionToUse,
      currentTrial
    });
    
    // Generate trial with the correct instruction
    const randomWord = COLOR_WORDS[Math.floor(Math.random() * COLOR_WORDS.length)];
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    // 50% chance of consistent/inconsistent
    const isConsistent = Math.random() > 0.5;
    const textColor = isConsistent ? randomWord.toLowerCase() : randomColor;
    const condition = isConsistent ? 'consistent' : 'inconsistent';
    
    // Determine correct answer based on instruction
    let correctAnswer: string;
    if (instructionToUse === 'word') {
      // When instruction is "word", the correct answer is the word itself (lowercase)
      correctAnswer = randomWord.toLowerCase();
    } else {
      // When instruction is "color", the correct answer is the color of the text
      correctAnswer = textColor;
    }
    
    const trial = {
      instruction: instructionToUse,
      text: randomWord,
      textColor,
      condition: condition as 'consistent' | 'inconsistent',
      correctAnswer
    };
    
    setCurrentTrialData(trial);
    setReactionTime(null);
    setFeedback(null);
    setTrialStartTime(Date.now());
    setIsActive(true);
    setIsPaused(false);

    // Start trial countdown if timer is set
    if (config.trialTimer > 0) {
      setTrialCountdown(config.trialTimer / 1000);
    }
  }, [config.trialTimer, instruction, currentTrial]);

  // Save trial data to database
  const saveTrialData = useCallback(async (rt: number | null, correctness: boolean | null, userAnswer: string | null) => {
    if (!currentTrialData) return;
    // Do not record when paused, except for explicit 'inactive' marker
    if (isFullyPaused && userAnswer !== 'inactive') return;
    
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
      correctness: correctness,
      user_answer: userAnswer
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
  }, [currentTrialData, userId, sessionId, currentTrial, config.iti, isFullyPaused]);

  // Move to next trial
  const nextTrial = useCallback(() => {
    // Check if instruction should switch BEFORE incrementing trial number
    const shouldSwitchInstruction = currentTrial % config.instructionSwitchTrials === 0;
    
    // Debug logging
    console.log('Next Trial Debug:', {
      currentTrial,
      instructionSwitchTrials: config.instructionSwitchTrials,
      shouldSwitchInstruction,
      currentInstruction: instruction
    });
    
    // Determine the instruction for the next trial
    let nextInstruction = instruction;
    if (shouldSwitchInstruction) {
      nextInstruction = instruction === 'word' ? 'color' : 'word';
      console.log('Switching instruction from', instruction, 'to', nextInstruction);
      setInstruction(nextInstruction);
    }
    
    console.log(`Advancing from trial ${currentTrial} to trial ${currentTrial + 1}`);
    setCurrentTrial(prev => prev + 1);
    setIsActive(false);
    setIsPaused(false);
    setFeedback(null);
    setReactionTime(null);
    setTrialStartTime(null);
    
    // Start ITI countdown
    if (config.iti > 0) {
      setItiCountdown(config.iti / 1000);
      itiTimerRef.current = setTimeout(() => {
        startTrial(nextInstruction);
      }, config.iti);
    } else {
      startTrial(nextInstruction);
    }
  }, [currentTrial, config.instructionSwitchTrials, config.iti, startTrial, instruction]);

  // Handle user response
  const handleResponse = useCallback((selectedAnswer: string) => {
    if (!currentTrialData || !isActive || isPaused || isFullyPaused) return;
    
    const endTime = Date.now();
    const rt = trialStartTime ? endTime - trialStartTime : null;
    const isCorrect = selectedAnswer === currentTrialData.correctAnswer;
    
    // Debug logging
    console.log('Stroop Debug:', {
      instruction: currentTrialData.instruction,
      text: currentTrialData.text,
      textColor: currentTrialData.textColor,
      condition: currentTrialData.condition,
      correctAnswer: currentTrialData.correctAnswer,
      selectedAnswer,
      isCorrect
    });
    
    setReactionTime(rt);
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setIsActive(false);
    
    // Update statistics
    setStats(prev => ({
      totalTrials: prev.totalTrials + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      incorrectAnswers: prev.incorrectAnswers + (isCorrect ? 0 : 1),
      skippedTrials: prev.skippedTrials
    }));
    
    // Clear trial countdown
    setTrialCountdown(0);
    
    // Save trial data
    saveTrialData(rt, isCorrect, selectedAnswer);
    
    // Show feedback and move to next trial
    setTimeout(() => {
      nextTrial();
    }, 1000);
  }, [currentTrialData, isActive, isPaused, isFullyPaused, trialStartTime, saveTrialData, nextTrial]);

  // When inactivity warning fires, record current trial as inactive (once)
  useEffect(() => {
    const onWarn = () => {
      if (!currentTrialData) return
      // Persist inactive status via API to update last row reliably
      try {
        fetch('/api/stroop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'mark_last_inactive',
            data: { user_id: userId, session_id: sessionId }
          })
        }).catch(() => {})
      } catch {}
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('session-timeout-warning', onWarn as EventListener)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('session-timeout-warning', onWarn as EventListener)
      }
    }
  }, [currentTrialData, userId, sessionId])

  // Start session
  const startSession = useCallback(async () => {
    try {
      // Update session with stroop start time
      await fetch('/api/chat-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_session',
          data: { 
            sessionId, 
            updates: { start_stroop_time: new Date().toISOString() }
          }
        })
      });
      
      startTrial(instruction);
    } catch (error) {
      console.error('Failed to update session with stroop start time:', error);
      // Continue with the trial even if session update fails
      startTrial(instruction);
    }
  }, [sessionId, startTrial, instruction]);

  // End session
  const endSession = useCallback(async () => {
    try {
      await fetch('/api/chat-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_session',
          data: { 
            sessionId, 
            updates: {
              end_time: new Date().toISOString() 
            }
          }
        })
      });
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }, [sessionId]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (itiTimerRef.current) clearTimeout(itiTimerRef.current);
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    };
  }, []);

  // ITI countdown effect
  useEffect(() => {
    if (itiCountdown > 0 && !isFullyPaused) {
      countdownTimerRef.current = setTimeout(() => {
        setItiCountdown(prev => prev - 1);
      }, 1000);
    }
  }, [itiCountdown, isFullyPaused]);

  // Trial countdown effect
  useEffect(() => {
    if (trialCountdown > 0 && isActive && !isFullyPaused) {
      countdownTimerRef.current = setTimeout(() => {
        setTrialCountdown(prev => {
          const newCountdown = prev - 1;
          return newCountdown;
        });
      }, 1000);
    }
  }, [trialCountdown, isActive, isFullyPaused]);

  // Handle trial timeout when countdown reaches 0
  useEffect(() => {
    // Only treat countdown reaching 0 as a timeout if a trial timer is configured (> 0)
    // Don't process timeout when paused (session timeout modal or submission modal is showing)
    if (config.trialTimer > 0 && trialCountdown === 0 && isActive && currentTrialData && trialStartTime && !feedback && !isFullyPaused) {
      // Trial has timed out, handle it (only if no feedback yet)
      console.log('Trial timeout detected - advancing to next trial');
      const endTime = Date.now();
      const rt = endTime - trialStartTime;
      saveTrialData(rt, null, null); // null for user answer when timeout occurs
      setFeedback('incorrect');
      setIsActive(false); // Stop the trial
      
      // Update statistics for skipped trial
      setStats(prev => ({
        totalTrials: prev.totalTrials + 1,
        correctAnswers: prev.correctAnswers,
        incorrectAnswers: prev.incorrectAnswers,
        skippedTrials: prev.skippedTrials + 1
      }));
      
      setTimeout(() => {
        nextTrial();
      }, 1000);
    }
  }, [trialCountdown, isActive, currentTrialData, trialStartTime, saveTrialData, nextTrial, feedback, config.trialTimer, isFullyPaused]);

  // End session when complete
  useEffect(() => {
    if (isSessionComplete) {
      endSession();
    }
  }, [isSessionComplete, endSession]);

  // Auto-start when triggered from sidebar
  useEffect(() => {
    console.log('StroopTest useEffect - shouldStartStroop:', shouldStartStroop, 'autoStarted:', autoStarted, 'isActive:', isActive, 'currentTrialData:', !!currentTrialData)
    
    if (shouldStartStroop && !autoStarted && !isActive && !currentTrialData) {
      console.log('Auto-starting Stroop test from sidebar trigger...')
      setAutoStarted(true);
      resetStroopTrigger();
      startSession();
    }
  }, [shouldStartStroop, autoStarted, isActive, currentTrialData, startSession, resetStroopTrigger]);

  if (!currentTrialData && !isSessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-white rounded-lg shadow-lg dark:bg-[#0b0b0b] ">
        {/* <p className="text-gray-600 mb-6 text-center dark:text-gray-400">
          Click the button to start the session.
        </p> */}
        {/* <button
          onClick={startSession}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Test
        </button> */}
      </div>
    );
  }

  if (isSessionComplete) {
    const accuracy = stats.totalTrials > 0 ? Math.round((stats.correctAnswers / stats.totalTrials) * 100) : 0;
    
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg shadow-lg dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold mb-4 text-green-600">Session Complete!</h2>
          <p className="text-gray-600 mb-6 dark:text-gray-300">You have completed the Stroop Challenge!</p>
          
          {/* Final Statistics */}
          <div className="bg-white rounded-xl p-6 shadow-lg dark:bg-[#0b0b0b]">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Final Score</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalTrials}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Trials</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{accuracy}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <div className="font-bold text-green-600">{stats.correctAnswers}</div>
                <div className="text-gray-600 dark:text-gray-400">Correct</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-red-600">{stats.incorrectAnswers}</div>
                <div className="text-gray-600 dark:text-gray-400">Wrong</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-orange-600">{stats.skippedTrials}</div>
                <div className="text-gray-600 dark:text-gray-400">Skipped</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate progress for horizontal progress bar (countdown from 100% to 0%)
  const getProgress = () => {
    if (itiCountdown > 0) {
      const totalIti = Math.ceil(config.iti / 1000);
      return (itiCountdown / totalIti) * 100;
    }
    if (trialCountdown > 0 && isActive) {
      const totalTrial = Math.ceil(config.trialTimer / 1000);
      return (trialCountdown / totalTrial) * 100;
    }
    return 0;
  };

  const getProgressColor = () => {
    if (itiCountdown > 0) return '#3B82F6'; // Blue for ITI
    if (trialCountdown > 0 && isActive) return '#EF4444'; // Red for trial countdown
    return '#3B82F6';
  };

  return (
    <div className={`flex flex-col h-full p-6 rounded-lg shadow-lg transition-all duration-300 ${
      feedback === 'correct' ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800' :
      feedback === 'incorrect' ? 'bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-gray-800' :
      'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-black'
    }`}>
      {/* Game Header with Stats */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="bg-white rounded-lg px-4 py-2 shadow-md dark:bg-[#0b0b0b]">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">🎮 Stroop Task</h2>
          </div>
          <div className="bg-white rounded-lg px-3 py-2 shadow-md dark:bg-[#0b0b0b]">
            <span className="text-sm text-gray-600 dark:text-gray-400">Trial </span>
            <span className="font-bold text-lg text-blue-600">{currentTrial}</span>
          </div>
        </div>
        
        {/* Game Statistics */}
        <div className="flex space-x-3">
          <div className="bg-white rounded-lg px-3 py-2 shadow-md text-center min-w-[60px] dark:bg-[#0b0b0b]">
            <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
            <div className="font-bold text-lg text-gray-800 dark:text-gray-100">{stats.totalTrials}</div>
          </div>
          <div className="bg-white rounded-lg px-3 py-2 shadow-md text-center min-w-[60px] dark:bg-[#0b0b0b]">
            <div className="text-xs text-green-600">✓ Correct</div>
            <div className="font-bold text-lg text-green-600">{stats.correctAnswers}</div>
          </div>
          <div className="bg-white rounded-lg px-3 py-2 shadow-md text-center min-w-[60px] dark:bg-[#0b0b0b]">
            <div className="text-xs text-red-600">✗ Wrong</div>
            <div className="font-bold text-lg text-red-600">{stats.incorrectAnswers}</div>
          </div>
          <div className="bg-white rounded-lg px-3 py-2 shadow-md text-center min-w-[60px] dark:bg-[#0b0b0b]">
            <div className="text-xs text-orange-600">⏭ Skip</div>
            <div className="font-bold text-lg text-orange-600">{stats.skippedTrials}</div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Timer Section */}
        <div className="mb-8">
          {itiCountdown > 0 && (
            <div className="text-center">
              <HorizontalProgress 
                progress={getProgress()} 
                color={getProgressColor()} 
              />
              <p className="text-lg font-semibold text-blue-600 mt-2">
                Next trial in: {itiCountdown}s
              </p>
            </div>
          )}
          
          {trialCountdown > 0 && isActive && (
            <div className="text-center">
              <HorizontalProgress 
                progress={getProgress()} 
                color={getProgressColor()} 
              />
              <p className="text-lg font-semibold text-red-600 mt-2">
                Time remaining: {trialCountdown}s
              </p>
            </div>
          )}
        </div>

        {/* Main trial area */}
        {currentTrialData && !itiCountdown && (
          <div className="text-center max-w-2xl w-full">
            {/* Instruction */}
            <div className="mb-8">
              <div className="bg-white rounded-xl px-6 py-4 shadow-lg inline-block dark:bg-[#0b0b0b]">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {instruction === 'word' ? '🎯 Choose the WORD' : '🎨 Choose the COLOR'}
                </h3>
              </div>
            </div>

            {/* Stimulus */}
            <div className="mb-10">
              <div 
                className="text-8xl font-bold mb-8 transition-all duration-300 bg-white shadow-2xl rounded-2xl border-4 border-gray-200 dark:bg-[#0b0b0b] dark:border-gray-800"
                style={{ 
                  color: currentTrialData.textColor,
                  padding: '3rem',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {currentTrialData.text}
              </div>
            </div>

            {/* Response buttons */}
            {!feedback && isActive && (
              <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
                {instruction === 'word' ? (
                  // Show word buttons when instruction is "word"
                  COLOR_WORDS.map((word) => (
                    <button
                      key={word}
                      onClick={() => handleResponse(word.toLowerCase())}
                      className={`px-8 py-4 rounded-xl font-bold text-xl transition-all duration-200 transform hover:scale-105 shadow-lg ${
                        word === 'RED' ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200' :
                        word === 'BLUE' ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200' :
                        word === 'GREEN' ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-200' :
                        'bg-yellow-500 hover:bg-yellow-600 text-white shadow-yellow-200'
                      }`}
                    >
                      {word}
                    </button>
                  ))
                ) : (
                  // Show color buttons when instruction is "color"
                  COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleResponse(color)}
                      className={`px-8 py-4 rounded-xl font-bold text-xl transition-all duration-200 transform hover:scale-105 shadow-lg ${
                        color === 'red' ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200' :
                        color === 'blue' ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200' :
                        color === 'green' ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-200' :
                        'bg-yellow-500 hover:bg-yellow-600 text-white shadow-yellow-200'
                      }`}
                    >
                      {color.toUpperCase()}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <div className={`text-4xl font-bold mb-4 ${
                feedback === 'correct' ? 'text-green-600' : 'text-red-600'
              }`}>
                {feedback === 'correct' ? '🎉 Correct!' : '❌ Incorrect!'}
              </div>
            )}

            {/* Reaction time display */}
            {reactionTime && (
              <div className="bg-white rounded-lg px-4 py-2 shadow-md inline-block dark:bg-[#0b0b0b]">
                <span className="text-sm text-gray-600 dark:text-gray-400">Reaction time: </span>
                <span className="font-bold text-lg text-gray-800 dark:text-gray-100">{reactionTime}ms</span>
              </div>
            )}
          </div>
        )}

        {/* ITI screen */}
        {itiCountdown > 0 && (
          <div className="text-center">
            <div className="text-6xl font-bold text-gray-400 mb-4 animate-pulse">⏳</div>
            <p className="text-xl text-gray-600 font-semibold dark:text-gray-300">Preparing next trial...</p>
          </div>
        )}
      </div>
    </div>
  );
}
