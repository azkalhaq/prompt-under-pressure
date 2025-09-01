"use client"
import React, { useState } from 'react'
import { RxCross2 } from 'react-icons/rx'

interface SubmissionFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { content: string; confidence: number }) => void
}

const SubmissionForm = ({ isOpen, onClose, onSubmit }: SubmissionFormProps) => {
  const [content, setContent] = useState('')
  const [confidence, setConfidence] = useState(4) // Default to middle value (5)

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
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Modal Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">Submit Your Result</h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              <RxCross2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Email-like composition area */}
            <div className="space-y-4">              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="font-medium">To:</span>
                <span className="text-gray-800">Manager</span>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="font-medium">Subject:</span>
                <span className="text-gray-800">Competitor Analysis Report</span>
              </div>
            </div>

            {/* Content textarea */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Your Analysis:
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your analysis result here..."
                className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default SubmissionForm
