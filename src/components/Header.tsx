"use client"
import React from 'react'
import { RxHamburgerMenu } from 'react-icons/rx'

type HeaderProps = {
  onToggleSidebar?: () => void
}

const Header = ({ onToggleSidebar }: HeaderProps) => {
  return (
    <div className='flex items-center gap-2 h-10 sticky top-0 left-0 z-20 p-2 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60'>
      <button aria-label='Toggle sidebar' onClick={onToggleSidebar} className='p-2 rounded hover:bg-gray-200 active:scale-[0.98]'>
        <RxHamburgerMenu />
      </button>
      <div className='font-semibold'>Chat GPT 5</div>
    </div>
  )
}

export default Header