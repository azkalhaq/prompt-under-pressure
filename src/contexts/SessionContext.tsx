"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { collectBrowserFingerprint } from '@/utils/browserFingerprint';

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
  const [sessionEnsured, setSessionEnsured] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const getUserId = () => {
      const urlParams = new URLSearchParams(window.location.search);
      return (urlParams.get('u') || 'anonymous').slice(0, 100);
    };

    const currentUserId = getUserId();
    setUserId(currentUserId);

    // Always create a fresh session on first load
    const newSessionId = crypto.randomUUID();
    console.log(`Generated new session ID on load: ${newSessionId}`);
    setSessionId(newSessionId);
    document.cookie = `sid=${newSessionId}; Path=/; SameSite=Lax; Max-Age=15552000`;
    
    setIsLoading(false);
  }, []);

  // Create a fresh session when route changes
  useEffect(() => {
    if (!pathname) return;
    const newSessionId = crypto.randomUUID();
    console.log(`Generated new session ID on route change (${pathname}): ${newSessionId}`);
    setSessionEnsured(false);
    setSessionId(newSessionId);
    document.cookie = `sid=${newSessionId}; Path=/; SameSite=Lax; Max-Age=15552000`;
  }, [pathname]);

  // Create session when sessionId and userId are available
  useEffect(() => {
    if (sessionId && userId && !sessionEnsured && !isCreatingSession) {
      const ensureSession = async () => {
        setIsCreatingSession(true);
        try {
          console.log(`Creating (or ensuring) session in database: ${sessionId} for user: ${userId}`);
          const browserData = collectBrowserFingerprint();
          const resp = await fetch('/api/chat-db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create_session',
              data: {
                userId,
                sessionId,
                routePath: window.location.pathname,
                browserData
              }
            })
          });
          if (!resp.ok) {
            const text = await resp.text();
            console.error('Create session failed:', resp.status, text);
          } else {
            console.log('Create session OK');
          }
          setSessionEnsured(true);
        } catch (error) {
          console.error('Failed to create session on load:', error);
        } finally {
          setIsCreatingSession(false);
        }
      };

      ensureSession();
    }
  }, [sessionId, userId, sessionEnsured, isCreatingSession]);

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
