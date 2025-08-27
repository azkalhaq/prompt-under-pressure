"use client"
import React, { useState, KeyboardEvent, FormEvent } from 'react'
import { ImArrowUpRight, ImArrowUpRight2 } from 'react-icons/im'
import { TbPaperclip } from 'react-icons/tb'

type ChatInputProps = {
  onSubmitPrompt?: (prompt: string) => Promise<void> | void
  disabled?: boolean
}

const ChatInput = ({ onSubmitPrompt, disabled }: ChatInputProps) => {
  const [prompt, setPrompt] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.shiftKey && e.key === 'Enter') {
      e.preventDefault()
      setPrompt(prev => prev + '\n')
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
    } catch (err) {
      // swallow; higher-level component can handle
    }
  }

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    void handleSubmit()
  }

  return (
    <div className='w-full flex flex-col items-center justify-center max-w-3xl mx-auto pt-3 px-4'>
      <form onSubmit={onFormSubmit} className='rounded-full flex items-center px-4 py-2.5 w-full shadow-sm outline-1 outline-gray-200'>
        <TbPaperclip className='text-2xl -rotate-45 text-gray-600' />
        <textarea 
          placeholder='Ask Anything'
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          value={prompt}
          rows={1}
          className='bg-transparent flex-grow outline-none text-gray-700 placeholder-gray-500 px-2 font-medium tracking-wide resize-none overflow-hidden min-h-[24px] max-h-32 break-words whitespace-pre-wrap'
          style={{ height: 'auto' }}
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