"use client"
import React from 'react'
import { usePathname } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { RxHamburgerMenu } from 'react-icons/rx'

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
        `### User Scenario / Task\n\n**Constraint**\n\nYou must remember this code “20mp5qdj4” / pattern (7+2). Don't take any notes or pictures. The form will ask you this code at the end after this task. You have to remember this code “20mp5qdj4” / pattern (7+2) – Miller Law? The form will ask you at the end after this task.\n\n**Task**\n\nYou are a junior marketing analyst at a large consultant company and currently in your 3-month probation period. Your manager just asked you to prepare a comprehensive competitor analysis report for the top 3 brands in e-commerce sector in Australia. You have plenty of time to think about the best possible GPT prompt to get all this information accurately and in a well-structured format.`
    },
    '/task-3': {
      markdown: '### User Scenario / Task\n\n_Add task details here._'
    },
  }

  const content = scenarioContent[pathname] || scenarioContent['/']

  return (
    <div className={`${collapsed ? 'w-0' : 'w-64'} transition-[width] duration-200 ease-in-out h-full bg-gray-100 overflow-hidden flex flex-col relative`}> 
      {collapsed ? (
        <button
          aria-label='Toggle sidebar'
          onClick={onToggleSidebar}
          className='fixed top-2 left-2 z-30 p-2 rounded hover:bg-gray-200 active:scale-[0.98] bg-white shadow'
        >
          <RxHamburgerMenu />
        </button>
      ) : (
        <div className='p-2 flex items-center justify-start'>
          <button aria-label='Toggle sidebar' onClick={onToggleSidebar} className='p-2 rounded hover:bg-gray-200 active:scale-[0.98]'>
            <RxHamburgerMenu />
          </button>
        </div>
      )}
      {!collapsed && (
        <div className='p-3 text-sm text-gray-900 overflow-y-auto flex-1'>
          <ReactMarkdown remarkPlugins={[remarkGfm]} className='prose prose-sm max-w-none'>
            {content.markdown}
          </ReactMarkdown>
        </div>
      )}
      {/* Add nav items here */}
    </div>
  )
}

export default Sidebar