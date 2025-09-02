export interface BrowserFingerprint {
  user_agent: string;
  language: string;
  platform: string;
  screen_width: number;
  screen_height: number;
  timezone: string;
  query_params?: string;
}

/**
 * Collects browser fingerprinting data from the client side
 * This function should be called in the browser environment
 */
export function collectBrowserFingerprint(): BrowserFingerprint {
  return {
    user_agent: navigator.userAgent,
    language: navigator.language || 'en-US',
    platform: navigator.platform || 'unknown',
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
    query_params: window.location.search || undefined
  };
}

/**
 * Collects browser fingerprinting data from the server side
 * This function should be called in the server environment
 */
export function collectServerSideFingerprint(req: Request): Partial<BrowserFingerprint> {
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const acceptLanguage = req.headers.get('accept-language') || 'en-US';
  const language = acceptLanguage.split(',')[0] || 'en-US';
  
  // Extract query parameters from the request URL
  let queryParams = '';
  try {
    const url = new URL(req.url);
    queryParams = url.search || '';
  } catch (error) {
    console.warn('Could not parse request URL for query parameters:', error);
  }
  
  return {
    user_agent: userAgent,
    language: language,
    platform: 'server', // We can't determine platform from server side
    screen_width: 0, // We can't determine screen dimensions from server side
    screen_height: 0,
    timezone: 'UTC', // Default to UTC for server side
    query_params: queryParams || undefined
  };
}
