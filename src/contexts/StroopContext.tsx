"use client"
import React, { createContext, useContext, useState, useCallback } from 'react';

interface StroopContextType {
  shouldStartStroop: boolean;
  triggerStroopStart: () => void;
  resetStroopTrigger: () => void;
}

const StroopContext = createContext<StroopContextType | undefined>(undefined);

export function StroopProvider({ children }: { children: React.ReactNode }) {
  const [shouldStartStroop, setShouldStartStroop] = useState(false);

  const triggerStroopStart = useCallback(() => {
    setShouldStartStroop(true);
  }, []);

  const resetStroopTrigger = useCallback(() => {
    setShouldStartStroop(false);
  }, []);

  return (
    <StroopContext.Provider value={{
      shouldStartStroop,
      triggerStroopStart,
      resetStroopTrigger,
    }}>
      {children}
    </StroopContext.Provider>
  );
}

export function useStroopContext() {
  const context = useContext(StroopContext);
  if (context === undefined) {
    throw new Error('useStroopContext must be used within a StroopProvider');
  }
  return context;
}
