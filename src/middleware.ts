import { NextRequest, NextResponse } from 'next/server';

// Define which routes are protected
const protectedRouteRegexes = [/^\/task-\d+$/];

function isProtectedPath(pathname: string): boolean {
	return protectedRouteRegexes.some((re) => re.test(pathname));
}

export default async function middleware(req: NextRequest) {
	const { pathname, searchParams } = req.nextUrl;

	// Only guard protected routes
	if (!isProtectedPath(pathname)) {
		return NextResponse.next();
	}

	// Accept user_id via query param `u`
	const userId = searchParams.get('u');

	if (!userId) {
		// No user id present; send to login with redirect back to current path
		const redirectUrl = new URL('/login', req.url);
		redirectUrl.searchParams.set('redirect', pathname);
		return NextResponse.redirect(redirectUrl);
	}

	// Validate the user_id against users table via existing API
	try {
		const apiUrl = new URL('/api/users', req.url);
		apiUrl.searchParams.set('user_id', userId);
		const resp = await fetch(apiUrl.toString(), { headers: { 'x-from-middleware': '1' } });
		if (resp.ok) {
			const data = await resp.json().catch(() => null);
			if (data?.success && data?.user) {
				// Check DB submission status and redirect if already submitted
				try {
					const statusUrl = new URL('/api/submission-status', req.url);
					statusUrl.searchParams.set('user_id', userId);
					statusUrl.searchParams.set('path', pathname);
					const sresp = await fetch(statusUrl.toString(), { headers: { 'x-from-middleware': '1' } });
					if (sresp.ok) {
						const sdata = await sresp.json().catch(() => null);
						if (sdata?.success && sdata?.submitted) {
							const thankYouUrl = new URL('/thank-you', req.url);
							thankYouUrl.searchParams.set('u', userId);
							return NextResponse.redirect(thankYouUrl);
						}
					}
				} catch {}
				return NextResponse.next();
			}
		}
	} catch {
		// Fall through to redirect if validation fails
	}

	// Invalid user_id; redirect to login
	const redirectUrl = new URL('/login', req.url);
	redirectUrl.searchParams.set('redirect', pathname);
    redirectUrl.searchParams.set('x', userId);
	return NextResponse.redirect(redirectUrl);
}

export const config = {
	// Do not run on API routes or Next internals
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};


