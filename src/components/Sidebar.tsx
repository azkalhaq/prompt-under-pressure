"use client"
import React from 'react'
import { usePathname } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { RxQuestionMark, RxCross2 } from 'react-icons/rx'

type SidebarProps = {
  collapsed: boolean
  onToggleSidebar?: () => void
}

const Sidebar = ({ collapsed, onToggleSidebar }: SidebarProps) => {
  const pathname = usePathname()

  const scenarioContent: Record<string, { markdown: string }> = {
    '/': {
      markdown: '## Scenario\nNo scenario configured for this page.'
    },
    '/task-2': {
      markdown:
        `### User Scenario / Task\n\n**Constraint**\n\nYou must remember this code "20mp5qdj4" / pattern (7+2). Don't take any notes or pictures. The form will ask you this code at the end after this task. You must remember this code "20mp5qdj4" / pattern (7+2) – Miller Law? The form will ask you at the end after this task.\n\n**Task**\n\nYou are a junior marketing analyst at a large consultant company and currently in your 3-month probation period. Your manager just asked you to prepare a comprehensive competitor analysis report for the top 3 brands in e-commerce sector in Australia. You have plenty of time to think about the best possible GPT prompt to get all this information accurately and in a well-structured format.`
    },
    '/task-3': {
      markdown: '### User Scenario / Task\n\n_Add task details here._'
    },
  }

  const content = scenarioContent[pathname] || scenarioContent['/']

  return (
    <>
      {/* Help button - only show when sidebar is collapsed */}
      {collapsed && (
        <button
          aria-label='Show scenario instructions'
          onClick={onToggleSidebar}
          className='fixed top-4 left-4 z-30 p-2 rounded-lg hover:bg-gray-100 active:scale-[0.98] bg-white shadow-lg border border-gray-200 transition-all duration-200 group overflow-hidden'
        >
          <div className='flex items-center'>
            <RxQuestionMark className="text-gray-700 flex-shrink-0" />
            <span className='text-sm text-gray-700 max-w-0 group-hover:max-w-32 transition-all duration-200 overflow-hidden whitespace-nowrap ml-0 group-hover:ml-2'>
              Show instructions
            </span>
          </div>
        </button>
      )}
      
      {/* Overlay - only show when sidebar is open */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 transition-opacity duration-300"
          onClick={onToggleSidebar}
          aria-label="Close sidebar overlay"
        />
      )}

      {/* Overlay sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full bg-white shadow-2xl transition-all duration-300 ease-in-out z-20 border-r border-gray-200 ${
          collapsed 
            ? 'w-0 opacity-0 pointer-events-none' 
            : 'w-full md:w-1/2 2xl:w-1/3 opacity-100'
        }`}
      >
        {/* Header with close button */}
        <div className='flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50'>
          <h2 className='text-lg font-semibold text-gray-900'>Instructions</h2>
          <button 
            aria-label='Close sidebar' 
            onClick={onToggleSidebar} 
            className='p-2 rounded-lg hover:bg-gray-200 active:scale-[0.98] transition-colors duration-200'
          >
            <RxCross2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        {/* Content area */}
        <div className='p-6 text-sm text-gray-700 overflow-y-auto flex-1 h-[calc(100%-5rem)]'>
          <div className='prose prose-sm max-w-none'>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]} 
              components={{
                h1: ({children}: {children: React.ReactNode}) => <h1 className="text-xl font-bold text-gray-900 mb-4 mt-0">{children}</h1>,
                h2: ({children}: {children: React.ReactNode}) => <h2 className="text-lg font-semibold text-gray-900 mb-3 mt-6">{children}</h2>,
                h3: ({children}: {children: React.ReactNode}) => <h3 className="text-base font-semibold text-gray-800 mb-2 mt-4">{children}</h3>,
                p: ({children}: {children: React.ReactNode}) => <p className="text-gray-700 leading-relaxed mb-3">{children}</p>,
                strong: ({children}: {children: React.ReactNode}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                em: ({children}: {children: React.ReactNode}) => <em className="italic text-gray-600">{children}</em>,
                ul: ({children}: {children: React.ReactNode}) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                ol: ({children}: {children: React.ReactNode}) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                li: ({children}: {children: React.ReactNode}) => <li className="text-gray-700">{children}</li>,
                blockquote: ({children}: {children: React.ReactNode}) => <blockquote className="border-l-4 border-blue-200 pl-4 italic text-gray-600 mb-3">{children}</blockquote>,
                code: ({children}: {children: React.ReactNode}) => <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">{children}</code>,
                pre: ({children}: {children: React.ReactNode}) => <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-3">{children}</pre>,
              }}
            >
              {content.markdown}
            </ReactMarkdown>
          </div>
        </div>
        
        {/* Footer area for additional actions */}
        <div className='p-6 border-t border-gray-100 bg-gray-50'>
          <div className='flex gap-3'>
            <button className='flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200'>
              Get Started
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar