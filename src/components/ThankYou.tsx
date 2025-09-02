"use client"
import React from 'react';
import { useRouter } from 'next/navigation';
import { LuCheck, LuArrowLeft, LuRefreshCw } from 'react-icons/lu';

interface ThankYouProps {
  sessionId: string;
  userId: string;
}

export default function ThankYou({ sessionId, userId }: ThankYouProps) {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  const handleNewSession = () => {
    // Clear session cookie and redirect to home
    document.cookie = 'sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <LuCheck className="w-12 h-12 text-green-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Thank You for Your Participation!
        </h1>
        
        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
          Your interaction has been successfully recorded. We appreciate the time and effort you have put into this task.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Session Information</h3>
          <div className="text-xs text-gray-500 space-y-1">
            <p>Session ID: {sessionId.slice(0, 8)}...</p>
            <p>User ID: {userId}</p>
            <p>Submission Time: {new Date().toLocaleString()}</p>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 mb-8 text-left">
          <h3 className="text-sm font-medium text-blue-800 mb-2">What happens next?</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Your responses have been recorded for research purposes</li>
            <li>• All data is anonymized and used only for academic research</li>
            <li>• You may close this browser tab or start a new session</li>
          </ul>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            <LuArrowLeft className="w-4 h-4" />
            Go to Home
          </button>
          
          <button
            onClick={handleNewSession}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
          >
            <LuRefreshCw className="w-4 h-4" />
            Start New Session
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            This research is conducted in accordance with ethical guidelines. Thank you for contributing to our understanding of human-AI interaction.
          </p>
        </div>
      </div>
    </div>
  );
}
