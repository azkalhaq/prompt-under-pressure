import React, { useEffect, useRef } from 'react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type ChatHelpProps = {
  messages: Message[]
  isLoading?: boolean
}

const ChatHelp = ({ messages, isLoading }: ChatHelpProps) => {
  const endRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className='w-full max-w-3xl mx-auto px-4 space-y-4 pb-24'>
      {messages.map((m) => (
        <div key={m.id} className={`w-full flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`px-4 py-2 rounded-2xl text-sm md:text-base max-w-[85%] whitespace-pre-wrap break-words ${m.role === 'user' ? 'bg-gray-100' : 'text-gray-900'}`}>
            {m.content}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className='w-full flex justify-start'>
          <div className='px-4 py-2 rounded-2xl text-sm md:text-base animate-pulse'>
            Thinking…
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  )
}

export default ChatHelp