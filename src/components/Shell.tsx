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
      <div className={`${collapsed ? 'w-0' : 'w-64'} h-screen overflow-y-auto transition-[width] duration-200`}> 
        <Sidebar collapsed={collapsed} />
      </div>
      <div className="bg-white flex-1 h-screen overflow-y-auto relative [scrollbar-gutter:stable]">
        <Header onToggleSidebar={() => setCollapsed(v => !v)} />
        {children}
      </div>
    </div>
  )
}

export default Shell


