"use client"
import React, { useState, KeyboardEvent, FormEvent, useRef } from 'react'
import { ImArrowUpRight2 } from 'react-icons/im'
import { TbPaperclip } from 'react-icons/tb'

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
    if (!prompt || disabled) return
    try {
      await onSubmitPrompt?.(prompt)
      setPrompt('')
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

  return (
    <div className='bg-gray-50 w-full flex flex-col items-center justify-center max-w-3xl mx-auto pb-1 px-4'>
      {showTitle && (
        <h2 className='text-center text-xl md:text-2xl font-semibold mb-5 select-none'>
          {titleText || 'What can I help with?'}
        </h2>
      )}
      <form onSubmit={onFormSubmit} className='rounded-full flex items-center px-4 py-2.5 w-full shadow-sm outline-1 outline-gray-200'>
        <TbPaperclip className='text-2xl -rotate-45 text-gray-600' />
        <textarea 
          ref={textareaRef}
          placeholder='Ask Anything'
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          value={prompt}
          rows={1}
          className='bg-transparent flex-grow outline-none text-gray-700 placeholder-gray-500 px-2 font-medium tracking-wide resize-none overflow-hidden min-h-[24px] max-h-32 break-words whitespace-pre-wrap'
          style={{ height: 'auto', overflow: 'clip' }}
        />
        <button type='submit' disabled={!prompt || disabled} className='p-2.5 rounded-full bg-black disabled:bg-gray-400'>
          <ImArrowUpRight2 className='-rotate-45 text-white' />
        </button>
      </form>
      <p className="text-xs mt-2 font-medium tracking-wide text-gray-600">
        ChatGPT can make mistakes. Check important info.
      </p>
      {/* model selection */}
    </div>
  )
}

export default ChatInput