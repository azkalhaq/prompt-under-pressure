"use client"
import React, { useState, KeyboardEvent, FormEvent, useRef, MouseEvent, useCallback, useEffect } from 'react'
import { useInactivity } from '@/contexts/InactivityContext'
import { ImArrowUpRight2 } from 'react-icons/im'
import { IoArrowDown } from 'react-icons/io5'
// import { TbPaperclip } from 'react-icons/tb'

type ChatInputProps = {
  onSubmitPrompt?: (prompt: string, promptingTimeMs?: number) => Promise<void> | void
  disabled?: boolean
  showTitle?: boolean
  titleText?: string
  showScrollButton?: boolean
  scrollParentRef?: React.MutableRefObject<HTMLElement | null>
  onHeightChange?: (height: number) => void
  onAnchorRefChange?: (el: HTMLDivElement | null) => void
}

const ChatInput = ({ onSubmitPrompt, disabled, showTitle, titleText, showScrollButton, scrollParentRef, onHeightChange, onAnchorRefChange }: ChatInputProps) => {
  const { isPaused } = useInactivity()
  const [prompt, setPrompt] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const firstInputTimeRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.shiftKey && e.key === 'Enter') {
      e.preventDefault()
      const el = textareaRef.current
      if (el) {
        const start = el.selectionStart ?? prompt.length
        const end = el.selectionEnd ?? prompt.length
        const next = prompt.slice(0, start) + '\n' + prompt.slice(end)
        setPrompt(next)
        requestAnimationFrame(() => {
          try { el.setSelectionRange(start + 1, start + 1) } catch {}
          adjustTextAreaHeight(el)
        })
      } else {
        setPrompt(prev => prev + '\n')
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit()
    }
  }

  // Add auto-resize function with throttling
  const adjustTextAreaHeight = useCallback((element: HTMLTextAreaElement) => {
    element.style.height = 'auto'
    element.style.height = `${element.scrollHeight}px`
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (firstInputTimeRef.current === null && e.target.value.length > 0) {
      firstInputTimeRef.current = Date.now()
    }
    setPrompt(e.target.value)
    // Use requestAnimationFrame to prevent layout thrashing
    requestAnimationFrame(() => {
      adjustTextAreaHeight(e.target)
    })
  }

  const handleSubmit = async () => {
    const startedAt = firstInputTimeRef.current
    const promptingTimeMs = typeof startedAt === 'number' ? Math.max(0, Date.now() - startedAt) : undefined
    setPrompt('')
    if (!prompt || disabled || isPaused) return
    try {
      await onSubmitPrompt?.(prompt, promptingTimeMs)
      firstInputTimeRef.current = null
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch {
      // swallow; higher-level component can handle
    }
  }

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    void handleSubmit()
  }

  const handleFormMouseDown = (e: MouseEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement
    if (target.closest('textarea') || target.closest('button')) return
    if (textareaRef.current) {
      textareaRef.current.focus()
      const len = textareaRef.current.value.length
      try { textareaRef.current.setSelectionRange(len, len) } catch {}
    }
  }

  const handleScrollToBottom = useCallback(() => {
    let parent = scrollParentRef?.current
    if (!parent && containerRef.current) {
      const getOverflowY = (el: HTMLElement) => window.getComputedStyle(el).overflowY
      let node: HTMLElement | null = containerRef.current
      while (node) {
        const oy = getOverflowY(node)
        if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight) {
          parent = node
          if (scrollParentRef) scrollParentRef.current = node
          break
        }
        node = node.parentElement as HTMLElement | null
      }
    }
    if (parent) {
      parent.scrollTo({ top: parent.scrollHeight, behavior: 'smooth' });
    } else if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'auto', block: 'end' })
    }
  }, [scrollParentRef])

  useEffect(() => {
    if (!containerRef.current || !onHeightChange) return
    const el = containerRef.current
    let timeoutId: NodeJS.Timeout
    let lastHeight = 0
    
    const ro = new ResizeObserver(entries => {
      const entry = entries[0]
      if (!entry) return
      const height = Math.round(entry.contentRect.height)
      
      // Only update if height actually changed significantly
      if (Math.abs(height - lastHeight) > 2) {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          lastHeight = height
          onHeightChange(height)
        }, 150) // Increased debounce time
      }
    })
    ro.observe(el)
    // initial
    const initialHeight = Math.round(el.getBoundingClientRect().height)
    lastHeight = initialHeight
    onHeightChange(initialHeight)
    return () => {
      ro.disconnect()
      clearTimeout(timeoutId)
    }
  }, [onHeightChange])

  useEffect(() => {
    onAnchorRefChange?.(containerRef.current)
  }, [onAnchorRefChange])

  return (
    <div className='w-full flex flex-col items-center justify-center max-w-3xl mx-auto px-4'>
      {showTitle && (
        <h2 className='text-center text-xl md:text-2xl font-semibold mb-5 select-none'>
          {titleText || 'What can I help with?'}
        </h2>
      )}
      {showScrollButton && (
        <div className='w-full flex justify-center pr-3 mb-2'>
          <button
            type='button'
            onClick={handleScrollToBottom}
            className='bg-gray-100 rounded-full p-3 shadow-lg hover:opacity-90 active:scale-[0.98] h-9 w-9 flex items-center justify-center'
            aria-label='Scroll to bottom'
          >
            <IoArrowDown size={18} />
          </button>
        </div>
      )}
      <div ref={containerRef} className='bg-white w-full flex flex-col items-center justify-center max-w-3xl mx-auto pb-1 px-4'>
      <form onMouseDown={handleFormMouseDown} onSubmit={onFormSubmit} className='relative w-full cursor-text'>
        <label className='relative flex w-full flex-col overflow-hidden rounded-2xl py-4 pl-4 pr-[52px] border border-gray-200 bg-white shadow-sm'>
          <div className='sr-only'>Message ChatGPT</div>
          <textarea 
            ref={textareaRef}
            placeholder='Ask anything'
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            value={prompt}
            rows={1}
            className='placeholder:text-gray-500 w-full resize-none bg-transparent text-base leading-6 focus:outline-none overflow-auto max-h-60'
            style={{ height: 'auto' }}
          />
        </label>
        <div className='absolute bottom-3 right-3 mt-auto flex justify-end'>
          <button type='submit' disabled={!prompt || disabled || isPaused} aria-label='Send prompt' className='bg-black text-white disabled:bg-gray-300 disabled:text-gray-600 relative h-9 w-9 rounded-full p-0 transition-colors hover:opacity-80 disabled:hover:opacity-100 flex items-center justify-center'>
            <ImArrowUpRight2 className='-rotate-45' />
          </button>
        </div>
      </form>
      <p className="text-xs mt-2 font-medium tracking-wide text-gray-600">
        ChatGPT can make mistakes. Check important info.
      </p>
      </div>
      {/* model selection */}
    </div>
  )
}

export default ChatInput