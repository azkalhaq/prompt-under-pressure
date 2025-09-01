"use client"
import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

type ShellProps = {
  children: React.ReactNode
}

const Shell = ({ children }: ShellProps) => {
  const [collapsed, setCollapsed] = useState(true)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  
  // Prevent hydration mismatch by only setting state after mount
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Automatically disable Shell scrolling for task-2
  const disableShellScroll = pathname.includes('/task-2')
  
  return (
    <div className="h-screen overflow-hidden relative">
      <Sidebar key={mounted ? 'mounted' : 'unmounted'} collapsed={mounted ? collapsed : true} onToggleSidebar={() => setCollapsed(v => !v)} />
      <div className={`bg-white w-full h-full relative ${!disableShellScroll ? 'overflow-y-auto [scrollbar-gutter:stable]' : ''}`}>
        {children}
      </div>
    </div>
  )
}

export default Shell


