"use client"
import React, { useEffect, useState } from 'react';
import { LuCheck, LuCopy } from 'react-icons/lu';
import type { User } from '@/types/user';
import type { UserSession } from '@/lib/user-sessions';

interface ThankYouProps {
  sessionId?: string | null;
  userId?: string | null;
}

export default function ThankYou({ userId }: ThankYouProps) {
	const [user, setUser] = useState<User | null>(null);
	const [copied, setCopied] = useState(false);
	const [completedSessions, setCompletedSessions] = useState<UserSession[]>([]);
	const [sessionsLoading, setSessionsLoading] = useState(false);
	const [sessionsError, setSessionsError] = useState<string | null>(null);

	// Fetch user data to get passcode
	useEffect(() => {
		if (!userId) return;

		const fetchUser = async () => {
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
			}
		};

		fetchUser();
	}, [userId]);

	// Fetch completed sessions data
	useEffect(() => {
		if (!userId) return;

		const fetchCompletedSessions = async () => {
			setSessionsLoading(true);
			setSessionsError(null);
			try {
				const url = new URL('/api/user-sessions', window.location.origin);
				url.searchParams.set('user_id', userId);
				const resp = await fetch(url.toString());
				
				if (!resp.ok) {
					throw new Error('Failed to fetch completed sessions');
				}
				
				const data = await resp.json();
				if (!data?.success) {
					throw new Error('Invalid sessions data received');
				}
				
				setCompletedSessions(data.sessions || []);
			} catch (error) {
				console.error('Error fetching completed sessions:', error);
				setSessionsError('Failed to load session information');
			} finally {
				setSessionsLoading(false);
			}
		};

		fetchCompletedSessions();
	}, [userId]);

	// Copy passcode to clipboard
	const copyPasscode = async () => {
		if (!user?.passcode) return;
		
		try {
			await navigator.clipboard.writeText(user.passcode);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
		} catch (error) {
			console.error('Failed to copy passcode:', error);
			// Fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = user.passcode;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 dark:from-gray-900 dark:to-black">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 text-center dark:bg-[#0b0b0b]">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <LuCheck className="w-12 h-12 text-green-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4 dark:text-gray-100">
          Task Completed!
        </h1>
        
        <p className="text-lg text-gray-600 mb-6 leading-relaxed dark:text-gray-300">
          Your interaction has been successfully recorded. We appreciate the time and effort you have put into this task.
        </p>
        
         {/* Passcode Display Section */}
         {user?.passcode && (
           <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-8 dark:from-gray-900 dark:to-gray-800 dark:border-green-800">
             <h2 className="text-xl font-bold text-green-800 mb-4 dark:text-green-400">Your Unique Passcode</h2>
             <div className="flex items-center justify-center">
               <div className="flex items-center bg-white rounded-lg border border-green-300 overflow-hidden shadow-sm dark:bg-[#0b0b0b] dark:border-green-800">
                 <input
                   type="text"
                   value={user.passcode}
                   readOnly
                   className="font-mono text-lg font-bold text-green-700 px-3 bg-transparent border-none outline-none min-w-0 dark:text-green-400"
                 />
                 <button
                   onClick={copyPasscode}
                   className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 border-l border-green-500"
                   title="Copy passcode to clipboard"
                 >
                   {copied ? (
                     <>
                       <LuCheck className="w-4 h-4" />
                       <span className="text-xs font-medium">Copied!</span>
                     </>
                   ) : (
                     <>
                       <LuCopy className="w-4 h-4" />
                       <span className="text-xs font-medium">Copy</span>
                     </>
                   )}
                 </button>
               </div>
             </div>
             <p className="text-sm text-green-700 mt-4 text-center dark:text-green-400">
               Please use this passcode to continue the survey
             </p>
           </div>
         )}
        
         <div className="bg-gray-50 rounded-lg p-6 mb-8 dark:bg-[#0f0f0f]">
           <h3 className="text-sm font-medium text-gray-700 mb-4 dark:text-gray-300"><b>Session Information</b></h3>
           <div className="text-sm text-gray-600 space-y-1 dark:text-gray-400">
             <div className="flex justify-between items-center">
               <span className="font-medium">User ID:</span>
               <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded dark:bg-gray-800 dark:text-gray-200">
                 {userId ?? 'N/A'}
               </span>
             </div>
             {sessionsLoading ? (
               <div className="text-center py-2">
                 <span className="text-blue-600 text-sm">Loading session data...</span>
               </div>
             ) : sessionsError ? (
               <div className="text-center py-2">
                 <span className="text-red-600 text-sm">Error loading session data</span>
               </div>
             ) : completedSessions.length > 0 ? (
               <div className="space-y-2">
                 <div className="text-xs font-medium text-gray-500 mb-2 dark:text-gray-400">Completed Tasks:</div>
                 {completedSessions.map((session) => (
                   <div key={session.session_id} className="bg-white rounded border p-2 space-y-1 dark:bg-[#0b0b0b] dark:border-gray-800">
                     <div className="flex justify-between items-center">
                       <span className="font-medium text-xs">Task:</span>
                       <span className="text-xs bg-blue-100 px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-100">
                         {session.route_path || 'Unknown'}
                       </span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="font-medium text-xs">Session ID:</span>
                       <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded dark:bg-gray-800 dark:text-gray-200">
                         {session.session_id.slice(0, 8)}...
                       </span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="font-medium text-xs">Submitted:</span>
                       <span className="text-xs">
                         {session.submit_time ? new Date(session.submit_time).toLocaleString() : 'N/A'}
                       </span>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-2">
                 <span className="text-gray-500 text-sm dark:text-gray-400">No completed sessions found</span>
               </div>
             )}
           </div>
         </div>
        
         <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left dark:bg-blue-950/40">
           <h3 className="text-sm font-medium text-blue-800 mb-4 dark:text-blue-300">What happens next?</h3>
           <ul className="text-sm text-blue-700 space-y-3 dark:text-blue-200">
             <li className="flex items-start gap-3">
               <span className="text-blue-500 text-lg leading-none mt-0.5">•</span>
               <span className="leading-relaxed">Use your passcode to continue the survey.</span>
             </li>
             <li className="flex items-start gap-3">
               <span className="text-blue-500 text-lg leading-none mt-0.5">•</span>
               <span className="leading-relaxed">You may close this tab and return to the survey.</span>
             </li>
           </ul>
         </div>
        
         <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
           <p className="text-sm text-gray-500 text-center leading-relaxed dark:text-gray-400">
             This research is conducted in accordance with ethical guidelines.
           </p>
           <p className="text-sm text-gray-500 text-center mt-2 dark:text-gray-400">
              If you experience any issues, please email{' '}
             <a 
               href="mailto:nazkalhaq@student.unimelb.edu.au" 
               className="text-blue-600 hover:text-blue-700 underline dark:text-blue-400 dark:hover:text-blue-300"
             >
               nazkalhaq@student.unimelb.edu.au
             </a>
           </p>
         </div>
      </div>
    </div>
  );
}
