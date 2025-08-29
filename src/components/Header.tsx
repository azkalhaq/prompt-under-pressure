"use client"
import React from 'react'

const Header = () => {
  return (
    <div className='flex items-center gap-2 h-10 sticky top-0 left-0 z-20 p-2 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60'>
      <div className='font-semibold'>Chat GPT 5</div>
    </div>
  )
}

export default Header