"use client"
import React, { useEffect, useState, Suspense } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { useInactivity } from '@/contexts/InactivityContext'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { RxQuestionMark, RxCross2 } from 'react-icons/rx'
import { useSessionContext } from '../contexts/SessionContext'
import { useStroopContext } from '../contexts/StroopContext'
import { useSubmission } from '../contexts/SubmissionContext'
import SubmissionForm from './SubmissionForm'
 
import { useSearchParams } from 'next/navigation'
import { shouldEnableAudio } from '@/utils/queryParams'

type SidebarProps = {
  collapsed: boolean
  onToggleSidebar?: () => void
}

function SidebarContent({ collapsed, onToggleSidebar }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const effectiveSearchParams = React.useMemo(() => {
    const sp = new URLSearchParams(searchParams.toString())
    // Only default audio=1 on task-2; preserve behavior on other routes
    if (pathname === '/task-2' && sp.get('audio') === null) {
      sp.set('audio', '1')
    }
    return sp
  }, [searchParams, pathname])
  const { isPaused } = useInactivity()
  const [showSubmit, setShowSubmit] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const { sessionId, userId } = useSessionContext()
  const { triggerStroopStart } = useStroopContext()
  const { isSubmissionModalOpen, openSubmissionModal, closeSubmissionModal } = useSubmission()
  const [markdown, setMarkdown] = useState<string>('')
  const [isLoadingMd, setIsLoadingMd] = useState<boolean>(true)
  const [mdError, setMdError] = useState<string | null>(null)
  
  // Get Started countdown configuration (default 10s if not provided)
  const rawStartDelay = process.env.NEXT_PUBLIC_GET_STARTED_DELAY_SECONDS
  const configuredStartDelay = rawStartDelay && rawStartDelay.trim() !== '' ? Number(rawStartDelay) : NaN
  const startDelaySeconds = Number.isFinite(configuredStartDelay) ? configuredStartDelay : 10
  const [remainingStartDelay, setRemainingStartDelay] = useState<number>(
    Math.max(0, Math.floor(startDelaySeconds))
  )
  
  // Check if audio should be enabled (default to enabled if param missing)
  const isAudioEnabled = shouldEnableAudio(effectiveSearchParams)

  // Check if we're on a page that has the StroopTest component
  const hasStroopTest = pathname === '/task-2'

  // TODO: Implement get started functionality
  const handleGetStarted = async () => {
    try {
      console.log('Get Started clicked, hasStroopTest:', hasStroopTest, 'pathname:', pathname)
      
      // 1. Collapse the sidebar
      if (onToggleSidebar) {
        onToggleSidebar()
      }

      // 2. Set showSubmit to true
      setShowSubmit(true)

      // 3. Trigger Stroop test start if available
      if (hasStroopTest) {
        console.log('Triggering Stroop test start...')
        triggerStroopStart()
      } else {
        console.log('No Stroop test available on this page')
      }

      // 4. Record task_start_time timestamp in user_sessions table
      if (sessionId && userId) {
        await fetch('/api/chat-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_session',
            data: {
              sessionId,
              updates: {
                task_start_time: new Date().toISOString()
              }
            }
          })
        })
        console.log('Task start time recorded successfully')
      }

      // 5. Trigger audio activation if enabled
      if (isAudioEnabled) {
        console.log('🎵 Audio enabled, triggering audio activation')
        // Dispatch custom event to notify pages that audio should start
        const audioEvent = new CustomEvent('audioActivation', { detail: { enabled: true } })
        window.dispatchEvent(audioEvent)
        console.log('🎵 Audio activation event dispatched:', audioEvent)
      } else {
        console.log('🎵 Audio not enabled for this session')
      }
    } catch (error) {
      console.error('Error in handleGetStarted:', error)
    }
  }

  // TODO: Implement submit functionality
  const handleSubmit = () => {
    // Collapse the sidebar when showing the modal
    if (onToggleSidebar) {
      onToggleSidebar()
    }
    openSubmissionModal()
  }

  const handleSubmissionFormSubmit = async (data: { content: string; confidence: number; audio_code?: string }) => {
    console.log('Submission data:', data)
    
    try {
      // Save submission data to user_sessions table
      if (sessionId && userId) {
        await fetch('/api/chat-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_session',
            data: { 
              sessionId, 
              updates: { 
                submitted_result: data.content,
                confidence: data.confidence,
                audio_code: data.audio_code || null,
                submit_time: new Date().toISOString(), // Record when submission was made
              }
            }
          })
        })
        console.log('Submission data saved successfully')
        
        // Show success message
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 3000) // Hide after 3 seconds
      }
    } catch (error) {
      console.error('Failed to save submission data:', error)
    }
    
    closeSubmissionModal()
    // Redirect to Thank You with userId parameter
    const thankYouUrl = new URL('/thank-you', window.location.origin);
    if (userId) {
      thankYouUrl.searchParams.set('u', userId);
    }
    router.push(thankYouUrl.pathname + '?' + thankYouUrl.searchParams.toString())
  }

  const handleSubmissionFormClose = () => {
    closeSubmissionModal()
  }

  // Load markdown content from public files based on route
  useEffect(() => {
    const routeToFile: Record<string, string> = {
      '/': '/content/home.md',
      '/task-1': '/content/task-1.md',
      '/task-2': '/content/task-2.md',
      '/task-3': '/content/task-3.md',
    }
    const mdPath = routeToFile[pathname] || routeToFile['/']
    setIsLoadingMd(true)
    setMdError(null)
    fetch(mdPath)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load ${mdPath}`)
        const text = await res.text()
        setMarkdown(text)
        setIsLoadingMd(false)
      })
      .catch((err) => {
        console.error('Failed to load markdown:', err)
        setMdError('Failed to load instructions.')
        setIsLoadingMd(false)
      })
  }, [pathname])

  // Countdown timer for enabling the Get Started button
  useEffect(() => {
    if (remainingStartDelay <= 0) return
    const intervalId = setInterval(() => {
      setRemainingStartDelay((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(intervalId)
  }, [remainingStartDelay])

  const isGetStartedEnabled = remainingStartDelay <= 0 && !isPaused

  return (
    <>
      {/* Help button - only show when sidebar is collapsed */}
      {collapsed && (
        <button
          aria-label='Show scenario instructions'
          onClick={onToggleSidebar}
          className='fixed top-4 left-4 z-30 p-2 rounded-lg hover:bg-gray-800 active:scale-[0.98] bg-black shadow-lg border border-gray-800 transition-all duration-200 group overflow-hidden dark:bg-white dark:text-black dark:hover:bg-gray-200 dark:border-gray-300'
        >
          <div className='flex items-center'>
            <RxQuestionMark className="text-white dark:text-black flex-shrink-0 font-bold text-lg" />
            <span className='text-sm text-white dark:text-black ml-1 group-hover:max-w-32 transition-all duration-200 overflow-hidden whitespace-nowrap ml-0 group-hover:ml-2'>
              Show instructions
            </span>
          </div>
        </button>
      )}

      {/* Overlay - only show when sidebar is open */}
      {!collapsed && (
        <div
          className={`fixed inset-0 z-10 transition-opacity duration-300 ${showSubmit ? 'bg-black/50 cursor-pointer' : 'bg-black/50 cursor-not-allowed'
            } dark:bg-black/60`}
          onClick={showSubmit ? onToggleSidebar : undefined}
          aria-label={showSubmit ? "Close sidebar overlay" : "Sidebar cannot be closed until you get started"}
        />
      )}

      {/* Overlay sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-2xl transition-all duration-300 ease-in-out z-20 border-r border-gray-200 ${collapsed
          ? 'w-0 opacity-0 pointer-events-none'
          : 'w-full md:w-1/2 2xl:w-1/2 opacity-100'
          } dark:bg-[#0b0b0b] dark:border-gray-800`}
      >
        {/* Header with close button */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 dark:bg-[#0f0f0f] dark:border-gray-800'>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>Instructions</h2>
          <button
            aria-label={showSubmit ? 'Close sidebar' : 'Sidebar cannot be closed until you get started'}
            onClick={showSubmit ? onToggleSidebar : undefined}
            disabled={!showSubmit}
            className={`p-2 rounded-lg transition-all duration-200 ${showSubmit
              ? 'hover:bg-gray-200 active:scale-[0.98] text-gray-600 dark:hover:bg-gray-800 dark:text-gray-300'
              : 'text-gray-400 cursor-not-allowed opacity-50'
              }`}
          >
            <RxCross2 className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div className='px-6 text-sm text-gray-700 overflow-y-auto flex-1 h-[calc(100%-10rem)] dark:text-gray-300'>
          {/* Instructions Section */}
          {/* <div className='flex rounded-2xl p-4 bg-sky-50 dark:bg-slate-800/60 dark:ring-1 dark:ring-slate-300/10'>
            <LuInfo className="h-6 w-6 flex-none text-sky-600" />
            <div className="ml-4 flex-auto">
              <p className="not-prose font-display text-xl text-sky-900 dark:text-sky-400">Step by step</p>
              <div className="prose mt-2.5 text-sky-800 [--tw-prose-background:var(--color-sky-50)] prose-a:text-sky-900 prose-code:text-sky-900 dark:text-slate-300 dark:prose-code:text-slate-300">
                <ol className="list-decimal list-inside space-y-2">
                  <li className="mb-0">
                    Read the <b>task details</b> and <b>constraints</b>.
                  </li>
                  <li className="mb-0">
                    Click <b>Get Started</b>, then chat with the AI/LLM to complete the task. 
                  </li>
                  <li className="mb-0">
                    If the output isn’t good enough, <b>re-prompt until satisfied</b>.
                  </li>
                  <li className="mb-0">
                    When ready, click <b>Submit</b> button below 👇.
                  </li>
                  <li className="mb-0">
                    Use the AI’s response — or adapt it with your own ideas — in the submission form.
                  </li>
                  <li className="mb-0">
                    Fill and submit the form to finish.
                  </li>
                </ol>
                <br />
                <p className="text-sm italic">
                  💡 Tip: You can reopen these instructions anytime via the <b>?</b> button (top-left).
                </p>
              </div>
            </div>
          </div> */}
          
          {/* Markdown Section */}
          <div
            className='prose prose-sm max-w-none dark:prose-invert my-4 select-none'
            onCopy={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {isLoadingMd ? (
              <p className="text-gray-500 dark:text-gray-400">Loading instructions…</p>
            ) : mdError ? (
              <p className="text-red-600 dark:text-red-400">{mdError}</p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  h1: ({ children }: { children: React.ReactNode }) => <h1 className="text-xl font-bold text-gray-900 mb-4 mt-0 dark:text-gray-100">{children}</h1>,
                  h2: ({ children }: { children: React.ReactNode }) => <h2 className="text-lg font-semibold text-gray-900 mb-3 mt-6 dark:text-gray-100">{children}</h2>,
                  h3: ({ children }: { children: React.ReactNode }) => <h3 className="text-base font-semibold text-gray-800 mb-2 mt-4 dark:text-gray-200">{children}</h3>,
                  p: ({ children }: { children: React.ReactNode }) => <p className="text-gray-700 leading-relaxed mb-3 dark:text-gray-300">{children}</p>,
                  strong: ({ children }: { children: React.ReactNode }) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
                  em: ({ children }: { children: React.ReactNode }) => <em className="italic text-gray-600 dark:text-gray-400">{children}</em>,
                  ul: ({ children }: { children: React.ReactNode }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                  ol: ({ children }: { children: React.ReactNode }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                  li: ({ children }: { children: React.ReactNode }) => <li className="text-gray-700 dark:text-gray-300">{children}</li>,
                  blockquote: ({ children }: { children: React.ReactNode }) => <blockquote className="border-l-4 border-blue-200 pl-4 italic text-gray-600 mb-3 dark:border-blue-900 dark:text-gray-400">{children}</blockquote>,
                  code: ({ children }: { children: React.ReactNode }) => <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800 dark:bg-gray-800 dark:text-gray-100">{children}</code>,
                  pre: ({ children }: { children: React.ReactNode }) => <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-3 dark:bg-gray-900">{children}</pre>,
                  a: ({ children, href }: { children: React.ReactNode; href?: string }) => (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {markdown}
              </ReactMarkdown>
            )}
          </div>
        </div>

        {/* Footer area for additional actions */}
        <div className='absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100 bg-gray-50 dark:bg-[#0f0f0f] dark:border-gray-800'>
          <div className='flex gap-3'>
            <button
              onClick={handleSubmit}
              disabled={!showSubmit}
              className={`flex-1 font-medium py-2 px-4 rounded-lg transition-all duration-200 ${showSubmit
                ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                }`}
            >
              Submit
            </button>
            {!showSubmit && (
              <button
                onClick={handleGetStarted}
                disabled={!isGetStartedEnabled}
                className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors duration-200 ${!isGetStartedEnabled ? 'bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {`Get Started${remainingStartDelay > 0 ? ` (${remainingStartDelay})` : ''}`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Submission Form Modal */}
      {isSubmissionModalOpen && (
        <SubmissionForm
          isOpen={isSubmissionModalOpen}
          onSubmit={handleSubmissionFormSubmit}
          onClose={handleSubmissionFormClose}
        />
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg dark:bg-green-600">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Submission saved successfully!</span>
          </div>
        </div>
      )}
    </>
  )
}

const Sidebar = ({ collapsed, onToggleSidebar }: SidebarProps) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SidebarContent collapsed={collapsed} onToggleSidebar={onToggleSidebar} />
    </Suspense>
  )
}

export default Sidebar