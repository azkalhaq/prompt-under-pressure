/**
 * Utility functions for handling query parameters consistently across all pages
 */

export interface QueryParams {
  utm_source?: string;
  audio: boolean;
  u?: string;
  [key: string]: string | boolean | undefined;
}

/**
 * Parse and normalize query parameters from URL search params
 * @param searchParams - URLSearchParams object from Next.js useSearchParams()
 * @returns Normalized query parameters object
 */
export function parseQueryParams(searchParams: URLSearchParams): QueryParams {
  const params: QueryParams = {
    audio: false,
  };

  // Parse UTM source
  const utmSource = searchParams.get('utm_source');
  if (utmSource) {
    params.utm_source = utmSource;
  }

  // Parse audio parameter
  const audio = searchParams.get('audio');
  params.audio = audio === '1';

  // Parse user identifier
  const user = searchParams.get('u');
  if (user) {
    params.u = user;
  }

  // Store all query params as string for database storage
  const allParams = searchParams.toString();
  if (allParams) {
    params.query_params = allParams;
  }

  return params;
}

/**
 * Get query parameters from window.location.search
 * @returns Normalized query parameters object
 */
export function getQueryParamsFromWindow(): QueryParams {
  if (typeof window === 'undefined') {
    return { audio: false };
  }

  const searchParams = new URLSearchParams(window.location.search);
  return parseQueryParams(searchParams);
}

/**
 * Check if audio should be enabled based on query parameters
 * @param searchParams - URLSearchParams object
 * @returns boolean indicating if audio should be enabled
 */
export function shouldEnableAudio(searchParams: URLSearchParams): boolean {
  return searchParams.get('audio') === '1';
}

/**
 * Get UTM source from query parameters
 * @param searchParams - URLSearchParams object
 * @returns UTM source string or undefined
 */
export function getUtmSource(searchParams: URLSearchParams): string | undefined {
  return searchParams.get('utm_source') || undefined;
}

/**
 * Get user identifier from query parameters
 * @param searchParams - URLSearchParams object
 * @returns User identifier string or 'anonymous'
 */
export function getUserIdentifier(searchParams: URLSearchParams): string {
  return searchParams.get('u') || 'anonymous';
}

/**
 * Convert query parameters to database-friendly format
 * @param searchParams - URLSearchParams object
 * @returns Object with utm_source, audio, and query_params for database storage
 */
export function getQueryParamsForDatabase(searchParams: URLSearchParams): {
  utm_source?: string;
  audio: boolean;
  query_params: string;
} {
  const utm_source = getUtmSource(searchParams);
  const audio = shouldEnableAudio(searchParams);
  const query_params = searchParams.toString();

  return {
    utm_source,
    audio,
    query_params,
  };
}
