"use client"
import React, { useState } from 'react'
import Sidebar from './Sidebar'

type ShellProps = {
  children: React.ReactNode
}

const Shell = ({ children }: ShellProps) => {
  const [collapsed, setCollapsed] = useState(true)
  return (
    <div className="flex h-screen">
      <Sidebar collapsed={collapsed} onToggleSidebar={() => setCollapsed(v => !v)} />
      <div className="bg-white flex-1 overflow-y-auto relative [scrollbar-gutter:stable]">
        {children}
      </div>
    </div>
  )
}

export default Shell


