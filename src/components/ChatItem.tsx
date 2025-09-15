import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FaQuoteLeft } from 'react-icons/fa'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FiCopy, FiThumbsUp, FiThumbsDown, FiCheck } from 'react-icons/fi'
import { Tooltip } from 'flowbite-react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type ChatItemProps = {
  messages: Message[]
  isLoading?: boolean
  canReact?: boolean
  onQuoteSelection?: (text: string) => void
}

// User Message Component
const UserMessage = ({ content, onCopy, copiedIds }: {
  content: string
  onCopy: (id: string, text: string) => void
  copiedIds: Record<string, boolean>
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const messageId = `user-${content.slice(0, 10)}` // Simple ID for user messages

  return (
    <div
      className='grid grid-cols-1'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className='px-4 py-2 rounded-2xl text-sm md:text-base break-words max-w-[75%] bg-gray-100 whitespace-pre-wrap justify-self-end dark:bg-gray-800 dark:text-gray-100'>
        <span className='whitespace-pre-wrap'>{content}</span>
      </div>
      {/* Action buttons - positioned to the right of the message */}
      <div className='mt-2 flex items-center gap-1 justify-self-end' style={{ height: '32px'}}>
        {isHovered && (
          <div className='flex items-center gap-1 text-gray-600 ml-2 justify-self-end dark:text-gray-400'>
            <Tooltip content={copiedIds[messageId] ? 'Copied!' : 'Copy'} placement="bottom">
              <button
                className='text-gray-600 hover:bg-gray-200 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700'
                aria-label={copiedIds[messageId] ? 'Copied' : 'Copy'}
                aria-pressed={copiedIds[messageId] ? 'true' : 'false'}
                onClick={() => onCopy(messageId, content)}
              >
                <span className='flex items-center justify-center h-8 w-8'>
                  {copiedIds[messageId] ? <FiCheck className='text-green-600' /> : <FiCopy />}
                </span>
              </button>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  )
}

// Assistant Message Component
const AssistantMessage = ({
  content,
  messageId,
  isTyping = false,
  onCopy,
  onReact,
  copiedIds,
  reactions,
  canReact,
  onQuoteSelection
}: {
  content: string
  messageId: string
  isTyping?: boolean
  onCopy: (id: string, text: string) => void
  onReact: (id: string, kind: 'up' | 'down') => void
  copiedIds: Record<string, boolean>
  reactions: Record<string, 'up' | 'down' | undefined>
  canReact?: boolean
  onQuoteSelection?: (text: string) => void
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [selText, setSelText] = useState('')
  const [btnPos, setBtnPos] = useState<{ x: number; y: number } | null>(null)
  const isDraggingRef = useRef(false)
  const lastSelRef = useRef('')

  // Memoize markdown to prevent rerendering content on selection state changes
  const markdownContent = useMemo(() => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        ol: (props: React.OlHTMLAttributes<HTMLOListElement>) => (
          <ol className="list-decimal pl-6 my-2" {...props} />
        ),
        ul: (props: React.HTMLAttributes<HTMLUListElement>) => <ul className="list-disc pl-6 my-2" {...props} />,
        li: (props: React.LiHTMLAttributes<HTMLLIElement>) => <li className="my-1" {...props} />,
        a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a className="underline" target="_blank" rel="noreferrer" {...props} />,
        code: ({ className, children, ...props }: { className?: string; children?: React.ReactNode }) => {
          const text = String(children ?? '')
          const match = /language-([a-zA-Z0-9]+)/.exec(className || '')
          const lang = match?.[1]
          if (lang) {
            return (
              <div className="contain-inline-size rounded-2xl relative bg-gray-50 border border-gray-200 my-2">
                <div className="flex items-center text-gray-600 px-4 py-2 text-xs font-sans justify-between h-9 bg-gray-100 select-none rounded-t-2xl">
                  {lang}
                </div>
                <div className="sticky top-9">
                  <div className="absolute end-0 bottom-0 flex h-9 items-center pe-2">
                    <CopyButton text={text} />
                  </div>
                </div>
                <div className="overflow-y-auto p-4" dir="ltr">
                  <code className="whitespace-pre">{text}</code>
                </div>
              </div>
            )
          }
          return (
            <code className={`rounded px-1 ${className || ''} dark:bg-gray-800 dark:text-gray-100`} {...props}>{children}</code>
          )
        },
        pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
          <pre className="rounded overflow-x-auto my-2 dark:bg-gray-900" {...props} />
        ),
        table: (props: React.TableHTMLAttributes<HTMLTableElement>) => <table className="table-auto border-collapse my-2" {...props} />,
        th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => <th className="border px-2 py-1" {...props} />,
        td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => <td className="border px-2 py-1" {...props} />,
        p: (props: React.HTMLAttributes<HTMLParagraphElement>) => <p className="my-2" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  ), [content])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const computeSelectionInContainer = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed) {
        setSelText('')
        setBtnPos(null)
        lastSelRef.current = ''
        return
      }
      const range = sel.rangeCount ? sel.getRangeAt(0) : null
      if (!range) return
      const common = range.commonAncestorContainer
      const commonEl = common instanceof Element ? common : common.parentElement
      if (!commonEl || !container.contains(commonEl)) {
        setSelText('')
        setBtnPos(null)
        lastSelRef.current = ''
        return
      }
      const text = sel.toString().trim()
      if (!text || text === lastSelRef.current) return
      lastSelRef.current = text
      const rects = range.getClientRects()
      const last = rects[rects.length - 1]
      if (last) {
        setBtnPos({ x: last.right + window.scrollX, y: last.bottom + window.scrollY })
      } else {
        const r = range.getBoundingClientRect()
        setBtnPos({ x: r.right + window.scrollX, y: r.bottom + window.scrollY })
      }
      setSelText(text)
    }

    const onMouseDown = () => {
      isDraggingRef.current = true
      setBtnPos(null)
    }
    const onMouseUp = () => {
      isDraggingRef.current = false
      // Wait a tick for selection to settle
      setTimeout(computeSelectionInContainer, 0)
    }
    const onTouchStart = onMouseDown
    const onTouchEnd = onMouseUp
    const onKeyUp = computeSelectionInContainer
    const onScroll = () => setBtnPos(null)

    // Hide immediately if selection collapses or moves outside container
    const onSelectionChange = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed) {
        setSelText('')
        setBtnPos(null)
        lastSelRef.current = ''
        return
      }
      const range = sel.rangeCount ? sel.getRangeAt(0) : null
      if (!range) return
      const common = range.commonAncestorContainer
      const commonEl = common instanceof Element ? common : common.parentElement
      if (!commonEl || !container.contains(commonEl)) {
        setSelText('')
        setBtnPos(null)
        lastSelRef.current = ''
      }
    }

    // Hide if clicking anywhere outside the container or button
    const hideButton = () => {
      setSelText('')
      setBtnPos(null)
      lastSelRef.current = ''
    }

    const onDocumentMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const isAskBtn = target.closest('[data-askgpt-btn="true"]')
      if (isAskBtn) return
      // Hide on any click outside the Ask button
      hideButton()
    }
    const onDocumentPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const isAskBtn = target.closest('[data-askgpt-btn="true"]')
      if (isAskBtn) return
      hideButton()
    }
    const onDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const isAskBtn = target.closest('[data-askgpt-btn="true"]')
      if (isAskBtn) return
      hideButton()
    }
    const onDocumentTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const isAskBtn = target.closest('[data-askgpt-btn="true"]')
      if (isAskBtn) return
      hideButton()
    }
    const onWindowBlur = () => {
      hideButton()
    }
    const onVisibilityChange = () => {
      if (document.hidden) hideButton()
    }

    container.addEventListener('mousedown', onMouseDown)
    container.addEventListener('mouseup', onMouseUp)
    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchend', onTouchEnd, { passive: true })
    container.addEventListener('keyup', onKeyUp)
    window.addEventListener('scroll', onScroll, true)
    document.addEventListener('selectionchange', onSelectionChange)
    document.addEventListener('mousedown', onDocumentMouseDown, true)
    document.addEventListener('pointerdown', onDocumentPointerDown, true)
    document.addEventListener('click', onDocumentClick, true)
    document.addEventListener('touchstart', onDocumentTouchStart, { passive: true, capture: true })
    window.addEventListener('blur', onWindowBlur)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      container.removeEventListener('mousedown', onMouseDown)
      container.removeEventListener('mouseup', onMouseUp)
      container.removeEventListener('touchstart', onTouchStart as EventListener)
      container.removeEventListener('touchend', onTouchEnd as EventListener)
      container.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('scroll', onScroll, true)
      document.removeEventListener('selectionchange', onSelectionChange)
      document.removeEventListener('mousedown', onDocumentMouseDown, true)
      document.removeEventListener('pointerdown', onDocumentPointerDown, true)
      document.removeEventListener('click', onDocumentClick, true)
      document.removeEventListener('touchstart', onDocumentTouchStart as EventListener, true)
      window.removeEventListener('blur', onWindowBlur)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  const handleAskGpt = () => {
    if (!selText) return
    onQuoteSelection?.(selText)
    setSelText('')
    setBtnPos(null)
    try { window.getSelection()?.removeAllRanges() } catch {}
  }

  return (
    <div className='w-full flex justify-start'>
      <div ref={containerRef} className='px-4 py-2 rounded-2xl text-sm md:text-base break-words text-gray-900 dark:text-gray-100 relative'>
        {markdownContent}

        {/* Selection Ask GPT button */}
        {selText && btnPos && createPortal(
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleAskGpt}
            data-askgpt-btn="true"
            className='fixed z-50 text-sm rounded-full px-4 py-1.5 shadow-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100'
            style={{ left: btnPos.x + 8, top: btnPos.y + 8 }}
          >
            <FaQuoteLeft />
            Ask GPT
          </button>,
          document.body
        )}

        {/* Action buttons - only show when not typing and content exists */}
        {content && !isTyping && (
          <div className='mt-2 flex items-center gap-1 text-gray-600'>
            {/* Copy button - always shown */}
            <Tooltip content={copiedIds[messageId] ? 'Copied!' : 'Copy'} placement="bottom">
              <button
                className='text-gray-600 hover:bg-gray-200 rounded-lg'
                aria-label={copiedIds[messageId] ? 'Copied' : 'Copy'}
                aria-pressed={copiedIds[messageId] ? 'true' : 'false'}
                onClick={() => onCopy(messageId, content)}
              >
                <span className='flex items-center justify-center h-8 w-8'>
                  {copiedIds[messageId] ? <FiCheck className='text-green-600' /> : <FiCopy />}
                </span>
              </button>
            </Tooltip>
            
            {/* Reaction buttons - only shown when canReact is true */}
            {canReact && (
              <>
                {(!reactions[messageId] || reactions[messageId] === 'up') && (
                  <Tooltip content={reactions[messageId] === 'up' ? 'Marked as helpful' : 'Mark as helpful'} placement="bottom">
                    <button
                      className={`text-gray-600 hover:bg-gray-200 rounded-lg ${reactions[messageId] === 'up' ? 'bg-green-100' : ''}`}
                      aria-label='Good response'
                      aria-pressed={reactions[messageId] === 'up' ? 'true' : 'false'}
                      onClick={() => onReact(messageId, 'up')}
                    >
                      <span className='flex items-center justify-center h-8 w-8'>
                        <FiThumbsUp className={reactions[messageId] === 'up' ? 'text-green-700' : ''} />
                      </span>
                    </button>
                  </Tooltip>
                )}
                {(!reactions[messageId] || reactions[messageId] === 'down') && (
                  <Tooltip content={reactions[messageId] === 'down' ? 'Marked as not helpful' : 'Mark as not helpful'} placement="bottom">
                    <button
                      className={`text-gray-600 hover:bg-gray-200 rounded-lg ${reactions[messageId] === 'down' ? 'bg-red-100' : ''}`}
                      aria-label='Bad response'
                      aria-pressed={reactions[messageId] === 'down' ? 'true' : 'false'}
                      onClick={() => onReact(messageId, 'down')}
                    >
                      <span className='flex items-center justify-center h-8 w-8'>
                        <FiThumbsDown className={reactions[messageId] === 'down' ? 'text-red-700' : ''} />
                      </span>
                    </button>
                  </Tooltip>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Typing Indicator Component
const TypingIndicator = () => {
  return (
    <div className='w-full flex justify-start'>
      <div className='px-4 py-2 rounded-2xl text-sm md:text-base'>
        <div className='flex items-center gap-1 h-5'>
          <span className='w-2 h-2 bg-gray-400 rounded-full animate-pulse' style={{ animationDelay: '0ms' }} />
          <span className='w-2 h-2 bg-gray-400 rounded-full animate-pulse' style={{ animationDelay: '150ms' }} />
          <span className='w-2 h-2 bg-gray-400 rounded-full animate-pulse' style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

// Main ChatItem Component
const ChatItem = ({ messages, isLoading, canReact = true, onQuoteSelection }: ChatItemProps) => {
  const endRef = useRef<HTMLDivElement | null>(null)
  const prevMessageCountRef = useRef(messages.length)
  
  useEffect(() => {
    // Only scroll when new messages are added, not when existing message content is updated
    if (messages.length > prevMessageCountRef.current) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevMessageCountRef.current = messages.length
  }, [messages.length])

  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
  const isAssistantTyping = Boolean(isLoading && lastAssistant && !lastAssistant.content)

  const [copiedIds, setCopiedIds] = useState<Record<string, boolean>>({})
  const [reactions, setReactions] = useState<Record<string, 'up' | 'down' | undefined>>({})

  const handleCopyAll = async (id: string, text: string) => {
    try {
      await navigator.clipboard?.writeText(text)
      setCopiedIds(prev => ({ ...prev, [id]: true }))
      setTimeout(() => setCopiedIds(prev => ({ ...prev, [id]: false })), 1200)
    } catch { }
  }

  const handleReact = async (id: string, kind: 'up' | 'down') => {
    setReactions(prev => ({ ...prev, [id]: kind }))
    try {
      await fetch('/api/chat-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_reaction',
          data: { reaction: kind, sessionId: document.cookie.split('; ').find(c => c.startsWith('sid='))?.split('=')[1] }
        })
      })
    } catch {
      // swallow
    }
  }

  return (
    <div className='chat-item w-full max-w-3xl mx-auto px-4 space-y-4'>
      {messages.map((m) => (
        <div key={m.id}>
          {m.role === 'user' ? (
            <UserMessage
              content={m.content}
              onCopy={handleCopyAll}
              copiedIds={copiedIds}
            />
          ) : (
            <AssistantMessage
              content={m.content}
              messageId={m.id}
              isTyping={isLoading && lastAssistant?.id === m.id}
              onCopy={handleCopyAll}
              onReact={handleReact}
              copiedIds={copiedIds}
              reactions={reactions}
              canReact={canReact}
              onQuoteSelection={onQuoteSelection}
            />
          )}
        </div>
      ))}

      {isAssistantTyping && <TypingIndicator />}

      <div ref={endRef} />
    </div>
  )
}

// Copy Button Component (for code blocks)
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleClick = async () => {
    try {
      await navigator.clipboard?.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch { }
  }
  return (
    <button
      type="button"
      aria-label={copied ? 'Copied' : 'Copy code'}
      className={`border flex items-center gap-1 rounded px-2 py-1 font-sans text-xs transition-colors ${copied ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white/70 hover:bg-white border-gray-200 text-gray-700'}`}
      onClick={handleClick}
    >
      {copied ? 'Copied' : 'Copy code'}
    </button>
  )
}

export default ChatItem
