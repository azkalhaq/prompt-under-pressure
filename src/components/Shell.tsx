"use client"
import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

type ShellProps = {
  children: React.ReactNode
}

const Shell = ({ children }: ShellProps) => {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="flex">
      <div className="h-screen overflow-y-auto">
        <Sidebar collapsed={collapsed} />
      </div>
      <div className="bg-gray-50 flex-1 h-screen overflow-y-auto relative">
        <Header onToggleSidebar={() => setCollapsed(v => !v)} />
        {children}
      </div>
    </div>
  )
}

export default Shell


