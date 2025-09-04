"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, Suspense, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { collectBrowserFingerprint } from '@/utils/browserFingerprint';
import { getUserIdentifier, getQueryParamsForDatabase } from '@/utils/queryParams';

interface SessionContextType {
  sessionId: string | null;
  userId: string | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

function SessionProviderContent({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionEnsured, setSessionEnsured] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const currentUserId = getUserIdentifier(searchParams).slice(0, 100);
    setUserId(currentUserId);

    // Always create a fresh session on first load
    const newSessionId = crypto.randomUUID();
    console.log(`Generated new session ID on load: ${newSessionId}`);
    setSessionId(newSessionId);
    document.cookie = `sid=${newSessionId}; Path=/; SameSite=Lax; Max-Age=15552000`;
    
    setIsLoading(false);
  }, [searchParams]);

  // Track previous session and route to record end_time on SPA navigations
  const previousSessionIdRef = useRef<string | null>(null);
  const previousPathnameRef = useRef<string | null>(null);

  // Create a fresh session when route changes and close the previous one with end_time
  useEffect(() => {
    if (!pathname) return;

    const closePreviousAndStartNew = async () => {
      const prevSessionId = previousSessionIdRef.current ?? sessionId;
      const prevPath = previousPathnameRef.current;
      // If there is a previous session (same-page subsequent navigations or initial), close it
      if (prevSessionId && prevPath !== pathname) {
        try {
          await fetch('/api/chat-db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update_session',
              data: {
                sessionId: prevSessionId,
                updates: { end_time: new Date().toISOString() }
              }
            })
          });
          console.log('Recorded end_time for previous session on route change:', prevSessionId);
        } catch (error) {
          console.error('Failed to record end_time on route change:', error);
        }
      }

      // Start a new session id for the new route
      const newSessionId = crypto.randomUUID();
      console.log(`Generated new session ID on route change (${pathname}): ${newSessionId}`);
      setSessionEnsured(false);
      setSessionId(newSessionId);
      document.cookie = `sid=${newSessionId}; Path=/; SameSite=Lax; Max-Age=15552000`;

      // Update refs for next navigation
      previousSessionIdRef.current = newSessionId;
      previousPathnameRef.current = pathname;
    };

    closePreviousAndStartNew();
  }, [pathname]);

  // Create session when sessionId and userId are available
  useEffect(() => {
    if (sessionId && userId && !sessionEnsured && !isCreatingSession) {
      const ensureSession = async () => {
        setIsCreatingSession(true);
        try {
          // Never create a DB session on the Thank You page
          if (typeof window !== 'undefined' && window.location.pathname === '/thank-you') {
            console.log('Skipping create_session on /thank-you route');
            setSessionEnsured(true);
            return;
          }
          // Middleware now handles submission checks; always allow session creation here
          console.log(`Creating (or ensuring) session in database: ${sessionId} for user: ${userId}`);
          const browserData = collectBrowserFingerprint();
          const queryParams = getQueryParamsForDatabase(searchParams);
          const resp = await fetch('/api/chat-db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create_session',
              data: {
                userId,
                sessionId,
                routePath: window.location.pathname,
                browserData,
                ...queryParams
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
  }, [sessionId, userId, sessionEnsured, isCreatingSession, searchParams]);

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

export function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    }>
      <SessionProviderContent>
        {children}
      </SessionProviderContent>
    </Suspense>
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
