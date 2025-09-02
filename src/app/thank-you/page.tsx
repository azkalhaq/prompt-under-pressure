"use client"
import React, { useEffect } from 'react'
import ThankYou from '@/components/ThankYou'
import { useSessionContext } from '@/contexts/SessionContext'

export default function ThankYouPage() {
  const { sessionId, userId } = useSessionContext()

  useEffect(() => {
    // Ensure page starts at top
    try { window.scrollTo({ top: 0 }); } catch {}
  }, [])

  return (
    <ThankYou sessionId={sessionId} userId={userId} />
  )
}


