"use client"
import React from 'react'
import { RxHamburgerMenu } from 'react-icons/rx'

type SidebarProps = {
  collapsed: boolean
  onToggleSidebar?: () => void
}

const Sidebar = ({ collapsed, onToggleSidebar }: SidebarProps) => {
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
        <div className={'p-3 text-sm font-semibold'}>
          {/* Nav items header */}
        </div>
      )}
      {/* Add nav items here */}
    </div>
  )
}

export default Sidebar