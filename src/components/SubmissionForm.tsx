"use client"
import React, { useState, useEffect } from 'react'
import { RxCross2 } from 'react-icons/rx'

interface SubmissionFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { content: string; confidence: number }) => void
}

const SubmissionForm = ({ isOpen, onClose, onSubmit }: SubmissionFormProps) => {
  const [content, setContent] = useState('')
  const [confidence, setConfidence] = useState(4) // Default to middle value (5)
  const [animateIn, setAnimateIn] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ content, confidence })
    setContent('')
    setConfidence(5)
    onClose()
  }

  const handleClose = () => {
    setContent('')
    setConfidence(5)
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

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${animateIn && !isClosing ? 'bg-black/50 opacity-100' : 'bg-black/50 opacity-0'}`}
        onClick={handleClose}
      />

      {/* Right slide-over panel */}
      <div className={`fixed inset-y-0 right-0 z-50 flex w-full sm:w-[520px] md:w-1/2 transform transition-transform duration-300 ease-in-out ${animateIn && !isClosing ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col w-full h-full bg-white shadow-2xl border-l border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Submit Your Result</h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              <RxCross2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 min-h-0">
            {/* Content textarea */}
            <div className="flex-1 min-h-0 flex flex-col">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Your Analysis:
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your analysis result here..."
                className="w-full flex-1 min-h-64 max-h-none p-4 border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Likert Scale Question */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How confident are you to submit this result?
              </label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Not at all confident</span>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                    <label key={value} className="flex flex-col items-center">
                      <input
                        type="radio"
                        name="confidence"
                        value={value}
                        checked={confidence === value}
                        onChange={(e) => setConfidence(Number(e.target.value))}
                        className="sr-only"
                      />
                      <div className={`
                        w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium cursor-pointer transition-all duration-200
                        ${confidence === value 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600'
                        }
                      `}>
                        {value}
                      </div>
                    </label>
                  ))}
                </div>
                <span className="text-sm text-gray-500">Very confident</span>
              </div>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
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
    </>
  )
}

export default SubmissionForm
