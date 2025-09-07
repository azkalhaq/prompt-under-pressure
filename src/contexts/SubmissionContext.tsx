"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'

type SubmissionContextType = {
  isSubmissionModalOpen: boolean
  openSubmissionModal: () => void
  closeSubmissionModal: () => void
}

const SubmissionContext = createContext<SubmissionContextType | undefined>(undefined)

export function SubmissionProvider({ children }: { children: React.ReactNode }) {
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false)

  const openSubmissionModal = useCallback(() => {
    setIsSubmissionModalOpen(true)
  }, [])

  const closeSubmissionModal = useCallback(() => {
    setIsSubmissionModalOpen(false)
  }, [])

  return (
    <SubmissionContext.Provider value={{
      isSubmissionModalOpen,
      openSubmissionModal,
      closeSubmissionModal,
    }}>
      {children}
    </SubmissionContext.Provider>
  )
}

export function useSubmission() {
  const context = useContext(SubmissionContext)
  if (context === undefined) {
    throw new Error('useSubmission must be used within a SubmissionProvider')
  }
  return context
}
