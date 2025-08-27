"use client"
import React from 'react'

type SidebarProps = {
  collapsed: boolean
}

const Sidebar = ({ collapsed }: SidebarProps) => {
  return (
    <div className={`${collapsed ? 'w-14' : 'w-64'} transition-[width] duration-200 ease-in-out h-full border-r bg-gray-100`}> 
      <div className={`p-3 text-sm font-semibold ${collapsed ? 'text-center' : ''}`}>
        {collapsed ? 'SB' : 'Sidebar'}
      </div>
      {/* Add nav items here */}
    </div>
  )
}

export default Sidebar