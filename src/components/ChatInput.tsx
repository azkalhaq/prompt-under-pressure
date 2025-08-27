"use client"
import React, { useState, KeyboardEvent, FormEvent, useRef, MouseEvent } from 'react'
import { ImArrowUpRight2 } from 'react-icons/im'
// import { TbPaperclip } from 'react-icons/tb'

type ChatInputProps = {
  onSubmitPrompt?: (prompt: string) => Promise<void> | void
  disabled?: boolean
  showTitle?: boolean
  titleText?: string
}

const ChatInput = ({ onSubmitPrompt, disabled, showTitle, titleText }: ChatInputProps) => {
  const [prompt, setPrompt] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

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

  // Add auto-resize function
  const adjustTextAreaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto'
    element.style.height = `${element.scrollHeight}px`
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value)
    adjustTextAreaHeight(e.target)
  }

  const handleSubmit = async () => {
    setPrompt('')
    if (!prompt || disabled) return
    try {
      await onSubmitPrompt?.(prompt)
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

  return (
    <div className='bg-white w-full flex flex-col items-center justify-center max-w-3xl mx-auto pb-1 px-4'>
      {showTitle && (
        <h2 className='text-center text-xl md:text-2xl font-semibold mb-5 select-none'>
          {titleText || 'What can I help with?'}
        </h2>
      )}
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
          <button type='submit' disabled={!prompt || disabled} aria-label='Send prompt' className='bg-black text-white disabled:bg-gray-300 disabled:text-gray-600 relative h-9 w-9 rounded-full p-0 transition-colors hover:opacity-80 disabled:hover:opacity-100 flex items-center justify-center'>
            <ImArrowUpRight2 className='-rotate-45' />
          </button>
        </div>
      </form>
      <p className="text-xs mt-2 font-medium tracking-wide text-gray-600">
        ChatGPT can make mistakes. Check important info.
      </p>
      {/* model selection */}
    </div>
  )
}

export default ChatInput