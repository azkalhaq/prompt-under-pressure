import { useEffect, useRef, useState, useCallback } from 'react';
import { shouldEnableAudio } from '@/utils/queryParams';

interface UseAudioOptions {
  audioFile?: string;
  volume?: number;
  loop?: boolean;
}

/**
 * Custom hook for managing background audio functionality
 * Audio only starts after user interaction (Get Started button click)
 */
export function useAudio(
  searchParams: URLSearchParams,
  options: UseAudioOptions = {}
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  // Use refs to track current state values for stable references
  const isAudioEnabledRef = useRef(isAudioEnabled);
  const hasUserInteractedRef = useRef(hasUserInteracted);

  const {
    audioFile = '/audio/crowd-waiting.wav',
    volume = 0.3,
    loop = true,
  } = options;

  // Check if audio should be enabled based on query params
  const shouldEnable = shouldEnableAudio(searchParams);

  useEffect(() => {
    console.log('🎵 Audio hook effect triggered, shouldEnable:', shouldEnable);
    
    if (!shouldEnable) {
      console.log('🎵 Audio disabled, cleaning up...');
      // Clean up audio if disabled
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch {}
      }
      setIsAudioEnabled(false);
      setIsAudioPlaying(false);
      return;
    }

    console.log('🎵 Audio enabled, initializing...');
    setIsAudioEnabled(true);

    // Initialize audio element
    if (!audioRef.current) {
      console.log('🎵 Creating new audio element:', audioFile);
      const audio = new Audio(audioFile);
      audio.loop = loop;
      audio.preload = 'auto';
      audio.volume = volume;
      audioRef.current = audio;
      console.log('🎵 Audio element created:', audio);
    }

    // Set up audio event listeners
    const audio = audioRef.current;
    
    const handlePlay = () => setIsAudioPlaying(true);
    const handlePause = () => setIsAudioPlaying(false);
    const handleEnded = () => setIsAudioPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [shouldEnable, audioFile, volume, loop]);

  // Update refs when state changes
  useEffect(() => {
    isAudioEnabledRef.current = isAudioEnabled;
  }, [isAudioEnabled]);

  useEffect(() => {
    hasUserInteractedRef.current = hasUserInteracted;
  }, [hasUserInteracted]);

  /**
   * Start audio playback (called after user interaction)
   */
  const startAudio = useCallback(async () => {
    console.log('🎵 startAudio called:', {
      hasAudioRef: !!audioRef.current,
      isAudioEnabled: isAudioEnabledRef.current,
      hasUserInteracted: hasUserInteractedRef.current
    });
    
    if (!audioRef.current || !isAudioEnabledRef.current || !hasUserInteractedRef.current) {
      console.log('🎵 Audio start blocked:', {
        noAudioRef: !audioRef.current,
        notEnabled: !isAudioEnabledRef.current,
        noInteraction: !hasUserInteractedRef.current
      });
      return false;
    }

    try {
      console.log('🎵 Attempting to play audio...');
      await audioRef.current.play();
      console.log('🎵 Audio started successfully!');
      return true;
    } catch (error) {
      console.warn('🎵 Failed to start audio:', error);
      return false;
    }
  }, []);

  /**
   * Stop audio playback
   */
  const stopAudio = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {}
    }
  };

  /**
   * Mark that user has interacted (e.g., clicked Get Started)
   * This enables audio playback
   */
  const markUserInteraction = useCallback(() => {
    setHasUserInteracted(true);
  }, []);

  // Listen for audio activation event from Sidebar
  useEffect(() => {
    const handleAudioActivation = async (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('🎵 Audio activation event received:', customEvent.detail);
      console.log('🎵 isAudioEnabled:', isAudioEnabled);
      
      if (customEvent.detail?.enabled && isAudioEnabled) {
        console.log('🎵 Starting audio playback...');
        setHasUserInteracted(true);
        // Automatically start playing audio after user interaction
        setTimeout(() => {
          startAudio();
        }, 100); // Small delay to ensure state is updated
      } else {
        console.log('🎵 Audio not enabled or event not valid');
      }
    };

    window.addEventListener('audioActivation', handleAudioActivation);
    
    return () => {
      window.removeEventListener('audioActivation', handleAudioActivation);
    };
  }, [isAudioEnabled, startAudio]);

  /**
   * Try to play audio after user interaction
   */
  const tryPlayAfterInteraction = useCallback(async () => {
    if (hasUserInteractedRef.current && isAudioEnabledRef.current) {
      return await startAudio();
    }
    return false;
  }, [startAudio]);

  return {
    isAudioEnabled,
    isAudioPlaying,
    hasUserInteracted,
    startAudio,
    stopAudio,
    markUserInteraction,
    tryPlayAfterInteraction,
  };
}
