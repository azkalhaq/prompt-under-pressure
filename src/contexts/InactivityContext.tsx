"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useSessionContext } from './SessionContext'

type InactivityContextType = {
  isPaused: boolean
  isWarningVisible: boolean
  logoutCountdown: number
  resetTimers: () => void
  forceLogout: () => void
}

const InactivityContext = createContext<InactivityContextType | undefined>(undefined)

function parseDuration(input: string | undefined, fallbackMs: number): number {
  if (!input) return fallbackMs
  const s = input.trim().toLowerCase()
  if (/^\d+$/.test(s)) return parseInt(s, 10) * 1000
  const m = s.match(/^(\d+(?:\.\d+)?)(ms|s|m)$/)
  if (!m) return fallbackMs
  const value = parseFloat(m[1])
  const unit = m[2]
  switch (unit) {
    case 'ms': return Math.round(value)
    case 's': return Math.round(value * 1000)
    case 'm': return Math.round(value * 60 * 1000)
    default: return fallbackMs
  }
}

export function InactivityProvider({ children, warningDuration, logoutDuration }: { children: React.ReactNode; warningDuration?: string; logoutDuration?: string }) {
  const { userId, sessionId } = useSessionContext()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Only enable inactivity handling on specific routes
  const TIMEOUT_PATHS = useMemo(() => ['/task-1', '/task-2', '/task-3'], [])
  const isTimeoutEnabledHere = useMemo(() => {
    if (!pathname) return false
    return TIMEOUT_PATHS.includes(pathname)
  }, [pathname, TIMEOUT_PATHS])

  const warningMs = useMemo(() => {
    return parseDuration(warningDuration || process.env.NEXT_PUBLIC_SESSION_TIMEOUT_WARNING || process.env.SESSION_TIMEOUT_WARNING, 5 * 60 * 1000)
  }, [warningDuration])
  const logoutMs = useMemo(() => {
    return parseDuration(logoutDuration || process.env.NEXT_PUBLIC_SESSION_TIMEOUT_LOGOUT || process.env.SESSION_TIMEOUT_LOGOUT, 30 * 1000)
  }, [logoutDuration])

  const [isPaused, setIsPaused] = useState(false)
  const [isWarningVisible, setIsWarningVisible] = useState(false)
  const [logoutCountdown, setLogoutCountdown] = useState(Math.floor(logoutMs / 1000))

  const warningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasRecordedInactiveRef = useRef(false)

  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    warningTimerRef.current = null
    logoutTimerRef.current = null
    countdownIntervalRef.current = null
  }, [])

  const startWarningTimer = useCallback(() => {
    if (!isTimeoutEnabledHere) return
    clearAllTimers()
    hasRecordedInactiveRef.current = false
    warningTimerRef.current = setTimeout(() => {
      setIsPaused(true)
      setIsWarningVisible(true)
      setLogoutCountdown(Math.floor(logoutMs / 1000))
      // Notify listeners (e.g., StroopTest) to record last item as inactive
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('session-timeout-warning'))
      }
      // Start logout countdown
      countdownIntervalRef.current = setInterval(() => {
        setLogoutCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current as NodeJS.Timeout)
          }
          return Math.max(0, prev - 1)
        })
      }, 1000)
      logoutTimerRef.current = setTimeout(() => {
        void doLogout()
      }, logoutMs)
    }, warningMs)
  }, [clearAllTimers, warningMs, logoutMs, isTimeoutEnabledHere])

  const resetTimers = useCallback(() => {
    setIsPaused(false)
    setIsWarningVisible(false)
    clearAllTimers()
    if (isTimeoutEnabledHere) startWarningTimer()
  }, [clearAllTimers, startWarningTimer, isTimeoutEnabledHere])

  const doLogout = useCallback(async () => {
    clearAllTimers()
    setIsPaused(true)
    setIsWarningVisible(false)
    try {
      if (sessionId) {
        await fetch('/api/chat-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_session',
            data: { sessionId, updates: { end_time: new Date().toISOString() } }
          })
        })
      }
    } catch {}
    const target = new URL('/login', window.location.origin)
    target.searchParams.set('redirect', pathname || '/')
    const uParam = searchParams.get('u') || userId || ''
    if (uParam) target.searchParams.set('u', uParam)
    router.replace(target.pathname + '?' + target.searchParams.toString())
  }, [clearAllTimers, router, pathname, userId, sessionId, searchParams])

  const forceLogout = useCallback(() => { void doLogout() }, [doLogout])

  // Reset on route changes
  useEffect(() => {
    // If timeout not enabled on this route, ensure everything is cleared and hidden
    if (!isTimeoutEnabledHere) {
      setIsPaused(false)
      setIsWarningVisible(false)
      clearAllTimers()
      return
    }
    resetTimers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams, isTimeoutEnabledHere])

  // Attach activity listeners
  useEffect(() => {
    if (!isTimeoutEnabledHere) return
    const onActivity = () => {
      if (isWarningVisible) return
      startWarningTimer()
    }
    const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(evt => window.addEventListener(evt, onActivity, { passive: true }))
    startWarningTimer()
    return () => {
      events.forEach(evt => window.removeEventListener(evt, onActivity))
      clearAllTimers()
    }
  }, [startWarningTimer, clearAllTimers, isWarningVisible, isTimeoutEnabledHere])

  const value = useMemo(() => ({ isPaused, isWarningVisible, logoutCountdown, resetTimers, forceLogout }), [isPaused, isWarningVisible, logoutCountdown, resetTimers, forceLogout])

  // Derived UI values for countdown
  const totalSeconds = Math.max(1, Math.round(logoutMs / 1000))
  const mm = Math.floor(logoutCountdown / 60).toString().padStart(2, '0')
  const ss = Math.floor(logoutCountdown % 60).toString().padStart(2, '0')
  // Show remaining time as decreasing progress (100% -> 0%)
  const progressRemaining = Math.min(100, Math.max(0, Math.round((logoutCountdown / totalSeconds) * 100)))

  return (
    <InactivityContext.Provider value={value}>
      {children}
      {isWarningVisible && (
        <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true" aria-labelledby="session-timeout-title" aria-describedby="session-timeout-desc">
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
              <h2 id="session-timeout-title" className="text-xl font-semibold mb-2">Still with us?</h2>
              <div className="mb-3" aria-live="polite">
                <p id="session-timeout-desc" className="text-gray-700">
                  This experiment requires your full attention. You’ve been inactive for a while. We will log you out in <span className="font-semibold tabular-nums">{mm}:{ss}</span> and restart your session from the beginning, unless you confirm you’re still with us.
                </p>
              </div>
              <div className="mt-2 mb-5">
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden" aria-hidden="true">
                  <div className="h-full bg-blue-600 transition-[width] duration-1000 ease-linear" style={{ width: `${progressRemaining}%` }} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={resetTimers} className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">Continue Working</button>
                <button onClick={forceLogout} className="w-full px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800">Log Out Now</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </InactivityContext.Provider>
  )
}

export function useInactivity() {
  const ctx = useContext(InactivityContext)
  if (!ctx) throw new Error('useInactivity must be used within InactivityProvider')
  return ctx
}


