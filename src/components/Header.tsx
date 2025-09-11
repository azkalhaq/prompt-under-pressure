"use client"
import React from 'react'

const Header = () => {
  return (
    <div className='flex items-center gap-2 h-10 sticky top-0 left-0 z-20 p-2 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60 dark:bg-black/40 dark:supports-[backdrop-filter]:bg-black/40'>
      <div className='font-semibold text-gray-900 dark:text-gray-100'>Chat GPT 5</div>
    </div>
  )
}

export default Header