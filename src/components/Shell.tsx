"use client"
import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

type ShellProps = {
  children: React.ReactNode
}

const Shell = ({ children }: ShellProps) => {
  const [collapsed, setCollapsed] = useState(true)
  const pathname = usePathname()
  
  // Automatically disable Shell scrolling for task-2
  const disableShellScroll = pathname.includes('/task-2')
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={collapsed} onToggleSidebar={() => setCollapsed(v => !v)} />
      <div className={`bg-white flex-1 relative ${!disableShellScroll ? 'overflow-y-auto [scrollbar-gutter:stable]' : ''}`}>
        {children}
      </div>
    </div>
  )
}

export default Shell


