"use client"
import React from 'react'

type SidebarProps = {
  collapsed: boolean
}

const Sidebar = ({ collapsed }: SidebarProps) => {
  return (
    <div className={`${collapsed ? 'w-0' : 'w-64'} transition-[width] duration-200 ease-in-out h-full bg-gray-100 overflow-hidden`}> 
      {!collapsed && (
        <div className={'p-3 text-sm font-semibold'}>
          
        </div>
      )}
      {/* Add nav items here */}
    </div>
  )
}

export default Sidebar