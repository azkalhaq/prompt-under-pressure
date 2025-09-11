"use client"
import React, { useState, useEffect } from 'react'
import { RxCross2 } from 'react-icons/rx'
import { useSearchParams } from 'next/navigation'

interface SubmissionFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { content: string; confidence: number; audio_code?: string }) => void
}

const SubmissionForm = ({ isOpen, onClose, onSubmit }: SubmissionFormProps) => {
  const searchParams = useSearchParams()
  const [content, setContent] = useState('')
  const [confidence, setConfidence] = useState<number | null>(null) // No default value
  const [audioCode, setAudioCode] = useState('')
  const [animateIn, setAnimateIn] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [audioPlayed, setAudioPlayed] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if content is empty
    if (!content.trim()) {
      // Focus the textarea and show validation message
      const textarea = document.getElementById('content') as HTMLTextAreaElement
      if (textarea) {
        textarea.focus()
        textarea.setCustomValidity('Please enter your analysis before submitting.')
        textarea.reportValidity()
      }
      return
    }
    
    // Check if confidence is selected
    if (confidence === null) {
      // Focus the first confidence option and show validation message
      const firstConfidenceInput = document.querySelector('input[name="confidence"]') as HTMLInputElement
      if (firstConfidenceInput) {
        firstConfidenceInput.focus()
        firstConfidenceInput.setCustomValidity('Please select your confidence level before submitting.')
        firstConfidenceInput.reportValidity()
      }
      return
    }
    
    // Clear any previous validation messages
    const textarea = document.getElementById('content') as HTMLTextAreaElement
    if (textarea) {
      textarea.setCustomValidity('')
    }
    
    // Clear confidence validation messages
    const confidenceInputs = document.querySelectorAll('input[name="confidence"]')
    confidenceInputs.forEach(input => {
      (input as HTMLInputElement).setCustomValidity('')
    })
    
    setShowConfirmation(true)
  }

  const handleConfirmSubmit = () => {
    // Stop the crowd-waiting.wav audio when form is submitted
    const stopAudioEvent = new CustomEvent('audioStop', { detail: { reason: 'form_submitted' } })
    window.dispatchEvent(stopAudioEvent)
    console.log('🎵 Audio stop event dispatched due to form submission')
    
    onSubmit({ content, confidence: confidence!, audio_code: audioCode })
    setContent('')
    setConfidence(null)
    setAudioCode('')
    setShowConfirmation(false)
    onClose()
  }

  const handleCancelConfirmation = () => {
    setShowConfirmation(false)
  }

  const handleClose = () => {
    setContent('')
    setConfidence(null)
    setAudioCode('')
    setShowConfirmation(false)
    setIsClosing(true)
    setAnimateIn(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  useEffect(() => {
    if (!isOpen) return
    // Start enter animations on next frame
    const id = requestAnimationFrame(() => setAnimateIn(true))
    return () => {
      cancelAnimationFrame(id)
      setAnimateIn(false)
      setIsClosing(false)
    }
  }, [isOpen])

  // Play audio-code.mp3 when form opens if audio=1 query parameter is present
  useEffect(() => {
    if (!isOpen || audioPlayed) return
    
    const shouldPlayAudio = searchParams.get('audio') === '1'
    if (shouldPlayAudio) {
      const audio = new Audio('/audio/audio-code.mp3')
      audio.volume = 0.7
      
      const playAudio = async () => {
        try {
          await audio.play()
          setAudioPlayed(true)
        } catch (error) {
          console.warn('Failed to play audio-code.mp3:', error)
        }
      }
      
      // Small delay to ensure form is fully rendered
      setTimeout(playAudio, 500)
    }
  }, [isOpen, audioPlayed, searchParams])

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${animateIn && !isClosing ? 'bg-black/50 opacity-100' : 'bg-black/50 opacity-0'} dark:bg-black/60`}
        onClick={handleClose}
      />

      {/* Right slide-over panel */}
      <div className={`fixed inset-y-0 right-0 z-50 flex w-full sm:w-[520px] md:w-1/2 transform transition-transform duration-300 ease-in-out ${animateIn && !isClosing ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col w-full h-full bg-white shadow-2xl border-l border-gray-200 dark:bg-[#0b0b0b] dark:border-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 dark:bg-[#0f0f0f] dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Submit Your Result</h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 dark:hover:bg-gray-800"
            >
              <RxCross2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 min-h-0">
            {/* Content textarea */}
            <div className="flex-1 min-h-0 flex flex-col">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                Your Analysis:
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  // Clear validation message when user starts typing
                  e.target.setCustomValidity('')
                }}
                placeholder="Write your analysis result here..."
                className="w-full flex-1 min-h-64 max-h-none p-4 border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#0f0f0f] dark:border-gray-800 dark:text-gray-100"
                required
              />
            </div>

            {/* Likert Scale Question */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 dark:text-gray-300">
                How confident are you to submit this result?
              </label>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-red-600">Not at all confident</span>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                    <label key={value} className="flex flex-col items-center">
                      <input
                        type="radio"
                        name="confidence"
                        value={value}
                        checked={confidence === value}
                        onChange={(e) => {
                          setConfidence(Number(e.target.value))
                          // Clear validation message when user selects a confidence level
                          const confidenceInputs = document.querySelectorAll('input[name="confidence"]')
                          confidenceInputs.forEach(input => {
                            (input as HTMLInputElement).setCustomValidity('')
                          })
                        }}
                        className="sr-only"
                        required
                      />
                      <div className={`
                        w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium cursor-pointer transition-all duration-200
                        ${confidence === value 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300'
                        }
                      `}>
                        {value}
                      </div>
                    </label>
                  ))}
                </div>
                <span className="text-sm font-bold text-green-600">Very confident</span>
              </div>
            </div>

            {/* Audio Code Input - Only show when audio=1 is provided */}
            {searchParams.get('audio') === '1' && (
              <div>
                <label htmlFor="audioCode" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                  Audio Code:
                </label>
                <input
                  type="text"
                  id="audioCode"
                  value={audioCode}
                  onChange={(e) => setAudioCode(e.target.value)}
                  placeholder="Enter the audio code you heard..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#0f0f0f] dark:border-gray-800 dark:text-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                  If you heard an audio code when opening this form, please enter it here.
                </p>
              </div>
            )}
          </form>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3 dark:bg-[#0f0f0f] dark:border-gray-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <>
          {/* Confirmation Overlay */}
          <div 
            className="fixed inset-0 z-60 bg-black/60 transition-opacity duration-300"
            onClick={handleCancelConfirmation}
          />

          {/* Confirmation Dialog */}
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100 dark:bg-[#0b0b0b]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Confirm Submission</h3>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <p className="text-gray-700 mb-4 dark:text-gray-300">
                  Are you sure you want to submit your analysis? This action cannot be undone.
                </p>
                
                {/* Show summary of what's being submitted */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4 dark:bg-gray-900">
                  <div className="text-sm text-gray-600 mb-2 dark:text-gray-400">
                    <strong>Confidence Level:</strong> {confidence}/7
                  </div>
                  {audioCode && (
                    <div className="text-sm text-gray-600 mb-2 dark:text-gray-400">
                      <strong>Audio Code:</strong> {audioCode}
                    </div>
                  )}
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Analysis Length:</strong> {content.length} characters
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 dark:border-gray-800">
                <button
                  type="button"
                  onClick={handleCancelConfirmation}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Confirm & Submit
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default SubmissionForm
