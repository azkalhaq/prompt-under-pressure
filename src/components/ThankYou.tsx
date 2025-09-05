"use client"
import React, { useEffect, useState } from 'react';
import { LuCheck} from 'react-icons/lu';
import type { User } from '@/types/user';

interface ThankYouProps {
  sessionId?: string | null;
  userId?: string | null;
}

export default function ThankYou({ sessionId, userId }: ThankYouProps) {
	const [submittedAt, setSubmittedAt] = useState<string>('');
	const [user, setUser] = useState<User | null>(null);
	const [userLoading, setUserLoading] = useState(false);
	const [userError, setUserError] = useState<string | null>(null);

	useEffect(() => {
		setSubmittedAt(new Date().toLocaleString());
	}, []);

	// Fetch user data to get passcode
	useEffect(() => {
		if (!userId) return;

		const fetchUser = async () => {
			setUserLoading(true);
			setUserError(null);
			try {
				const url = new URL('/api/users', window.location.origin);
				url.searchParams.set('user_id', userId);
				const resp = await fetch(url.toString());
				
				if (!resp.ok) {
					throw new Error('Failed to fetch user data');
				}
				
				const data = await resp.json();
				if (!data?.success || !data?.user) {
					throw new Error('Invalid user data received');
				}
				
				setUser(data.user);
			} catch (error) {
				console.error('Error fetching user data:', error);
				setUserError('Failed to load user information');
			} finally {
				setUserLoading(false);
			}
		};

		fetchUser();
	}, [userId]);

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
        
        {/* Passcode Display Section */}
        {user?.passcode && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-green-800 mb-3">Your Unique Passcode</h2>
            <div className="flex items-center justify-center">
              <span className="font-mono text-4xl font-bold text-green-700 bg-white px-6 py-3 rounded-lg shadow-md border-2 border-green-300">
                {user.passcode}
              </span>
            </div>
            <p className="text-sm text-green-700 mt-3 text-center">
              Please save this passcode for your records
            </p>
          </div>
        )}
        
        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Session Information</h3>
          <div className="text-xs text-gray-500 space-y-1">
            <p>Session ID: {sessionId ? `${String(sessionId).slice(0, 8)}...` : 'N/A'}</p>
            <p>User ID: {userId ?? 'N/A'}</p>
            <p>
              Submission Time: 
              <span suppressHydrationWarning>
                {submittedAt || ''}
              </span>
            </p>
            <p>
              Your Passcode: {
                userLoading ? (
                  <span className="text-blue-600">Loading...</span>
                ) : userError ? (
                  <span className="text-red-600">Error loading</span>
                ) : user?.passcode ? (
                  <span className="font-mono font-bold text-lg text-green-600 bg-green-50 px-2 py-1 rounded">
                    {user.passcode}
                  </span>
                ) : (
                  'N/A'
                )
              }
            </p>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 mb-8 text-left">
          <h3 className="text-sm font-medium text-blue-800 mb-2">What happens next?</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Your responses have been recorded for research purposes</li>
            <li>• All data is anonymized and used only for academic research</li>
            <li>• You may close this tab and continue the survey</li>
          </ul>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          
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
