"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SessionContextType {
  sessionId: string | null;
  userId: string | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  useEffect(() => {
    // Try to get session ID from cookie first
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const getUserId = () => {
      const urlParams = new URLSearchParams(window.location.search);
      return (urlParams.get('u') || 'anonymous').slice(0, 100);
    };

    const cookieSessionId = getCookie('sid');
    const currentUserId = getUserId();
    setUserId(currentUserId);

    if (cookieSessionId) {
      console.log(`Found existing session ID in cookie: ${cookieSessionId}`);
      setSessionId(cookieSessionId);
    } else {
      // Generate new session ID if none exists
      const newSessionId = crypto.randomUUID();
      console.log(`Generated new session ID: ${newSessionId}`);
      setSessionId(newSessionId);
      
      // Set cookie (removed HttpOnly since we need to read it client-side)
      document.cookie = `sid=${newSessionId}; Path=/; SameSite=Lax; Max-Age=15552000`;
    }
    
    setIsLoading(false);
  }, []);

  // Create session when sessionId and userId are available
  useEffect(() => {
    if (sessionId && userId && !isCreatingSession) {
      const ensureSession = async () => {
        setIsCreatingSession(true);
        try {
          // First check if session already exists
          const sessionResponse = await fetch('/api/chat-db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'get_session',
              data: { sessionId }
            })
          });
          
          const sessionData = await sessionResponse.json();
          
          // Only create session if it doesn't exist
          if (!sessionData.session) {
            console.log(`Creating new session in database: ${sessionId} for user: ${userId}`);
            await fetch('/api/chat-db', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'create_session',
                data: { userId, sessionId }
              })
            });
          } else {
            console.log(`Session already exists in database: ${sessionId} for user: ${userId}`);
          }
        } catch (error) {
          console.error('Failed to ensure session exists:', error);
        } finally {
          setIsCreatingSession(false);
        }
      };

      ensureSession();
    }
  }, [sessionId, userId, isCreatingSession]);

  // Handle browser close/refresh to update session end time
  useEffect(() => {
    if (sessionId) {
      const handleBeforeUnload = async () => {
        try {
          // Use sendBeacon for reliable delivery when page is unloading
          const data = JSON.stringify({
            action: 'update_session',
            data: { 
              sessionId, 
              updates: { end_time: new Date().toISOString() }
            }
          });
          
          if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/chat-db', data);
          } else {
            // Fallback for browsers that don't support sendBeacon
            await fetch('/api/chat-db', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: data,
              keepalive: true
            });
          }
          console.log('Session end time updated on browser close');
        } catch (error) {
          console.error('Failed to update session end time on browser close:', error);
        }
      };

      // Listen for beforeunload event (browser close, refresh, navigation)
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // Also listen for pagehide event for better coverage
      window.addEventListener('pagehide', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('pagehide', handleBeforeUnload);
      };
    }
  }, [sessionId]);

  return (
    <SessionContext.Provider value={{ sessionId, userId, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context.sessionId;
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
}
