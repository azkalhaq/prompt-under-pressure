import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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

  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
  const isAssistantTyping = Boolean(isLoading && lastAssistant && !lastAssistant.content)

  return (
    <div className='w-full max-w-3xl mx-auto px-4 space-y-4 pb-24'>
      {messages.map((m) => (
        <div key={m.id} className={`w-full flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`px-4 py-2 rounded-2xl text-sm md:text-base max-w-[100%] break-words ${m.role === 'user' ? 'bg-gray-100 whitespace-pre-wrap' : 'text-gray-900'}`}>
            {m.role === 'assistant' ? (
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
                      <code className={`rounded px-1 ${className || ''}`} {...props}>{children}</code>
                    )
                  },
                  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
                    <pre className="rounded overflow-x-auto my-2" {...props} />
                  ),
                  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => <table className="table-auto border-collapse my-2" {...props} />,
                  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => <th className="border px-2 py-1" {...props} />,
                  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => <td className="border px-2 py-1" {...props} />,
                  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => <p className="my-2" {...props} />,
                }}
              >
                {m.content}
              </ReactMarkdown>
            ) : (
              <span className='whitespace-pre-wrap'>{m.content}</span>
            )}
          </div>
        </div>
      ))}
      {isAssistantTyping && (
        <div className='w-full flex justify-start'>
          <div className='px-4 py-2 rounded-2xl text-sm md:text-base'>
            <div className='flex items-center gap-1 h-5'>
              <span className='w-2 h-2 bg-gray-400 rounded-full animate-pulse' style={{ animationDelay: '0ms' }} />
              <span className='w-2 h-2 bg-gray-400 rounded-full animate-pulse' style={{ animationDelay: '150ms' }} />
              <span className='w-2 h-2 bg-gray-400 rounded-full animate-pulse' style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  )
}

export default ChatHelp

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleClick = async () => {
    try {
      await navigator.clipboard?.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {}
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