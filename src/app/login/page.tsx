"use client";
import { useCallback, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function LoginPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [userId, setUserId] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const redirectPath = useMemo(() => {
		const value = searchParams.get('redirect');
		// Only allow redirect to task pages for safety
		if (value && /^\/task-\d+$/.test(value)) return value;
		return '/';
	}, [searchParams]);

	const onSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		if (!userId.trim()) {
			setError('Please enter your valid ID');
			return;
		}
		setLoading(true);
		try {
			const url = new URL('/api/users', window.location.origin);
			url.searchParams.set('user_id', userId.trim());
			const resp = await fetch(url.toString());
			if (!resp.ok) throw new Error('Not found');
			const data = await resp.json();
			if (!data?.success || !data?.user) throw new Error('Invalid user');
			// Redirect back to last task page with ?u=
			const target = new URL(redirectPath, window.location.origin);
			target.searchParams.set('u', userId.trim());
			router.replace(target.pathname + '?' + target.searchParams.toString());
		} catch {
			setError('Invalid ID. Please try again.');
		} finally {
			setLoading(false);
		}
	}, [userId, redirectPath, router]);

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4 py-12">
			<div className="w-full max-w-md">
				<div className="bg-white/90 backdrop-blur shadow-sm ring-1 ring-slate-200 rounded-xl p-6 md:p-8">
					<div className="mb-6 text-center">
						<h1 className="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h1>
						<p className="mt-2 text-sm text-slate-600">
							Enter your assigned <code className="px-1 py-0.5 rounded bg-slate-100">user id</code> to access the task.
						</p>
						{redirectPath !== '/' && (
							<p className="mt-1 text-xs text-slate-500">You will continue to <span className="font-medium">{redirectPath}</span>.</p>
						)}
					</div>

					<form onSubmit={onSubmit} className="space-y-4">
						<div>
							<label htmlFor="user_id" className="block text-sm font-medium text-slate-700">User ID</label>
							<input
								id="user_id"
								type="text"
								inputMode="text"
								autoCapitalize="characters"
								spellCheck={false}
								value={userId}
								onChange={(e) => setUserId(e.target.value)}
								placeholder="e.g. A1B2C"
								className={`mt-1 block w-full rounded-lg border ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-300 focus:border-slate-400 focus:ring-slate-200'} bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring`}
							/>
							{error && (
								<p className="mt-2 text-sm text-red-600" role="alert">{error}</p>
							)}
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-white font-medium shadow hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed"
						>
							{loading ? 'Verifying…' : 'Continue'}
						</button>
					</form>

					<p className="mt-6 text-center text-xs text-slate-500">Having trouble? Contact the study coordinator.</p>
				</div>
			</div>
		</div>
	);
}


